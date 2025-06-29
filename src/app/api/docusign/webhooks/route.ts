import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

// Mock webhook events data
const mockWebhookEvents = [
    {
        id: 'wh_1',
        envelopeId: 'env_123',
        eventType: 'envelope-sent',
        timestamp: new Date(Date.now() - 60000).toISOString(),
        status: 'success',
        data: {
            envelopeId: 'env_123',
            subject: 'Bathroom Renovation Contract',
            status: 'sent',
            recipients: [
                { email: 'customer@example.com', status: 'sent' }
            ]
        }
    },
    {
        id: 'wh_2',
        envelopeId: 'env_123',
        eventType: 'envelope-delivered',
        timestamp: new Date(Date.now() - 30000).toISOString(),
        status: 'success',
        data: {
            envelopeId: 'env_123',
            subject: 'Bathroom Renovation Contract',
            status: 'delivered',
            recipients: [
                { email: 'customer@example.com', status: 'delivered' }
            ]
        }
    },
    {
        id: 'wh_3',
        envelopeId: 'env_456',
        eventType: 'recipient-signed',
        timestamp: new Date(Date.now() - 10000).toISOString(),
        status: 'success',
        data: {
            envelopeId: 'env_456',
            subject: 'Kitchen Installation Agreement',
            status: 'signed',
            recipient: {
                email: 'client@example.com',
                status: 'completed',
                signedDateTime: new Date().toISOString()
            }
        }
    },
    {
        id: 'wh_4',
        envelopeId: 'env_789',
        eventType: 'envelope-completed',
        timestamp: new Date(Date.now() - 5000).toISOString(),
        status: 'success',
        data: {
            envelopeId: 'env_789',
            subject: 'Service Agreement',
            status: 'completed',
            completedDateTime: new Date().toISOString(),
            recipients: [
                { email: 'business@example.com', status: 'completed' }
            ]
        }
    }
]

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Return mock webhook events with recent activity
        return NextResponse.json({
            success: true,
            events: mockWebhookEvents.sort((a, b) =>
                new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            )
        })

    } catch (error) {
        console.error('DocuSign webhook fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch webhook events' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        // This endpoint handles incoming webhooks from DocuSign
        const webhookData = await request.json()

        console.log('DocuSign webhook received:', webhookData)

        // In a real implementation, you would:
        // 1. Verify the webhook signature
        // 2. Process the event data
        // 3. Update your database
        // 4. Send notifications if needed

        // For now, return success
        return NextResponse.json({
            success: true,
            message: 'Webhook processed successfully'
        })

    } catch (error) {
        console.error('DocuSign webhook processing error:', error)
        return NextResponse.json(
            { error: 'Failed to process webhook' },
            { status: 500 }
        )
    }
}

// Handle webhook configuration
export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { url, events } = await request.json()

        // In a real implementation, configure DocuSign webhooks
        console.log('Configuring DocuSign webhook:', { url, events })

        return NextResponse.json({
            success: true,
            message: 'Webhook configuration updated',
            webhookUrl: url,
            enabledEvents: events
        })

    } catch (error) {
        console.error('DocuSign webhook configuration error:', error)
        return NextResponse.json(
            { error: 'Failed to configure webhook' },
            { status: 500 }
        )
    }
}
