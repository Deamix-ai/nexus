import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

// GET /api/documents/[id]/download - Download document
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
                status: { not: 'DELETED' },
                ...(session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR'
                    ? { showroomId: session.user.showroomId }
                    : {})
            }
        });

        if (!document) {
            return NextResponse.json({ error: "Document not found" }, { status: 404 });
        }

        // Check if document has expired
        if (document.expiresAt && new Date() > document.expiresAt) {
            return NextResponse.json({ error: "Document has expired" }, { status: 410 });
        }

        // Log download activity
        await prisma.activity.create({
            data: {
                type: 'DOCUMENT_DOWNLOAD',
                description: `Document "${document.name}" downloaded`,
                userId: session.user.id,
                projectId: document.projectId,
                clientId: document.clientId,
                documentId: document.id,
                metadata: JSON.stringify({
                    documentId: document.id,
                    documentName: document.name,
                    downloadedAt: new Date().toISOString()
                })
            }
        });

        // For now, we'll redirect to the file URL
        // In production, this would stream the file from secure storage
        if (document.fileUrl.startsWith('http')) {
            return NextResponse.redirect(document.fileUrl);
        } else {
            // For local files, we'd need to implement file streaming
            // This is a simplified implementation for demo purposes
            return NextResponse.json({
                downloadUrl: document.fileUrl,
                fileName: document.fileName,
                mimeType: document.mimeType
            });
        }

    } catch (error) {
        console.error("Error downloading document:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
