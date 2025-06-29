import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

export async function POST(request: NextRequest) {
    const body = await request.text()
    const signature = headers().get('stripe-signature')

    if (!signature) {
        return NextResponse.json({ error: 'No signature' }, { status: 400 })
    }

    let event: Stripe.Event

    try {
        event = stripe.webhooks.constructEvent(body, signature, endpointSecret)
    } catch (err: any) {
        console.error('Webhook signature verification failed:', err.message)
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
    }

    try {
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSucceeded(event.data.object as Stripe.PaymentIntent)
                break

            case 'payment_intent.payment_failed':
                await handlePaymentFailed(event.data.object as Stripe.PaymentIntent)
                break

            case 'invoice.payment_succeeded':
                await handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
                break

            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
                break

            case 'customer.subscription.created':
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
                break

            case 'customer.subscription.deleted':
                await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
                break

            default:
                console.log(`Unhandled event type: ${event.type}`)
        }

        return NextResponse.json({ received: true })
    } catch (error) {
        console.error('Error processing webhook:', error)
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
    }
}

async function handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment succeeded:', paymentIntent.id)

    // Update payment record
    await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
            status: 'SUCCEEDED',
            stripeChargeId: paymentIntent.latest_charge as string,
            metadata: JSON.stringify({
                ...JSON.parse((await prisma.payment.findFirst({
                    where: { stripePaymentId: paymentIntent.id }
                }))?.metadata || '{}'),
                paymentIntentStatus: paymentIntent.status,
                processingDate: new Date().toISOString()
            })
        }
    })

    // Get payment details for activity logging
    const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntent.id },
        include: {
            client: true,
            project: true
        }
    })

    if (payment) {
        // Log activity
        await prisma.activity.create({
            data: {
                type: 'PAYMENT_RECEIVED',
                description: `Payment of £${payment.amount} received successfully`,
                userId: payment.processedById,
                clientId: payment.clientId,
                projectId: payment.projectId,
                metadata: JSON.stringify({
                    paymentId: payment.id,
                    stripePaymentIntentId: paymentIntent.id,
                    amount: payment.amount
                })
            }
        })

        // Update invoice if this payment was for an invoice
        if (payment.invoiceId) {
            const invoice = await prisma.invoice.findUnique({
                where: { id: payment.invoiceId }
            })

            if (invoice) {
                const newAmountPaid = invoice.amountPaid + payment.amount
                const newAmountDue = invoice.totalAmount - newAmountPaid
                const newStatus = newAmountDue <= 0 ? 'PAID' : invoice.status

                await prisma.invoice.update({
                    where: { id: payment.invoiceId },
                    data: {
                        amountPaid: newAmountPaid,
                        amountDue: newAmountDue,
                        status: newStatus,
                        paidAt: newAmountDue <= 0 ? new Date() : null
                    }
                })
            }
        }
    }
}

async function handlePaymentFailed(paymentIntent: Stripe.PaymentIntent) {
    console.log('Payment failed:', paymentIntent.id)

    // Update payment record
    await prisma.payment.updateMany({
        where: { stripePaymentId: paymentIntent.id },
        data: {
            status: 'FAILED',
            failureReason: paymentIntent.last_payment_error?.message || 'Payment failed',
            metadata: JSON.stringify({
                ...JSON.parse((await prisma.payment.findFirst({
                    where: { stripePaymentId: paymentIntent.id }
                }))?.metadata || '{}'),
                paymentIntentStatus: paymentIntent.status,
                failureDate: new Date().toISOString(),
                lastPaymentError: paymentIntent.last_payment_error
            })
        }
    })

    // Get payment details for activity logging
    const payment = await prisma.payment.findFirst({
        where: { stripePaymentId: paymentIntent.id }
    })

    if (payment) {
        // Log activity
        await prisma.activity.create({
            data: {
                type: 'PAYMENT_FAILED',
                description: `Payment of £${payment.amount} failed: ${paymentIntent.last_payment_error?.message || 'Unknown error'}`,
                userId: payment.processedById,
                clientId: payment.clientId,
                projectId: payment.projectId,
                metadata: JSON.stringify({
                    paymentId: payment.id,
                    stripePaymentIntentId: paymentIntent.id,
                    failureReason: paymentIntent.last_payment_error?.message
                })
            }
        })
    }
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
    console.log('Invoice payment succeeded:', invoice.id)

    // Update invoice record if it exists
    const dbInvoice = await prisma.invoice.findFirst({
        where: { stripeInvoiceId: invoice.id }
    })

    if (dbInvoice) {
        await prisma.invoice.update({
            where: { id: dbInvoice.id },
            data: {
                status: 'PAID',
                paidAt: new Date(),
                amountPaid: invoice.amount_paid / 100, // Convert from pence
                amountDue: 0
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'INVOICE_PAID',
                description: `Invoice ${dbInvoice.invoiceNumber} paid in full`,
                userId: dbInvoice.createdById,
                clientId: dbInvoice.clientId,
                projectId: dbInvoice.projectId,
                metadata: JSON.stringify({
                    invoiceId: dbInvoice.id,
                    stripeInvoiceId: invoice.id,
                    amountPaid: invoice.amount_paid / 100
                })
            }
        })
    }
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
    console.log('Invoice payment failed:', invoice.id)

    // Update invoice record if it exists
    const dbInvoice = await prisma.invoice.findFirst({
        where: { stripeInvoiceId: invoice.id }
    })

    if (dbInvoice) {
        await prisma.invoice.update({
            where: { id: dbInvoice.id },
            data: {
                status: 'OVERDUE'
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'INVOICE_PAYMENT_FAILED',
                description: `Payment failed for invoice ${dbInvoice.invoiceNumber}`,
                userId: dbInvoice.createdById,
                clientId: dbInvoice.clientId,
                projectId: dbInvoice.projectId,
                metadata: JSON.stringify({
                    invoiceId: dbInvoice.id,
                    stripeInvoiceId: invoice.id
                })
            }
        })
    }
}

async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
    console.log('Subscription updated:', subscription.id)

    // Find subscription in database
    const dbSubscription = await prisma.subscription.findFirst({
        where: { stripeSubscriptionId: subscription.id }
    })

    if (dbSubscription) {
        await prisma.subscription.update({
            where: { id: dbSubscription.id },
            data: {
                status: subscription.status.toUpperCase() as any,
                canceledAt: subscription.canceled_at ? new Date(subscription.canceled_at * 1000) : null,
                endDate: subscription.current_period_end ? new Date(subscription.current_period_end * 1000) : null,
                metadata: JSON.stringify({
                    ...JSON.parse(dbSubscription.metadata || '{}'),
                    stripeStatus: subscription.status,
                    lastUpdated: new Date().toISOString()
                })
            }
        })
    }
}

async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
    console.log('Subscription deleted:', subscription.id)

    // Update subscription record
    await prisma.subscription.updateMany({
        where: { stripeSubscriptionId: subscription.id },
        data: {
            status: 'CANCELED',
            canceledAt: new Date(),
            endDate: new Date()
        }
    })
}
