import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, createStripeCustomer } from '@/lib/stripe'
import { z } from 'zod'

// Validation schemas
const createSubscriptionSchema = z.object({
    clientId: z.string().min(1, 'Client ID is required'),
    planId: z.string().min(1, 'Plan ID is required'),
    priceId: z.string().min(1, 'Price ID is required'),
    description: z.string().optional(),
    metadata: z.record(z.string()).optional()
})

const listSubscriptionsSchema = z.object({
    clientId: z.string().optional(),
    showroomId: z.string().optional(),
    status: z.enum(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid']).optional(),
    limit: z.string().transform(val => parseInt(val) || 10).optional(),
    offset: z.string().transform(val => parseInt(val) || 0).optional()
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = createSubscriptionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 })
        }

        const { clientId, planId, priceId, description, metadata } = validation.data

        // Get client details
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { showroom: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Check user permissions for the client's showroom
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user || (user.showroomId !== client.showroomId && user.role !== 'ADMIN' && user.role !== 'DIRECTOR')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Create or get Stripe customer
        let stripeCustomerId = client.stripeCustomerId
        if (!stripeCustomerId) {
            const stripeCustomer = await createStripeCustomer(
                client.email,
                `${client.firstName} ${client.lastName}`,
                {
                    clientId: client.id,
                    showroomId: client.showroomId
                }
            )
            stripeCustomerId = stripeCustomer.id

            // Update client with Stripe customer ID
            await prisma.client.update({
                where: { id: clientId },
                data: { stripeCustomerId }
            })
        }

        // Create Stripe subscription
        const stripeSubscription = await stripe.subscriptions.create({
            customer: stripeCustomerId,
            items: [{ price: priceId }],
            payment_behavior: 'default_incomplete',
            payment_settings: { save_default_payment_method: 'on_subscription' },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                clientId,
                showroomId: client.showroomId,
                planId,
                ...(metadata || {})
            }
        })

        // Create subscription in database
        const subscription = await prisma.subscription.create({
            data: {
                stripeSubscriptionId: stripeSubscription.id,
                clientId,
                showroomId: client.showroomId,
                planId,
                status: stripeSubscription.status as any,
                currentPeriodStart: new Date(stripeSubscription.current_period_start * 1000),
                currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
                amount: stripeSubscription.items.data[0]?.price.unit_amount || 0,
                currency: stripeSubscription.items.data[0]?.price.currency || 'gbp',
                description,
                metadata: metadata || {}
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'SUBSCRIPTION_CREATED',
                description: `Subscription created: ${planId}`,
                userId: session.user.id,
                clientId,
                showroomId: client.showroomId,
                metadata: {
                    subscriptionId: subscription.id,
                    stripeSubscriptionId: stripeSubscription.id,
                    amount: subscription.amount,
                    planId
                }
            }
        })

        // Include client and latest invoice in response
        const subscriptionWithDetails = await prisma.subscription.findUnique({
            where: { id: subscription.id },
            include: {
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        })

        return NextResponse.json({
            subscription: subscriptionWithDetails,
            stripeClientSecret: (stripeSubscription.latest_invoice as any)?.payment_intent?.client_secret
        })

    } catch (error) {
        console.error('Error creating subscription:', error)
        return NextResponse.json({
            error: 'Failed to create subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const validation = listSubscriptionsSchema.safeParse(Object.fromEntries(searchParams))

        if (!validation.success) {
            return NextResponse.json({
                error: 'Invalid query parameters',
                details: validation.error.format()
            }, { status: 400 })
        }

        const { clientId, showroomId, status, limit = 10, offset = 0 } = validation.data

        // Get user details for permission checking
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Build where clause based on user permissions
        const whereClause: any = {}

        if (user.role === 'ADMIN' || user.role === 'DIRECTOR') {
            // Admins and directors can see all subscriptions
            if (showroomId) whereClause.showroomId = showroomId
            if (clientId) whereClause.clientId = clientId
        } else {
            // Other users can only see subscriptions from their showroom
            whereClause.showroomId = user.showroomId
            if (clientId) whereClause.clientId = clientId
        }

        if (status) whereClause.status = status

        // Get subscriptions with pagination
        const [subscriptions, total] = await Promise.all([
            prisma.subscription.findMany({
                where: whereClause,
                include: {
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true
                        }
                    },
                    showroom: {
                        select: {
                            id: true,
                            name: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset
            }),
            prisma.subscription.count({ where: whereClause })
        ])

        // Format subscriptions for response
        const formattedSubscriptions = subscriptions.map(subscription => ({
            ...subscription,
            formattedAmount: new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: subscription.currency
            }).format(subscription.amount / 100)
        }))

        return NextResponse.json({
            subscriptions: formattedSubscriptions,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        })

    } catch (error) {
        console.error('Error fetching subscriptions:', error)
        return NextResponse.json({
            error: 'Failed to fetch subscriptions',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
