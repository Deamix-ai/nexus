import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { z } from "zod";

const uploadSchema = z.object({
    name: z.string().min(1, "Document name is required"),
    type: z.enum(['QUOTE', 'CONTRACT', 'INVOICE', 'DESIGN', 'PHOTO', 'CERTIFICATE', 'WARRANTY', 'PERMIT', 'SPECIFICATION', 'FLOOR_PLAN', 'EMAIL', 'OTHER']),
    description: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    category: z.string().optional(),
    tags: z.string().optional().transform((str) => str ? str.split(',').map(tag => tag.trim()) : []),
    isPublic: z.string().optional().transform((str) => str === 'true'),
});

// POST /api/documents/upload - Upload document file
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'documents', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        // Validate form data
        const formFields = {
            name: formData.get('name') as string,
            type: formData.get('type') as string,
            description: formData.get('description') as string,
            projectId: formData.get('projectId') as string,
            clientId: formData.get('clientId') as string,
            category: formData.get('category') as string,
            tags: formData.get('tags') as string,
            isPublic: formData.get('isPublic') as string,
        };

        const validatedData = uploadSchema.parse(formFields);

        // Validate file size (10MB limit)
        const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json(
                { error: "File size exceeds 10MB limit" },
                { status: 400 }
            );
        }

        // Validate file type
        const allowedMimeTypes = [
            'application/pdf',
            'image/jpeg',
            'image/png',
            'image/gif',
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
            'text/plain'
        ];

        if (!allowedMimeTypes.includes(file.type)) {
            return NextResponse.json(
                { error: "File type not allowed" },
                { status: 400 }
            );
        }

        // Verify project/client access
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

        // Create uploads directory if it doesn't exist
        const uploadsDir = join(process.cwd(), 'uploads', 'documents');
        await mkdir(uploadsDir, { recursive: true });

        // Generate unique filename
        const timestamp = Date.now();
        const randomSuffix = Math.random().toString(36).substring(2, 15);
        const fileExtension = file.name.split('.').pop();
        const fileName = `${timestamp}_${randomSuffix}.${fileExtension}`;
        const filePath = join(uploadsDir, fileName);

        // Save file to disk
        const bytes = await file.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filePath, buffer);

        // Create database record
        const document = await prisma.document.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                type: validatedData.type,
                category: validatedData.category,
                tags: JSON.stringify(validatedData.tags),
                isPublic: validatedData.isPublic || false,
                fileUrl: `/uploads/documents/${fileName}`,
                fileName: file.name,
                fileSize: file.size,
                mimeType: file.type,
                projectId: validatedData.projectId || null,
                clientId: validatedData.clientId || null,
                uploadedById: session.user.id,
                showroomId: session.user.showroomId,
                version: 1,
                status: 'ACTIVE',
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
                projectId: validatedData.projectId || null,
                clientId: validatedData.clientId || null,
                documentId: document.id,
                metadata: JSON.stringify({
                    documentId: document.id,
                    documentType: document.type,
                    documentName: document.name,
                    fileSize: document.fileSize,
                    mimeType: document.mimeType
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

        console.error("Error uploading document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
