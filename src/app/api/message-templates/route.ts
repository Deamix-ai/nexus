import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const templateCreateSchema = z.object({
    name: z.string().min(1, "Template name is required"),
    description: z.string().optional(),
    type: z.enum(['EMAIL', 'SMS', 'WHATSAPP', 'PHONE_CALL', 'INTERNAL_NOTE']),
    category: z.string().optional(),
    subject: z.string().optional(),
    body: z.string().min(1, "Template body is required"),
    htmlBody: z.string().optional(),
    variables: z.array(z.string()).optional().default([]),
    isActive: z.boolean().default(true),
    isDefault: z.boolean().default(false),
    autoSend: z.boolean().default(false),
    triggerEvents: z.array(z.string()).optional().default([]),
});

// GET /api/message-templates - List message templates
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
        const type = searchParams.get('type');
        const category = searchParams.get('category');
        const isActive = searchParams.get('isActive');

        const where: any = {};

        // Add filters
        if (type) where.type = type;
        if (category) where.category = category;
        if (isActive !== null) where.isActive = isActive === 'true';

        // Add showroom filter for non-admin users
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            where.OR = [
                { showroomId: session.user.showroomId },
                { showroomId: null } // Global templates
            ];
        }

        const templates = await prisma.messageTemplate.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                showroom: {
                    select: { id: true, name: true }
                }
            },
            orderBy: [
                { isDefault: 'desc' },
                { category: 'asc' },
                { name: 'asc' }
            ]
        });

        // Parse JSON fields
        const templatesWithParsedData = templates.map((template: any) => ({
            ...template,
            variables: JSON.parse(template.variables || '[]'),
            triggerEvents: JSON.parse(template.triggerEvents || '[]'),
        }));

        return NextResponse.json({ templates: templatesWithParsedData });

    } catch (error) {
        console.error("Error fetching message templates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/message-templates - Create a new template
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
        const validatedData = templateCreateSchema.parse(body);

        // If setting as default, unset other defaults of the same type/category
        if (validatedData.isDefault) {
            await prisma.messageTemplate.updateMany({
                where: {
                    type: validatedData.type,
                    category: validatedData.category,
                    showroomId: session.user.showroomId,
                },
                data: { isDefault: false }
            });
        }

        const template = await prisma.messageTemplate.create({
            data: {
                ...validatedData,
                variables: JSON.stringify(validatedData.variables),
                triggerEvents: JSON.stringify(validatedData.triggerEvents),
                createdById: session.user.id,
                showroomId: session.user.showroomId,
            },
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                showroom: {
                    select: { id: true, name: true }
                }
            }
        });

        return NextResponse.json({
            ...template,
            variables: JSON.parse(template.variables || '[]'),
            triggerEvents: JSON.parse(template.triggerEvents || '[]'),
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating message template:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
