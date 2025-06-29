import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { templateService } from "@/lib/template-service";
import { z } from "zod";

const processTemplateSchema = z.object({
    templateId: z.string(),
    userId: z.string().optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    showroomId: z.string().optional(),
    customVariables: z.record(z.any()).optional(),
});

// POST /api/message-templates/process - Process a template with variables
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'messages', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = processTemplateSchema.parse(body);

        // Build context from provided IDs
        const context = await templateService.buildContextFromIds({
            userId: validatedData.userId || session.user.id,
            clientId: validatedData.clientId,
            projectId: validatedData.projectId,
            showroomId: validatedData.showroomId || session.user.showroomId,
            custom: validatedData.customVariables,
        });

        // Process the template
        const processedTemplate = await templateService.processTemplateById(
            validatedData.templateId,
            context
        );

        return NextResponse.json(processedTemplate);

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error processing template:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}
