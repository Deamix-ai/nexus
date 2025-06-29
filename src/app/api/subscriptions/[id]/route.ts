import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'
import { z } from 'zod'

// Validation schemas
const updateSubscriptionSchema = z.object({
    status: z.enum(['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid']).optional(),
    priceId: z.string().optional(),
    description: z.string().optional(),
    metadata: z.record(z.string()).optional()
})

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscriptionId = params.id

        // Get subscription with related data
        const subscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
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
            }
        })

        if (!subscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Check user permissions
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user || (user.showroomId !== subscription.showroomId && user.role !== 'ADMIN' && user.role !== 'DIRECTOR')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Get latest Stripe subscription data
        let stripeSubscription = null
        if (subscription.stripeSubscriptionId) {
            try {
                stripeSubscription = await stripe.subscriptions.retrieve(subscription.stripeSubscriptionId)
            } catch (error) {
                console.error('Error fetching Stripe subscription:', error)
            }
        }

        // Format subscription for response
        const formattedSubscription = {
            ...subscription,
            formattedAmount: new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: subscription.currency
            }).format(subscription.amount / 100),
            stripeData: stripeSubscription
        }

        return NextResponse.json({ subscription: formattedSubscription })

    } catch (error) {
        console.error('Error fetching subscription:', error)
        return NextResponse.json({
            error: 'Failed to fetch subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscriptionId = params.id
        const body = await request.json()
        const validation = updateSubscriptionSchema.safeParse(body)

        if (!validation.success) {
            return NextResponse.json({
                error: 'Validation failed',
                details: validation.error.format()
            }, { status: 400 })
        }

        const { status, priceId, description, metadata } = validation.data

        // Get existing subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId },
            include: { client: true }
        })

        if (!existingSubscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Check user permissions
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user || (user.showroomId !== existingSubscription.showroomId && user.role !== 'ADMIN' && user.role !== 'DIRECTOR')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Update Stripe subscription if needed
        let stripeSubscription = null
        if (existingSubscription.stripeSubscriptionId) {
            const stripeUpdates: any = {}

            if (priceId) {
                // Update subscription price
                stripeSubscription = await stripe.subscriptions.retrieve(existingSubscription.stripeSubscriptionId)
                await stripe.subscriptions.update(existingSubscription.stripeSubscriptionId, {
                    items: [{
                        id: stripeSubscription.items.data[0].id,
                        price: priceId
                    }]
                })
            }

            if (status === 'canceled') {
                // Cancel subscription
                stripeSubscription = await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId)
            }

            if (metadata) {
                await stripe.subscriptions.update(existingSubscription.stripeSubscriptionId, {
                    metadata: {
                        ...existingSubscription.metadata,
                        ...metadata
                    }
                })
            }
        }

        // Update subscription in database
        const updateData: any = {}
        if (status) updateData.status = status
        if (description !== undefined) updateData.description = description
        if (metadata) updateData.metadata = { ...existingSubscription.metadata, ...metadata }

        if (stripeSubscription) {
            updateData.currentPeriodStart = new Date(stripeSubscription.current_period_start * 1000)
            updateData.currentPeriodEnd = new Date(stripeSubscription.current_period_end * 1000)
            if (stripeSubscription.items.data[0]?.price.unit_amount) {
                updateData.amount = stripeSubscription.items.data[0].price.unit_amount
            }
        }

        const updatedSubscription = await prisma.subscription.update({
            where: { id: subscriptionId },
            data: updateData,
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
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'SUBSCRIPTION_UPDATED',
                description: `Subscription updated: ${existingSubscription.planId}`,
                userId: session.user.id,
                clientId: existingSubscription.clientId,
                showroomId: existingSubscription.showroomId,
                metadata: {
                    subscriptionId: updatedSubscription.id,
                    changes: validation.data
                }
            }
        })

        // Format subscription for response
        const formattedSubscription = {
            ...updatedSubscription,
            formattedAmount: new Intl.NumberFormat('en-GB', {
                style: 'currency',
                currency: updatedSubscription.currency
            }).format(updatedSubscription.amount / 100)
        }

        return NextResponse.json({ subscription: formattedSubscription })

    } catch (error) {
        console.error('Error updating subscription:', error)
        return NextResponse.json({
            error: 'Failed to update subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const subscriptionId = params.id

        // Get existing subscription
        const existingSubscription = await prisma.subscription.findUnique({
            where: { id: subscriptionId }
        })

        if (!existingSubscription) {
            return NextResponse.json({ error: 'Subscription not found' }, { status: 404 })
        }

        // Check user permissions
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user || (user.showroomId !== existingSubscription.showroomId && user.role !== 'ADMIN' && user.role !== 'DIRECTOR')) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        // Cancel Stripe subscription if exists
        if (existingSubscription.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(existingSubscription.stripeSubscriptionId)
            } catch (error) {
                console.error('Error canceling Stripe subscription:', error)
            }
        }

        // Delete subscription from database
        await prisma.subscription.delete({
            where: { id: subscriptionId }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'SUBSCRIPTION_DELETED',
                description: `Subscription deleted: ${existingSubscription.planId}`,
                userId: session.user.id,
                clientId: existingSubscription.clientId,
                showroomId: existingSubscription.showroomId,
                metadata: {
                    subscriptionId,
                    planId: existingSubscription.planId
                }
            }
        })

        return NextResponse.json({ success: true })

    } catch (error) {
        console.error('Error deleting subscription:', error)
        return NextResponse.json({
            error: 'Failed to delete subscription',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
