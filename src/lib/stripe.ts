import Stripe from 'stripe'

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not set')
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: '2025-05-28.basil',
    typescript: true,
})

export const STRIPE_CONFIG = {
    currency: 'gbp',
    country: 'GB',
    paymentMethods: ['card', 'bacs_debit'],
    defaultTaxRate: 0.20, // 20% VAT
}

// Stripe webhook configuration
export const STRIPE_WEBHOOK_CONFIG = {
    endpointSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    events: [
        'payment_intent.succeeded',
        'payment_intent.payment_failed',
        'invoice.payment_succeeded',
        'invoice.payment_failed',
        'customer.subscription.created',
        'customer.subscription.updated',
        'customer.subscription.deleted',
    ]
}

// Helper functions for Stripe operations
export async function createStripeCustomer(
    email: string,
    name: string,
    metadata: Record<string, string> = {}
) {
    return await stripe.customers.create({
        email,
        name,
        metadata: {
            ...metadata,
            source: 'nexus-crm'
        }
    })
}

export async function createPaymentIntent(
    amount: number,
    customerId: string,
    metadata: Record<string, string> = {}
) {
    return await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to pence
        currency: STRIPE_CONFIG.currency,
        customer: customerId,
        automatic_payment_methods: {
            enabled: true,
        },
        metadata: {
            ...metadata,
            source: 'nexus-crm'
        }
    })
}

export async function createInvoice(
    customerId: string,
    lineItems: Array<{
        description: string
        quantity: number
        unitAmount: number // in pence
    }>,
    metadata: Record<string, string> = {}
) {
    // Create invoice items first
    for (const item of lineItems) {
        await stripe.invoiceItems.create({
            customer: customerId,
            amount: item.unitAmount * item.quantity,
            currency: STRIPE_CONFIG.currency,
            description: item.description,
        })
    }

    // Create the invoice
    const invoice = await stripe.invoices.create({
        customer: customerId,
        auto_advance: false,
        collection_method: 'send_invoice',
        days_until_due: 30,
        metadata: {
            ...metadata,
            source: 'nexus-crm'
        }
    })

    return invoice
}

export async function createSubscription(
    customerId: string,
    priceId: string,
    metadata: Record<string, string> = {}
) {
    return await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        payment_settings: { save_default_payment_method: 'on_subscription' },
        expand: ['latest_invoice.payment_intent'],
        metadata: {
            ...metadata,
            source: 'nexus-crm'
        }
    })
}

export async function updateSubscription(
    subscriptionId: string,
    updates: {
        priceId?: string
        metadata?: Record<string, string>
    }
) {
    const updateData: any = {}

    if (updates.priceId) {
        const subscription = await stripe.subscriptions.retrieve(subscriptionId)
        updateData.items = [{
            id: subscription.items.data[0].id,
            price: updates.priceId
        }]
    }

    if (updates.metadata) {
        updateData.metadata = updates.metadata
    }

    return await stripe.subscriptions.update(subscriptionId, updateData)
}

export async function cancelSubscription(subscriptionId: string) {
    return await stripe.subscriptions.cancel(subscriptionId)
}

export async function createCheckoutSession(
    customerId: string,
    lineItems: Array<{
        price?: string
        price_data?: {
            currency: string
            product_data: {
                name: string
                description?: string
            }
            unit_amount: number
        }
        quantity: number
    }>,
    options: {
        mode?: 'payment' | 'subscription' | 'setup'
        successUrl: string
        cancelUrl: string
        metadata?: Record<string, string>
    }
) {
    return await stripe.checkout.sessions.create({
        customer: customerId,
        line_items: lineItems,
        mode: options.mode || 'payment',
        success_url: options.successUrl,
        cancel_url: options.cancelUrl,
        metadata: {
            ...options.metadata,
            source: 'nexus-crm'
        }
    })
}

export async function retrievePaymentIntent(paymentIntentId: string) {
    return await stripe.paymentIntents.retrieve(paymentIntentId)
}

export async function retrieveInvoice(invoiceId: string) {
    return await stripe.invoices.retrieve(invoiceId)
}

export async function sendInvoice(invoiceId: string) {
    return await stripe.invoices.sendInvoice(invoiceId)
}

export async function markInvoiceAsPaid(invoiceId: string) {
    return await stripe.invoices.pay(invoiceId, {
        paid_out_of_band: true
    })
}

export async function finalizeInvoice(invoiceId: string) {
    return await stripe.invoices.finalizeInvoice(invoiceId)
}

// Format amount for display
export function formatAmount(amount: number, currency = 'GBP'): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency,
    }).format(amount / 100) // Convert from pence to pounds
}

// Convert pounds to pence for Stripe
export function toPence(pounds: number): number {
    return Math.round(pounds * 100)
}

// Convert pence to pounds from Stripe
export function fromPence(pence: number): number {
    return pence / 100
}
