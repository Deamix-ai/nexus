import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const customRoleCreateSchema = z.object({
    name: z.string().min(1, "Role name is required"),
    description: z.string().optional(),
    baseRole: z.enum(['SALESPERSON', 'SALES_MANAGER', 'REGIONAL_MANAGER', 'PROJECT_MANAGER', 'INSTALL_MANAGER', 'INSTALLER', 'SURVEYOR', 'ADMIN', 'DIRECTOR', 'BOOKKEEPER', 'CUSTOMER', 'AI_ASSISTANT']).optional(),
    permissions: z.object({
        resources: z.array(z.object({
            resource: z.string(),
            actions: z.object({
                create: z.boolean().optional(),
                read: z.boolean().optional(),
                update: z.boolean().optional(),
                delete: z.boolean().optional(),
                manage: z.boolean().optional(),
            }),
            conditions: z.object({
                ownOnly: z.boolean().optional(),
                showroomOnly: z.boolean().optional(),
                assignedOnly: z.boolean().optional(),
                roleLevel: z.number().optional(),
            }).optional(),
            scope: z.array(z.string()).optional(),
        })),
        systemAccess: z.object({
            adminPanel: z.boolean().optional(),
            reports: z.boolean().optional(),
            settings: z.boolean().optional(),
            userManagement: z.boolean().optional(),
            roleManagement: z.boolean().optional(),
            systemLogs: z.boolean().optional(),
            dataExport: z.boolean().optional(),
            apiAccess: z.boolean().optional(),
        }),
        dashboard: z.object({
            url: z.string(),
            customSections: z.array(z.string()).optional(),
            widgets: z.array(z.string()).optional(),
        }),
        mobile: z.object({
            canAccess: z.boolean(),
            features: z.array(z.string()).optional(),
        }),
        security: z.object({
            requiresTwoFactor: z.boolean(),
            sessionTimeout: z.number().optional(),
            ipRestrictions: z.array(z.string()).optional(),
            timeRestrictions: z.object({
                start: z.string(),
                end: z.string(),
                timezone: z.string(),
            }).optional(),
        }),
    }),
    isActive: z.boolean().default(true),
});

// GET /api/admin/custom-roles - List custom roles
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
        const isActive = searchParams.get('isActive');
        const showroomId = searchParams.get('showroomId');

        const where: any = {};

        if (isActive !== null) {
            where.isActive = isActive === 'true';
        }

        if (showroomId) {
            where.showroomId = showroomId;
        } else if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            where.OR = [
                { showroomId: session.user.showroomId },
                { showroomId: null } // Global roles
            ];
        }

        const customRoles = await prisma.customRole.findMany({
            where,
            include: {
                createdBy: {
                    select: { id: true, firstName: true, lastName: true, email: true }
                },
                showroom: {
                    select: { id: true, name: true }
                },
                roleAssignments: {
                    where: { isActive: true },
                    include: {
                        user: {
                            select: { id: true, firstName: true, lastName: true, email: true }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        // Parse permissions JSON
        const rolesWithParsedPermissions = customRoles.map((role: any) => ({
            ...role,
            permissions: JSON.parse(role.permissions),
            activeAssignments: role.roleAssignments.length
        }));

        return NextResponse.json({
            roles: rolesWithParsedPermissions
        });

    } catch (error) {
        console.error("Error fetching custom roles:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/admin/custom-roles - Create custom role
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
        const validatedData = customRoleCreateSchema.parse(body);

        // Check if role name already exists
        const existingRole = await prisma.customRole.findFirst({
            where: {
                name: validatedData.name,
                showroomId: session.user.showroomId
            }
        });

        if (existingRole) {
            return NextResponse.json(
                { error: "Role name already exists" },
                { status: 400 }
            );
        }

        const customRole = await prisma.customRole.create({
            data: {
                name: validatedData.name,
                description: validatedData.description,
                baseRole: validatedData.baseRole,
                permissions: JSON.stringify(validatedData.permissions),
                isActive: validatedData.isActive,
                createdById: session.user.id,
                showroomId: session.user.role === 'ADMIN' || session.user.role === 'DIRECTOR'
                    ? null
                    : session.user.showroomId,
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
            ...customRole,
            permissions: JSON.parse(customRole.permissions),
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating custom role:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
