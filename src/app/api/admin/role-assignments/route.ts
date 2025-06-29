import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const roleAssignmentSchema = z.object({
    userId: z.string(),
    customRoleId: z.string(),
    expiresAt: z.string().datetime().optional(),
});

// GET /api/admin/role-assignments - List role assignments
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
        const userId = searchParams.get('userId');
        const customRoleId = searchParams.get('customRoleId');
        const isActive = searchParams.get('isActive');

        const where: any = {};

        if (userId) where.userId = userId;
        if (customRoleId) where.customRoleId = customRoleId;
        if (isActive !== null) where.isActive = isActive === 'true';

        // Restrict to showroom for non-admin users
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            where.user = {
                showroomId: session.user.showroomId
            };
        }

        const assignments = await prisma.roleAssignment.findMany({
            where,
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true,
                        showroomId: true
                    }
                },
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        isActive: true
                    }
                },
                assignedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            },
            orderBy: { assignedAt: 'desc' }
        });

        return NextResponse.json({ assignments });

    } catch (error) {
        console.error("Error fetching role assignments:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/admin/role-assignments - Create role assignment
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'users', 'update')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const validatedData = roleAssignmentSchema.parse(body);

        // Verify user exists and can be modified
        const targetUser = await prisma.user.findUnique({
            where: { id: validatedData.userId }
        });

        if (!targetUser) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check permissions for user modification
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            if (targetUser.showroomId !== session.user.showroomId) {
                return NextResponse.json({ error: "Cannot modify users from other showrooms" }, { status: 403 });
            }
        }

        // Verify custom role exists and is accessible
        const customRole = await prisma.customRole.findUnique({
            where: { id: validatedData.customRoleId }
        });

        if (!customRole) {
            return NextResponse.json({ error: "Custom role not found" }, { status: 404 });
        }

        if (!customRole.isActive) {
            return NextResponse.json({ error: "Cannot assign inactive role" }, { status: 400 });
        }

        // Check role access permissions
        if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
            if (customRole.showroomId && customRole.showroomId !== session.user.showroomId) {
                return NextResponse.json({ error: "Cannot assign roles from other showrooms" }, { status: 403 });
            }
        }

        // Deactivate existing role assignments for this user
        await prisma.roleAssignment.updateMany({
            where: {
                userId: validatedData.userId,
                isActive: true
            },
            data: { isActive: false }
        });

        // Create new role assignment
        const assignment = await prisma.roleAssignment.create({
            data: {
                userId: validatedData.userId,
                customRoleId: validatedData.customRoleId,
                assignedById: session.user.id,
                expiresAt: validatedData.expiresAt ? new Date(validatedData.expiresAt) : null,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        role: true
                    }
                },
                customRole: {
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        permissions: true
                    }
                },
                assignedBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Log activity
        await prisma.activity.create({
            data: {
                type: 'USER_UPDATED',
                description: `Role assigned: ${customRole.name} to ${targetUser.firstName} ${targetUser.lastName}`,
                userId: session.user.id,
                metadata: JSON.stringify({
                    targetUserId: validatedData.userId,
                    customRoleId: validatedData.customRoleId,
                    assignmentId: assignment.id
                })
            }
        });

        return NextResponse.json({
            ...assignment,
            customRole: {
                ...assignment.customRole,
                permissions: JSON.parse(assignment.customRole.permissions)
            }
        }, { status: 201 });

    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: "Validation error", details: error.errors },
                { status: 400 }
            );
        }

        console.error("Error creating role assignment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// DELETE /api/admin/role-assignments - Remove role assignment
export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'users', 'update')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const assignmentId = searchParams.get('id');
        const userId = searchParams.get('userId');

        if (!assignmentId && !userId) {
            return NextResponse.json({ error: "Assignment ID or User ID required" }, { status: 400 });
        }

        if (assignmentId) {
            // Remove specific assignment
            const assignment = await prisma.roleAssignment.findUnique({
                where: { id: assignmentId },
                include: { user: true, customRole: true }
            });

            if (!assignment) {
                return NextResponse.json({ error: "Assignment not found" }, { status: 404 });
            }

            // Check permissions
            if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
                if (assignment.user.showroomId !== session.user.showroomId) {
                    return NextResponse.json({ error: "Cannot modify assignments for other showrooms" }, { status: 403 });
                }
            }

            await prisma.roleAssignment.update({
                where: { id: assignmentId },
                data: { isActive: false }
            });

            // Log activity
            await prisma.activity.create({
                data: {
                    type: 'USER_UPDATED',
                    description: `Role removed: ${assignment.customRole.name} from ${assignment.user.firstName} ${assignment.user.lastName}`,
                    userId: session.user.id,
                    metadata: JSON.stringify({
                        targetUserId: assignment.userId,
                        customRoleId: assignment.customRoleId,
                        assignmentId: assignment.id
                    })
                }
            });

        } else if (userId) {
            // Remove all active assignments for user
            const user = await prisma.user.findUnique({
                where: { id: userId }
            });

            if (!user) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            // Check permissions
            if (session.user.role !== 'ADMIN' && session.user.role !== 'DIRECTOR') {
                if (user.showroomId !== session.user.showroomId) {
                    return NextResponse.json({ error: "Cannot modify users from other showrooms" }, { status: 403 });
                }
            }

            await prisma.roleAssignment.updateMany({
                where: {
                    userId,
                    isActive: true
                },
                data: { isActive: false }
            });

            // Log activity
            await prisma.activity.create({
                data: {
                    type: 'USER_UPDATED',
                    description: `All custom roles removed from ${user.firstName} ${user.lastName}`,
                    userId: session.user.id,
                    metadata: JSON.stringify({
                        targetUserId: userId,
                    })
                }
            });
        }

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("Error removing role assignment:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
