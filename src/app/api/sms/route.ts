import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendSMS, sendBulkSMS, getSMSStatus, validatePhoneNumber, formatSMSMessage, SMS_TEMPLATES } from '@/lib/twilio'
import { z } from 'zod'

// Validation schemas
const sendSMSSchema = z.object({
    to: z.string().min(1, 'Phone number is required'),
    message: z.string().min(1, 'Message is required').max(1600, 'Message too long'),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    templateId: z.string().optional(),
    variables: z.record(z.union([z.string(), z.number()])).optional(),
    mediaUrl: z.array(z.string().url()).optional(),
    metadata: z.record(z.string()).optional()
})

const bulkSMSSchema = z.object({
    recipients: z.array(z.object({
        to: z.string().min(1),
        message: z.string().min(1).max(1600),
        clientId: z.string().optional(),
        projectId: z.string().optional(),
        variables: z.record(z.union([z.string(), z.number()])).optional(),
        mediaUrl: z.array(z.string().url()).optional(),
        metadata: z.record(z.string()).optional()
    })).min(1).max(100), // Limit bulk sends to 100 recipients
    templateId: z.string().optional(),
    globalVariables: z.record(z.union([z.string(), z.number()])).optional()
})

const smsStatusSchema = z.object({
    messageId: z.string().min(1, 'Message ID is required')
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const action = url.searchParams.get('action') || 'send'

        // Get user details for permission checking
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            include: { showroom: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Check if user has permission to send SMS
        if (!['ADMIN', 'DIRECTOR', 'SALES_MANAGER', 'SALESPERSON'].includes(user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions to send SMS' }, { status: 403 })
        }

        const body = await request.json()

        switch (action) {
            case 'send':
                return await handleSendSMS(body, user)
            case 'bulk':
                return await handleBulkSMS(body, user)
            case 'status':
                return await handleSMSStatus(body, user)
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error('SMS API Error:', error)
        return NextResponse.json({
            error: 'Failed to process SMS request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

async function handleSendSMS(body: any, user: any) {
    const validation = sendSMSSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: validation.error.format()
        }, { status: 400 })
    }

    const { to, message, clientId, projectId, templateId, variables, mediaUrl, metadata } = validation.data

    // Validate phone number
    const phoneValidation = validatePhoneNumber(to)
    if (!phoneValidation.isValid) {
        return NextResponse.json({
            error: 'Invalid phone number',
            details: phoneValidation.error
        }, { status: 400 })
    }

    // Check if user has access to the client/project
    if (clientId) {
        const client = await prisma.client.findUnique({
            where: { id: clientId }
        })

        if (!client || (user.showroomId !== client.showroomId && !['ADMIN', 'DIRECTOR'].includes(user.role))) {
            return NextResponse.json({ error: 'Access denied to client' }, { status: 403 })
        }
    }

    if (projectId) {
        const project = await prisma.project.findUnique({
            where: { id: projectId },
            include: { client: true }
        })

        if (!project || (user.showroomId !== project.showroomId && !['ADMIN', 'DIRECTOR'].includes(user.role))) {
            return NextResponse.json({ error: 'Access denied to project' }, { status: 403 })
        }
    }

    try {
        // Format message with template if provided
        let finalMessage = message
        if (templateId && variables) {
            const template = Object.values(SMS_TEMPLATES).find(t => t.id === templateId)
            if (template) {
                finalMessage = formatSMSMessage(template.template, variables)
            }
        }

        // Send SMS
        const result = await sendSMS(phoneValidation.formatted!, finalMessage, {
            mediaUrl,
            metadata: {
                ...metadata,
                userId: user.id,
                showroomId: user.showroomId,
                ...(clientId && { clientId }),
                ...(projectId && { projectId })
            }
        })

        // Log the SMS in database
        await prisma.message.create({
            data: {
                type: 'SMS',
                content: finalMessage,
                recipient: phoneValidation.formatted!,
                status: 'SENT',
                userId: user.id,
                showroomId: user.showroomId,
                ...(clientId && { clientId }),
                ...(projectId && { projectId }),
                externalId: result.messageId,
                metadata: {
                    twilioData: result,
                    templateId,
                    variables
                }
            }
        })

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'SMS_SENT',
                description: `SMS sent to ${phoneValidation.formatted}`,
                userId: user.id,
                showroomId: user.showroomId,
                ...(clientId && { clientId }),
                ...(projectId && { projectId }),
                metadata: {
                    messageId: result.messageId,
                    phoneNumber: phoneValidation.formatted,
                    messageLength: finalMessage.length
                }
            }
        })

        return NextResponse.json({
            success: true,
            messageId: result.messageId,
            status: result.status,
            to: result.to,
            cost: result.cost
        })

    } catch (error) {
        console.error('Error sending SMS:', error)
        return NextResponse.json({
            error: 'Failed to send SMS',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

async function handleBulkSMS(body: any, user: any) {
    const validation = bulkSMSSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: validation.error.format()
        }, { status: 400 })
    }

    const { recipients, templateId, globalVariables } = validation.data

    // Validate all phone numbers first
    const validatedRecipients = []
    const validationErrors = []

    for (const recipient of recipients) {
        const phoneValidation = validatePhoneNumber(recipient.to)
        if (!phoneValidation.isValid) {
            validationErrors.push({
                recipient: recipient.to,
                error: phoneValidation.error
            })
        } else {
            validatedRecipients.push({
                ...recipient,
                to: phoneValidation.formatted!
            })
        }
    }

    if (validationErrors.length > 0) {
        return NextResponse.json({
            error: 'Phone number validation failed',
            details: validationErrors
        }, { status: 400 })
    }

    try {
        // Prepare bulk SMS data
        const bulkData = validatedRecipients.map(recipient => {
            let message = recipient.message

            // Apply template if provided
            if (templateId) {
                const template = Object.values(SMS_TEMPLATES).find(t => t.id === templateId)
                if (template) {
                    const variables = { ...globalVariables, ...recipient.variables }
                    message = formatSMSMessage(template.template, variables)
                }
            }

            return {
                to: recipient.to,
                message,
                mediaUrl: recipient.mediaUrl,
                metadata: {
                    userId: user.id,
                    showroomId: user.showroomId,
                    ...(recipient.clientId && { clientId: recipient.clientId }),
                    ...(recipient.projectId && { projectId: recipient.projectId })
                }
            }
        })

        // Send bulk SMS
        const results = await sendBulkSMS(bulkData)

        // Log results in database
        const messagePromises = results.map(async (result, index) => {
            const recipient = validatedRecipients[index]

            await prisma.message.create({
                data: {
                    type: 'SMS',
                    content: bulkData[index].message,
                    recipient: result.recipient,
                    status: result.success ? 'SENT' : 'FAILED',
                    userId: user.id,
                    showroomId: user.showroomId,
                    ...(recipient.clientId && { clientId: recipient.clientId }),
                    ...(recipient.projectId && { projectId: recipient.projectId }),
                    externalId: result.messageId,
                    metadata: {
                        templateId,
                        variables: { ...globalVariables, ...recipient.variables },
                        bulkSend: true,
                        error: result.error
                    }
                }
            })
        })

        await Promise.all(messagePromises)

        // Log activity
        const successCount = results.filter(r => r.success).length
        const failedCount = results.filter(r => !r.success).length

        await prisma.activity.create({
            data: {
                type: 'BULK_SMS_SENT',
                description: `Bulk SMS sent: ${successCount} successful, ${failedCount} failed`,
                userId: user.id,
                showroomId: user.showroomId,
                metadata: {
                    totalRecipients: recipients.length,
                    successCount,
                    failedCount,
                    templateId
                }
            }
        })

        return NextResponse.json({
            success: true,
            totalSent: recipients.length,
            successCount,
            failedCount,
            results
        })

    } catch (error) {
        console.error('Error sending bulk SMS:', error)
        return NextResponse.json({
            error: 'Failed to send bulk SMS',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

async function handleSMSStatus(body: any, user: any) {
    const validation = smsStatusSchema.safeParse(body)

    if (!validation.success) {
        return NextResponse.json({
            error: 'Validation failed',
            details: validation.error.format()
        }, { status: 400 })
    }

    const { messageId } = validation.data

    try {
        // Get SMS status from Twilio
        const status = await getSMSStatus(messageId)

        // Update status in database
        await prisma.message.updateMany({
            where: {
                externalId: messageId,
                userId: user.id // Ensure user can only check their own messages
            },
            data: {
                status: status.status.toUpperCase(),
                metadata: {
                    twilioStatus: status
                }
            }
        })

        return NextResponse.json({
            success: true,
            status
        })

    } catch (error) {
        console.error('Error getting SMS status:', error)
        return NextResponse.json({
            error: 'Failed to get SMS status',
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

        const url = new URL(request.url)
        const action = url.searchParams.get('action') || 'templates'

        switch (action) {
            case 'templates':
                return NextResponse.json({
                    templates: Object.values(SMS_TEMPLATES)
                })
            case 'history':
                return await getSMSHistory(session.user.id)
            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error('SMS API GET Error:', error)
        return NextResponse.json({
            error: 'Failed to process request',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}

async function getSMSHistory(userId: string) {
    try {
        // Get user details for permission checking
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: { showroom: true }
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Build where clause based on user permissions
        const whereClause: any = {
            type: 'SMS'
        }

        if (!['ADMIN', 'DIRECTOR'].includes(user.role)) {
            // Non-admin users can only see SMS from their showroom
            whereClause.showroomId = user.showroomId
        }

        const messages = await prisma.message.findMany({
            where: whereClause,
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                client: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                project: {
                    select: {
                        name: true,
                        projectNumber: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' },
            take: 100 // Limit to last 100 SMS messages
        })

        return NextResponse.json({
            messages: messages.map(msg => ({
                id: msg.id,
                content: msg.content,
                recipient: msg.recipient,
                status: msg.status,
                createdAt: msg.createdAt,
                user: msg.user,
                client: msg.client,
                project: msg.project,
                metadata: msg.metadata
            }))
        })

    } catch (error) {
        console.error('Error fetching SMS history:', error)
        return NextResponse.json({
            error: 'Failed to fetch SMS history',
            details: error instanceof Error ? error.message : 'Unknown error'
        }, { status: 500 })
    }
}
