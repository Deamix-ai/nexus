import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { communicationService } from "@/lib/communication-providers";
import { z } from "zod";

const messageCreateSchema = z.object({
    type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE_CALL', 'INTERNAL_NOTE']),
    direction: z.enum(['INBOUND', 'OUTBOUND']).default('OUTBOUND'),
    toEmail: z.string().email().optional(),
    toPhone: z.string().optional(),
    ccEmails: z.array(z.string().email()).optional().default([]),
    bccEmails: z.array(z.string().email()).optional().default([]),
    subject: z.string().optional(),
    body: z.string().min(1, "Message body is required"),
    htmlBody: z.string().optional(),
    templateId: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    metadata: z.record(z.any()).optional().default({}),
    attachments: z.array(z.string()).optional().default([]),
});

const messageQuerySchema = z.object({
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE_CALL', 'INTERNAL_NOTE']).optional(),
    direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
    status: z.enum(['PENDING', 'SENT', 'DELIVERED', 'READ', 'REPLIED', 'FAILED', 'CANCELLED']).optional(),
    limit: z.string().transform(Number).optional().default("50"),
    offset: z.string().transform(Number).optional().default("0"),
});

// GET /api/messages - List messages with filtering
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'messages', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const query = messageQuerySchema.parse(Object.fromEntries(searchParams));

        const where: any = {};

        // Add filters
        if (query.projectId) where.projectId = query.projectId;
        if (query.clientId) where.clientId = query.clientId;
        if (query.type) where.type = query.type;
        if (query.direction) where.direction = query.direction;
        if (query.status) where.status = query.status;

        // Add showroom filter for non-admin users
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            where.showroomId = session.user.showroomId;
        }

        const [messages, total] = await Promise.all([
            prisma.message.findMany({
                where,
                include: {
                    fromUser: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    project: {
                        select: { id: true, name: true, projectNumber: true }
                    },
                    client: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    template: {
                        select: { id: true, name: true, category: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: query.limit,
                skip: query.offset,
            }),
            prisma.message.count({ where })
        ]);

        // Parse JSON fields
        const messagesWithParsedData = messages.map((message: any) => ({
            ...message,
            ccEmails: JSON.parse(message.ccEmails || '[]'),
            bccEmails: JSON.parse(message.bccEmails || '[]'),
            metadata: JSON.parse(message.metadata || '{}'),
            attachments: JSON.parse(message.attachments || '[]'),
        }));

        return NextResponse.json({
            messages: messagesWithParsedData,
            pagination: {
                total,
                limit: query.limit,
                offset: query.offset,
                hasMore: query.offset + query.limit < total
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error fetching messages:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/messages - Send a new message
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'messages', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = messageCreateSchema.parse(body);

        // Verify project/client access if specified
        if (validatedData.projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: validatedData.projectId,
                    ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                        ? { showroomId: session.user.showroomId }
                        : {})
                }
            });
            if (!project) {
                return NextResponse.json({ error: "Project not found" }, { status: 404 });
            }
        }

        if (validatedData.clientId) {
            const client = await prisma.client.findFirst({
                where: {
                    id: validatedData.clientId,
                    ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                        ? { showroomId: session.user.showroomId }
                        : {})
                }
            });
            if (!client) {
                return NextResponse.json({ error: "Client not found" }, { status: 404 });
            }
        }

        // Validate recipient information
        if (validatedData.type === 'EMAIL' && !validatedData.toEmail) {
            return NextResponse.json({ error: "Email address required for email messages" }, { status: 400 });
        }
        if ((validatedData.type === 'SMS' || validatedData.type === 'WHATSAPP') && !validatedData.toPhone) {
            return NextResponse.json({ error: "Phone number required for SMS/WhatsApp messages" }, { status: 400 });
        }

        // Create message record
        const message = await prisma.message.create({
            data: {
                ...validatedData,
                fromUserId: session.user.id,
                showroomId: session.user.showroomId,
                ccEmails: JSON.stringify(validatedData.ccEmails),
                bccEmails: JSON.stringify(validatedData.bccEmails),
                metadata: JSON.stringify(validatedData.metadata),
                attachments: JSON.stringify(validatedData.attachments),
                status: 'PENDING',
            },
            include: {
                fromUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                project: {
                    select: { id: true, name: true, projectNumber: true }
                },
                client: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        // Get user details for sending
        const fromUser = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { firstName: true, lastName: true, email: true }
        });

        // Send the message via external providers
        let sendResult: any = { success: true, messageId: '', externalId: '', provider: 'internal' };
        let messageStatus = 'SENT';

        try {
            if (validatedData.type === 'EMAIL' && validatedData.toEmail) {
                // Send email
                sendResult = await communicationService.sendEmail({
                    to: validatedData.toEmail,
                    cc: validatedData.ccEmails,
                    bcc: validatedData.bccEmails,
                    subject: validatedData.subject || 'Message from Bowman Bathrooms',
                    body: validatedData.body,
                    htmlBody: validatedData.htmlBody,
                    from: fromUser ? `${fromUser.firstName} ${fromUser.lastName} <${fromUser.email}>` : session.user.email,
                    replyTo: session.user.email,
                });

                messageStatus = sendResult.success ? 'SENT' : 'FAILED';
            } else if ((validatedData.type === 'SMS' || validatedData.type === 'WHATSAPP') && validatedData.toPhone) {
                // Send SMS
                sendResult = await communicationService.sendSMS({
                    to: validatedData.toPhone,
                    body: validatedData.body,
                });

                messageStatus = sendResult.success ? 'SENT' : 'FAILED';
            } else if (validatedData.type === 'INTERNAL_NOTE' || validatedData.type === 'PHONE_CALL') {
                // Internal notes and phone calls don't need external sending
                messageStatus = 'SENT';
            }
        } catch (error) {
            console.error('Error sending message:', error);
            messageStatus = 'FAILED';
            sendResult = {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
                provider: 'unknown'
            };
        }

        // Update message with send results
        const updatedMessage = await prisma.message.update({
            where: { id: message.id },
            data: {
                status: messageStatus,
                sentAt: sendResult.success ? new Date() : null,
                externalId: sendResult.externalId || null,
                provider: sendResult.provider || null,
                metadata: JSON.stringify({
                    ...validatedData.metadata,
                    sendResult: {
                        success: sendResult.success,
                        error: sendResult.error || null,
                        provider: sendResult.provider,
                        messageId: sendResult.messageId || null,
                    }
                }),
            },
            include: {
                fromUser: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                project: {
                    select: { id: true, name: true, projectNumber: true }
                },
                client: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                type: validatedData.type === 'EMAIL' ? 'EMAIL' :
                    validatedData.type === 'PHONE_CALL' ? 'CALL' : 'NOTE',
                description: `${validatedData.type} ${validatedData.direction.toLowerCase()}: ${validatedData.subject || 'Message sent'}`,
                userId: session.user.id,
                projectId: validatedData.projectId,
                clientId: validatedData.clientId,
                metadata: JSON.stringify({
                    messageId: message.id,
                    messageType: validatedData.type,
                    recipient: validatedData.toEmail || validatedData.toPhone
                })
            }
        });

        return NextResponse.json({
            ...updatedMessage,
            ccEmails: JSON.parse(updatedMessage.ccEmails || '[]'),
            bccEmails: JSON.parse(updatedMessage.bccEmails || '[]'),
            metadata: JSON.parse(updatedMessage.metadata || '{}'),
            attachments: JSON.parse(updatedMessage.attachments || '[]'),
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
