import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { templateService } from "@/lib/template-service";
import { z } from "zod";

const variablesQuerySchema = z.object({
    userId: z.string().optional(),
    clientId: z.string().optional(),
    projectId: z.string().optional(),
    showroomId: z.string().optional(),
});

// GET /api/message-templates/variables - Get available template variables
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
        const query = variablesQuerySchema.parse(Object.fromEntries(searchParams));

        // Build context from provided IDs
        const context = await templateService.buildContextFromIds({
            userId: query.userId || session.user.id,
            clientId: query.clientId,
            projectId: query.projectId,
            showroomId: query.showroomId || session.user.showroomId,
        });

        // Get available variables
        const variables = templateService.getAvailableVariables(context);

        // Group variables by category
        const groupedVariables = {
            system: variables.filter(v => ['current_date', 'current_time', 'current_year', 'company_name', 'company_website', 'company_phone'].includes(v.name)),
            user: variables.filter(v => v.name.startsWith('user_')),
            client: variables.filter(v => v.name.startsWith('client_')),
            project: variables.filter(v => v.name.startsWith('project_')),
            showroom: variables.filter(v => v.name.startsWith('showroom_')),
            custom: variables.filter(v => !v.name.match(/^(current_|company_|user_|client_|project_|showroom_)/))
        };

        return NextResponse.json({
            variables,
            grouped: groupedVariables,
            context: {
                hasUser: !!context.user,
                hasClient: !!context.client,
                hasProject: !!context.project,
                hasShowroom: !!context.showroom,
            }
        });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error getting template variables:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
