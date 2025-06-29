import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const documentCreateSchema = z.object({
    name: z.string().min(1, "Document name is required"),
    type: z.enum(['QUOTE', 'CONTRACT', 'INVOICE', 'DESIGN', 'PHOTO', 'CERTIFICATE', 'OTHER']),
    description: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
    isPublic: z.boolean().default(false),
    expiresAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

// GET /api/documents - List documents with filtering
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const projectId = searchParams.get('projectId');
        const clientId = searchParams.get('clientId');
        const type = searchParams.get('type');
        const search = searchParams.get('search');
        const limit = parseInt(searchParams.get('limit') || '50');
        const offset = parseInt(searchParams.get('offset') || '0');

        const where: any = {};

        // Add filters
        if (projectId) where.projectId = projectId;
        if (clientId) where.clientId = clientId;
        if (type) where.type = type;
        if (search) {
            where.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        // Add showroom filter for non-admin users
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            where.showroomId = session.user.showroomId;
        }

        const [documents, total] = await Promise.all([
            prisma.document.findMany({
                where,
                include: {
                    project: {
                        select: { id: true, name: true, projectNumber: true }
                    },
                    client: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    uploadedBy: {
                        select: { id: true, firstName: true, lastName: true, email: true }
                    },
                    showroom: {
                        select: { id: true, name: true }
                    }
                },
                orderBy: { createdAt: 'desc' },
                take: limit,
                skip: offset,
            }),
            prisma.document.count({ where })
        ]);

        // Parse tags from JSON strings
        const documentsWithParsedTags = documents.map((doc: any) => ({
            ...doc,
            tags: JSON.parse(doc.tags || '[]')
        }));

        return NextResponse.json({
            documents: documentsWithParsedTags,
            pagination: {
                total,
                limit,
                offset,
                hasMore: offset + limit < total
            }
        });

    } catch (error) {
        console.error("Error fetching documents:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/documents - Create document record (file upload handled separately)
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = documentCreateSchema.parse(body);

        // Verify project/client access
        if (validatedData.projectId) {
            const project = await prisma.project.findFirst({
                where: {
                    id: validatedData.projectId,
                    showroomId: session.user.showroomId
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
                    showroomId: session.user.showroomId
                }
            });
            if (!client) {
                return NextResponse.json({ error: "Client not found" }, { status: 404 });
            }
        }

        const document = await prisma.document.create({
            data: {
                ...validatedData,
                uploadedById: session.user.id,
                showroomId: session.user.showroomId,
                version: 1,
                status: 'ACTIVE',
                tags: JSON.stringify(validatedData.tags || []),
                // File details will be updated after upload
                fileUrl: '', // To be updated after file upload
                fileName: '',
                fileSize: 0,
                mimeType: '',
            },
            include: {
                project: {
                    select: { id: true, name: true, projectNumber: true }
                },
                client: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                uploadedBy: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                }
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'DOCUMENT_UPLOAD',
                description: `Document "${document.name}" uploaded`,
                userId: session.user.id,
                projectId: validatedData.projectId,
                clientId: validatedData.clientId,
                metadata: JSON.stringify({
                    documentId: document.id,
                    documentType: document.type,
                    documentName: document.name
                })
            }
        });

        return NextResponse.json(document, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
