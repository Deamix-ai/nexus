import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createEnvelope, getEnvelopeStatus, listEnvelopes } from '@/lib/docusign'
import { z } from 'zod'

const createEnvelopeSchema = z.object({
    templateId: z.string().min(1, 'Template ID is required'),
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().optional(),
    recipients: z.array(z.object({
        name: z.string().min(1),
        email: z.string().email(),
        role: z.string()
    })).min(1, 'At least one recipient is required'),
    clientId: z.string().optional(),
    projectId: z.string().optional()
})

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const envelopeId = url.searchParams.get('id')

        // If specific envelope requested
        if (envelopeId) {
            // For demo purposes, return mock data
            // In production, would call getEnvelopeStatus(accessToken, envelopeId)
            const envelope = {
                id: envelopeId,
                subject: 'Bathroom Renovation Contract',
                status: 'completed',
                createdDate: new Date().toISOString(),
                sentDate: new Date().toISOString(),
                completedDate: new Date().toISOString(),
                documents: [
                    {
                        id: '1',
                        name: 'Bathroom Renovation Contract.pdf',
                        pages: 3
                    }
                ],
                recipients: [
                    {
                        id: '1',
                        name: 'John Smith',
                        email: 'john.smith@example.com',
                        status: 'completed',
                        signedDate: new Date().toISOString()
                    }
                ]
            }

            return NextResponse.json({ envelope })
        }

        // List all envelopes
        // For demo purposes, return mock data
        // In production, would call listEnvelopes(accessToken, options)
        const envelopes = [
            {
                id: 'env_1',
                subject: 'Bathroom Renovation Contract - Smith Project',
                status: 'completed',
                createdDate: new Date(Date.now() - 86400000).toISOString(),
                sentDate: new Date(Date.now() - 86400000).toISOString(),
                completedDate: new Date(Date.now() - 3600000).toISOString(),
                documents: [
                    {
                        id: '1',
                        name: 'Bathroom Contract.pdf',
                        pages: 3
                    }
                ],
                recipients: [
                    {
                        id: '1',
                        name: 'John Smith',
                        email: 'john.smith@example.com',
                        status: 'completed',
                        signedDate: new Date(Date.now() - 3600000).toISOString()
                    }
                ],
                projectId: 'proj_123',
                clientId: 'client_456'
            },
            {
                id: 'env_2',
                subject: 'Quote Acceptance - Johnson Kitchen',
                status: 'sent',
                createdDate: new Date(Date.now() - 7200000).toISOString(),
                sentDate: new Date(Date.now() - 7200000).toISOString(),
                documents: [
                    {
                        id: '1',
                        name: 'Quote Acceptance.pdf',
                        pages: 2
                    }
                ],
                recipients: [
                    {
                        id: '1',
                        name: 'Sarah Johnson',
                        email: 'sarah.johnson@example.com',
                        status: 'sent'
                    }
                ],
                projectId: 'proj_789',
                clientId: 'client_101'
            },
            {
                id: 'env_3',
                subject: 'Project Completion Certificate - Williams',
                status: 'delivered',
                createdDate: new Date(Date.now() - 14400000).toISOString(),
                sentDate: new Date(Date.now() - 14400000).toISOString(),
                documents: [
                    {
                        id: '1',
                        name: 'Completion Certificate.pdf',
                        pages: 1
                    }
                ],
                recipients: [
                    {
                        id: '1',
                        name: 'Mike Williams',
                        email: 'mike.williams@example.com',
                        status: 'delivered'
                    },
                    {
                        id: '2',
                        name: 'Project Manager',
                        email: 'pm@bowmanbathrooms.com',
                        status: 'completed',
                        signedDate: new Date(Date.now() - 10800000).toISOString()
                    }
                ],
                projectId: 'proj_456',
                clientId: 'client_789'
            }
        ]

        return NextResponse.json({ envelopes })

    } catch (error) {
        console.error('Error fetching envelopes:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
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

        // Check permissions - only certain roles can send documents
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'SALES_MANAGER', 'SALESPERSON', 'PROJECT_MANAGER'].includes(user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const body = await request.json()
        const validatedData = createEnvelopeSchema.parse(body)

        // For demo purposes, create a mock envelope
        // In production, would use createEnvelope() from docusign library
        const mockEnvelopeId = `env_${Date.now()}`

        // Store envelope information in database
        // This would be replaced with actual DocuSign integration
        const envelope = {
            id: mockEnvelopeId,
            subject: validatedData.subject,
            status: 'sent',
            createdDate: new Date().toISOString(),
            sentDate: new Date().toISOString(),
            documents: [
                {
                    id: '1',
                    name: `${validatedData.templateId}.pdf`,
                    pages: 3
                }
            ],
            recipients: validatedData.recipients.map((recipient, index) => ({
                id: (index + 1).toString(),
                name: recipient.name,
                email: recipient.email,
                status: 'sent'
            })),
            projectId: validatedData.projectId,
            clientId: validatedData.clientId
        }

        // Log activity
        if (validatedData.projectId) {
            await prisma.activity.create({
                data: {
                    type: 'DOCUMENT',
                    description: `Document sent for signing: ${validatedData.subject}`,
                    projectId: validatedData.projectId,
                    clientId: validatedData.clientId || undefined,
                    userId: session.user.id,
                    metadata: JSON.stringify({
                        envelopeId: mockEnvelopeId,
                        recipients: validatedData.recipients.length,
                        docusign: true
                    })
                }
            })
        }

        return NextResponse.json({
            success: true,
            envelope,
            message: 'Document sent for signing successfully'
        })

    } catch (error) {
        console.error('Error creating envelope:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
