import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, createPaymentIntent, formatAmount, fromPence } from '@/lib/stripe'
import { z } from 'zod'

// Schema for creating a payment intent
const createPaymentSchema = z.object({
    amount: z.number().positive(),
    description: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string(),
    receiptEmail: z.string().email().optional(),
})

// Schema for confirming a payment
const confirmPaymentSchema = z.object({
    paymentIntentId: z.string(),
    paymentMethodId: z.string().optional(),
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const projectId = searchParams.get('projectId')
        const clientId = searchParams.get('clientId')
        const status = searchParams.get('status')
        const limit = parseInt(searchParams.get('limit') || '50')
        const offset = parseInt(searchParams.get('offset') || '0')

        // Build where clause
        const where: any = {}
        if (projectId) where.projectId = projectId
        if (clientId) where.clientId = clientId
        if (status) where.status = status

        const payments = await prisma.payment.findMany({
            where,
            include: {
                project: {
                    select: {
                        id: true,
                        name: true,
                        projectNumber: true
                    }
                },
                client: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                invoice: {
                    select: {
                        id: true,
                        invoiceNumber: true,
                        totalAmount: true
                    }
                },
                processedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true
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
        })

        const total = await prisma.payment.count({ where })

        return NextResponse.json({
            success: true,
            payments: payments.map((payment: any) => ({
                ...payment,
                formattedAmount: formatAmount(payment.amount)
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        })

    } catch (error) {
        console.error('Error fetching payments:', error)
        return NextResponse.json(
            { error: 'Failed to fetch payments' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const { amount, description, projectId, clientId, receiptEmail } = createPaymentSchema.parse(body)

        // Get client details
        const client = await prisma.client.findUnique({
            where: { id: clientId },
            include: { showroom: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Create or get Stripe customer
        let stripeCustomerId = client.metadata ? JSON.parse(client.metadata).stripeCustomerId : null

        if (!stripeCustomerId) {
            const stripeCustomer = await stripe.customers.create({
                email: client.email,
                name: `${client.firstName} ${client.lastName}`,
                metadata: {
                    clientId: client.id,
                    showroomId: client.showroomId,
                    source: 'nexus-crm'
                }
            })

            stripeCustomerId = stripeCustomer.id

            // Update client with Stripe customer ID
            await prisma.client.update({
                where: { id: clientId },
                data: {
                    metadata: JSON.stringify({
                        ...JSON.parse(client.metadata || '{}'),
                        stripeCustomerId
                    })
                }
            })
        }

        // Create payment intent
        const paymentIntent = await createPaymentIntent(amount, stripeCustomerId, {
            clientId,
            projectId: projectId || '',
            description: description || `Payment for ${client.firstName} ${client.lastName}`,
        })

        // Create payment record in database
        const payment = await prisma.payment.create({
            data: {
                stripePaymentId: paymentIntent.id,
                amount,
                currency: 'gbp',
                status: 'PENDING',
                paymentMethod: 'CARD',
                description,
                receiptEmail: receiptEmail || client.email,
                projectId,
                clientId,
                showroomId: client.showroomId,
                processedById: session.user.id,
                metadata: JSON.stringify({
                    stripeCustomerId,
                    paymentIntentStatus: paymentIntent.status
                })
            },
            include: {
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'PAYMENT_CREATED',
                description: `Payment intent created for ${formatAmount(amount)}`,
                userId: session.user.id,
                clientId,
                projectId,
                metadata: JSON.stringify({
                    paymentId: payment.id,
                    amount,
                    stripePaymentIntentId: paymentIntent.id
                })
            }
        })

        return NextResponse.json({
            success: true,
            payment,
            clientSecret: paymentIntent.client_secret,
            stripeCustomerId
        })

    } catch (error) {
        console.error('Error creating payment:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create payment' },
            { status: 500 }
        )
    }
}
