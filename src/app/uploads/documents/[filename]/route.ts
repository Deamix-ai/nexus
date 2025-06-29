import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import { join } from "path";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
    request: NextRequest,
    { params }: { params: { filename: string } }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { filename } = params;

        // Verify the document exists and user has access
        const document = await prisma.document.findFirst({
            where: {
                fileUrl: `/uploads/documents/${filename}`,
                status: { not: 'DELETED' },
                ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                    ? { showroomId: session.user.showroomId }
                    : {})
            }
        });

        if (!document) {
            return NextResponse.json({ error: "File not found" }, { status: 404 });
        }

        // Check if document has expired
        if (document.expiresAt && new Date() > document.expiresAt) {
            return NextResponse.json({ error: "Document has expired" }, { status: 410 });
        }

        // Check if document is public or user has access
        if (!document.isPublic && document.uploadedById !== session.user.id) {
            // Check if user has access through project or client relationship
            const hasAccess = await prisma.document.findFirst({
                where: {
                    id: document.id,
                    OR: [
                        { uploadedById: session.user.id },
                        { isPublic: true },
                        // User has access to the project
                        {
                            project: {
                                OR: [
                                    { assignedUserId: session.user.id },
                                    { createdById: session.user.id }
                                ]
                            }
                        }
                    ]
                }
            });

            if (!hasAccess) {
                return NextResponse.json({ error: "Access denied" }, { status: 403 });
            }
        }

        // Read and serve the file
        const filePath = join(process.cwd(), 'uploads', 'documents', filename);
        const fileBuffer = await readFile(filePath);

        const response = new NextResponse(fileBuffer);
        response.headers.set('Content-Type', document.mimeType);
        response.headers.set('Content-Disposition', `inline; filename="${document.fileName}"`);
        response.headers.set('Cache-Control', 'private, max-age=3600');

        return response;

    } catch (error) {
        console.error("Error serving file:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
