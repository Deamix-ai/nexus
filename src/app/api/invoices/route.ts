import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, createInvoice, finalizeInvoice, sendInvoice, formatAmount } from '@/lib/stripe'
import { z } from 'zod'

// Schema for creating an invoice
const createInvoiceSchema = z.object({
    title: z.string(),
    description: z.string().optional(),
    clientId: z.string(),
    projectId: z.string().optional(),
    dueDate: z.string().optional(),
    lineItems: z.array(z.object({
        description: z.string(),
        quantity: z.number().positive(),
        unitPrice: z.number().positive()
    })),
    notes: z.string().optional(),
    terms: z.string().optional(),
})

// Schema for updating invoice status
const updateInvoiceSchema = z.object({
    status: z.enum(['DRAFT', 'PENDING', 'SENT', 'VIEWED', 'PAID', 'OVERDUE', 'CANCELED']),
    sendToClient: z.boolean().optional(),
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

        const invoices = await prisma.invoice.findMany({
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
                lineItems: true,
                payments: {
                    select: {
                        id: true,
                        amount: true,
                        status: true,
                        createdAt: true
                    }
                },
                createdBy: {
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

        const total = await prisma.invoice.count({ where })

        return NextResponse.json({
            success: true,
            invoices: invoices.map((invoice: any) => ({
                ...invoice,
                formattedSubtotal: formatAmount(invoice.subtotal),
                formattedTaxAmount: formatAmount(invoice.taxAmount),
                formattedTotalAmount: formatAmount(invoice.totalAmount),
                formattedAmountPaid: formatAmount(invoice.amountPaid),
                formattedAmountDue: formatAmount(invoice.amountDue),
            })),
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        })

    } catch (error) {
        console.error('Error fetching invoices:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices' },
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
        const data = createInvoiceSchema.parse(body)

        // Get client details
        const client = await prisma.client.findUnique({
            where: { id: data.clientId },
            include: { showroom: true }
        })

        if (!client) {
            return NextResponse.json({ error: 'Client not found' }, { status: 404 })
        }

        // Calculate invoice totals
        const subtotal = data.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
        const taxAmount = subtotal * 0.20 // 20% VAT
        const totalAmount = subtotal + taxAmount

        // Generate invoice number
        const invoiceCount = await prisma.invoice.count() + 1
        const invoiceNumber = `INV-${new Date().getFullYear()}-${invoiceCount.toString().padStart(4, '0')}`

        // Create invoice in database
        const invoice = await prisma.invoice.create({
            data: {
                invoiceNumber,
                title: data.title,
                description: data.description,
                status: 'DRAFT',
                dueDate: data.dueDate ? new Date(data.dueDate) : null,
                subtotal,
                taxAmount,
                totalAmount,
                amountDue: totalAmount,
                clientId: data.clientId,
                projectId: data.projectId,
                showroomId: client.showroomId,
                createdById: session.user.id,
                notes: data.notes,
                terms: data.terms || 'Payment due within 30 days of invoice date.',
                lineItems: {
                    create: data.lineItems.map(item => ({
                        description: item.description,
                        quantity: item.quantity,
                        unitPrice: item.unitPrice,
                        totalPrice: item.quantity * item.unitPrice
                    }))
                }
            },
            include: {
                lineItems: true,
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
                type: 'INVOICE_CREATED',
                description: `Invoice ${invoiceNumber} created for ${formatAmount(totalAmount)}`,
                userId: session.user.id,
                clientId: data.clientId,
                projectId: data.projectId,
                metadata: JSON.stringify({
                    invoiceId: invoice.id,
                    invoiceNumber,
                    totalAmount
                })
            }
        })

        return NextResponse.json({
            success: true,
            invoice: {
                ...invoice,
                formattedSubtotal: formatAmount(invoice.subtotal),
                formattedTaxAmount: formatAmount(invoice.taxAmount),
                formattedTotalAmount: formatAmount(invoice.totalAmount),
                formattedAmountDue: formatAmount(invoice.amountDue),
            }
        })

    } catch (error) {
        console.error('Error creating invoice:', error)
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }
        return NextResponse.json(
            { error: 'Failed to create invoice' },
            { status: 500 }
        )
    }
}
