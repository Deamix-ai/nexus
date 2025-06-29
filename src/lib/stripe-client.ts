import { loadStripe } from '@stripe/stripe-js'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

export async function redirectToStripeCheckout(sessionId: string) {
    const stripe = await stripePromise

    if (!stripe) {
        throw new Error('Stripe failed to load')
    }

    const { error } = await stripe.redirectToCheckout({
        sessionId
    })

    if (error) {
        throw error
    }
}

export async function createCheckoutSession(
    items: Array<{
        name: string
        description?: string
        amount: number // in pounds
        quantity: number
    }>,
    options: {
        customerId?: string
        successUrl?: string
        cancelUrl?: string
        mode?: 'payment' | 'subscription'
        metadata?: Record<string, string>
    } = {}
) {
    const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            items,
            ...options
        })
    })

    if (!response.ok) {
        throw new Error('Failed to create checkout session')
    }

    const { sessionId } = await response.json()
    return sessionId
}

export { stripePromise }
