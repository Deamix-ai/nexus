import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const documentUpdateSchema = z.object({
    name: z.string().min(1, "Document name is required").optional(),
    description: z.string().optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    isPublic: z.boolean().optional(),
    expiresAt: z.string().optional().transform((str) => str ? new Date(str) : undefined),
});

// GET /api/documents/[id] - Get single document
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const document = await prisma.document.findFirst({
            where: {
                id: params.id,
                ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                    ? { showroomId: session.user.showroomId }
                    : {})
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
                },
                showroom: {
                    select: { id: true, name: true }
                },
                versions: {
                    select: {
                        id: true, version: true, createdAt: true, uploadedBy: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                }
            }
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        return NextResponse.json(document);

    } catch (error) {
        console.error("Error fetching document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// PUT /api/documents/[id] - Update document
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'update')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = documentUpdateSchema.parse(body);

        // Check if document exists and user has access
        const existingDocument = await prisma.document.findFirst({
            where: {
                id: params.id,
                ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                    ? { showroomId: session.user.showroomId }
                    : {})
            }
        });

        if (!existingDocument) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        const document = await prisma.document.update({
            where: { id: params.id },
            data: {
                ...validatedData,
                tags: validatedData.tags ? JSON.stringify(validatedData.tags) : undefined,
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
                description: `Document "${document.name}" updated`,
                userId: session.user.id,
                projectId: document.projectId,
                clientId: document.clientId,
                documentId: document.id,
                metadata: JSON.stringify({
                    documentId: document.id,
                    changes: validatedData
                })
            }
        });

        return NextResponse.json(document);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error updating document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/documents/[id] - Delete document (soft delete)
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'delete')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        // Check if document exists and user has access
        const existingDocument = await prisma.document.findFirst({
            where: {
                id: params.id,
                ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                    ? { showroomId: session.user.showroomId }
                    : {})
            }
        });

        if (!existingDocument) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Soft delete by updating status and setting deletedAt
        const document = await prisma.document.update({
            where: { id: params.id },
            data: {
                status: 'DELETED',
                deletedAt: new Date()
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'DOCUMENT_UPLOAD',
                description: `Document "${existingDocument.name}" deleted`,
                userId: session.user.id,
                projectId: existingDocument.projectId,
                clientId: existingDocument.clientId,
                documentId: existingDocument.id,
                metadata: JSON.stringify({
                    documentId: existingDocument.id,
                    documentName: existingDocument.name
                })
            }
        });

        return NextResponse.json({ message: "Document deleted successfully" });

    } catch (error) {
        console.error("Error deleting document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
