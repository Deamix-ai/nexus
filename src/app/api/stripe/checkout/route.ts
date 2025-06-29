import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createCheckoutSession, createStripeCustomer } from '@/lib/stripe'
import { z } from 'zod'

const checkoutSchema = z.object({
    items: z.array(z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        amount: z.number().positive(),
        quantity: z.number().positive().int()
    })),
    customerId: z.string().optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    mode: z.enum(['payment', 'subscription']).default('payment'),
    successUrl: z.string().url().optional(),
    cancelUrl: z.string().url().optional(),
    metadata: z.record(z.string()).optional()
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const validation = checkoutSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 })
        }

        const {
            items,
            customerId,
            clientId,
            projectId,
            mode,
            successUrl = `${process.env.NEXTAUTH_URL}/dashboard/billing?success=true`,
            cancelUrl = `${process.env.NEXTAUTH_URL}/dashboard/billing?canceled=true`,
            metadata = {}
        } = validation.data

        // Get user for permission checking
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Determine customer
        let stripeCustomerId = customerId
        let client = null

        if (clientId) {
            client = await prisma.client.findUnique({
                where: { id: clientId }
            })

            if (!client) {
                return NextResponse.json({ error: 'Client not found' }, { status: 404 })
            }

            // Check permissions
            if (user.showroomId !== client.showroomId && user.role !== 'ADMIN' && user.role !== 'DIRECTOR') {
                return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
            }

            // Create or get Stripe customer for client
            if (!client.stripeCustomerId) {
                const stripeCustomer = await createStripeCustomer(
                    client.email,
                    `${client.firstName} ${client.lastName}`,
                    {
                        clientId: client.id,
                        showroomId: client.showroomId
                    }
                )

                await prisma.client.update({
                    where: { id: clientId },
                    data: { stripeCustomerId: stripeCustomer.id }
                })

                stripeCustomerId = stripeCustomer.id
            } else {
                stripeCustomerId = client.stripeCustomerId
            }
        }

        // Prepare line items for Stripe
        const lineItems = items.map(item => ({
            price_data: {
                currency: 'gbp',
                product_data: {
                    name: item.name,
                    description: item.description
                },
                unit_amount: Math.round(item.amount * 100) // Convert to pence
            },
            quantity: item.quantity
        }))

        // Create checkout session
        const checkoutSession = await createCheckoutSession(
            stripeCustomerId!,
            lineItems,
            {
                mode,
                successUrl,
                cancelUrl,
                metadata: {
                    ...metadata,
                    userId: session.user.id,
                    showroomId: user.showroomId,
                    ...(clientId && { clientId }),
                    ...(projectId && { projectId })
                }
            }
        )

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'CHECKOUT_SESSION_CREATED',
                description: `Checkout session created for ${items.length} item(s)`,
                userId: session.user.id,
                ...(clientId && { clientId }),
                ...(projectId && { projectId }),
                showroomId: user.showroomId,
                metadata: {
                    sessionId: checkoutSession.id,
                    mode,
                    itemCount: items.length,
                    totalAmount: items.reduce((sum, item) => sum + (item.amount * item.quantity), 0)
                }
            }
        })

        return NextResponse.json({
            sessionId: checkoutSession.id,
            url: checkoutSession.url
        })

    } catch (error) {
        console.error('Error creating checkout session:', error)
        return NextResponse.json({
            error: 'Failed to create checkout session',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
