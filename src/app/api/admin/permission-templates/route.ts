import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { PERMISSION_TEMPLATES } from "@/lib/advanced-permissions";

// GET /api/admin/permission-templates - Get permission templates
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'users', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const category = searchParams.get('category');

        // Get built-in templates
        const builtInTemplates = Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description,
            category: key.split('_')[0].toLowerCase(),
            permissions: template.permissions,
            isBuiltIn: true,
            isActive: true
        }));

        // Get custom templates from database
        const where: any = { isActive: true };
        if (category) where.category = category;

        const customTemplates = await prisma.permissionTemplate.findMany({
            where,
            orderBy: { createdAt: 'desc' }
        });

        const parsedCustomTemplates = customTemplates.map((template: any) => ({
            ...template,
            permissions: JSON.parse(template.permissions),
            isBuiltIn: false
        }));

        // Combine and filter by category if specified
        let allTemplates = [...builtInTemplates, ...parsedCustomTemplates];

        if (category) {
            allTemplates = allTemplates.filter(template =>
                template.category === category
            );
        }

        return NextResponse.json({
            templates: allTemplates,
            categories: ['sales', 'operations', 'management', 'admin']
        });

    } catch (error) {
        console.error("Error fetching permission templates:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/admin/permission-templates - Create custom permission template
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'users', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { name, description, category, permissions } = body;

        if (!name || !permissions) {
            return NextResponse.json(
                { error: "Name and permissions are required" },
                { status: 400 }
            );
        }

        // Check if template name already exists
        const existingTemplate = await prisma.permissionTemplate.findFirst({
            where: { name }
        });

        if (existingTemplate) {
            return NextResponse.json(
                { error: "Template name already exists" },
                { status: 400 }
            );
        }

        const template = await prisma.permissionTemplate.create({
            data: {
                name,
                description,
                category: category || 'custom',
                permissions: JSON.stringify(permissions),
                isActive: true
            }
        });

        return NextResponse.json({
            ...template,
            permissions: JSON.parse(template.permissions),
            isBuiltIn: false
        }, { status: 201 });

    } catch (error) {
        console.error("Error creating permission template:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
