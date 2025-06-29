import { UserRole } from '@prisma/client'
import { prisma } from './prisma'

// Enhanced permission system with granular controls
export interface PermissionAction {
    create?: boolean
    read?: boolean
    update?: boolean
    delete?: boolean
    manage?: boolean // Full admin control
}

export interface ResourcePermission {
    resource: string
    actions: PermissionAction
    conditions?: {
        ownOnly?: boolean        // Can only access own records
        showroomOnly?: boolean   // Can only access showroom records
        assignedOnly?: boolean   // Can only access assigned records
        roleLevel?: number       // Minimum role level required
    }
    scope?: string[]          // Specific scopes like 'view_financial', 'export_data'
}

export interface AdvancedPermissions {
    resources: ResourcePermission[]
    systemAccess: {
        adminPanel?: boolean
        reports?: boolean
        settings?: boolean
        userManagement?: boolean
        roleManagement?: boolean
        systemLogs?: boolean
        dataExport?: boolean
        apiAccess?: boolean
    }
    dashboard: {
        url: string
        customSections?: string[]
        widgets?: string[]
    }
    mobile: {
        canAccess: boolean
        features?: string[]
    }
    security: {
        requiresTwoFactor: boolean
        sessionTimeout?: number
        ipRestrictions?: string[]
        timeRestrictions?: {
            start: string
            end: string
            timezone: string
        }
    }
}

// Default permission templates
export const PERMISSION_TEMPLATES = {
    SALES_BASIC: {
        name: 'Sales Basic',
        description: 'Basic sales permissions for new team members',
        permissions: {
            resources: [
                {
                    resource: 'projects',
                    actions: { read: true, create: true, update: true },
                    conditions: { assignedOnly: true }
                },
                {
                    resource: 'clients',
                    actions: { read: true, create: true, update: true },
                    conditions: { assignedOnly: true }
                },
                {
                    resource: 'activities',
                    actions: { read: true, create: true, update: true },
                    conditions: { ownOnly: true }
                },
                {
                    resource: 'documents',
                    actions: { read: true, create: true },
                    conditions: { assignedOnly: true }
                },
                {
                    resource: 'messages',
                    actions: { read: true, create: true, update: true },
                    conditions: { assignedOnly: true }
                }
            ],
            systemAccess: {
                reports: false,
                settings: false,
                userManagement: false
            },
            dashboard: {
                url: '/dashboard/sales',
                widgets: ['pipeline', 'activities', 'targets']
            },
            mobile: { canAccess: false },
            security: { requiresTwoFactor: false }
        }
    },

    SALES_ADVANCED: {
        name: 'Sales Advanced',
        description: 'Advanced sales permissions with reporting access',
        permissions: {
            resources: [
                {
                    resource: 'projects',
                    actions: { read: true, create: true, update: true, delete: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'clients',
                    actions: { read: true, create: true, update: true, delete: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'activities',
                    actions: { read: true, create: true, update: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'documents',
                    actions: { read: true, create: true, update: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'messages',
                    actions: { read: true, create: true, update: true },
                    conditions: { showroomOnly: true }
                }
            ],
            systemAccess: {
                reports: true,
                settings: false,
                userManagement: false
            },
            dashboard: {
                url: '/dashboard/sales',
                widgets: ['pipeline', 'activities', 'targets', 'reports']
            },
            mobile: { canAccess: true, features: ['projects', 'clients'] },
            security: { requiresTwoFactor: false }
        }
    },

    MANAGEMENT: {
        name: 'Management',
        description: 'Management level permissions with team oversight',
        permissions: {
            resources: [
                {
                    resource: 'projects',
                    actions: { read: true, create: true, update: true, delete: true, manage: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'clients',
                    actions: { read: true, create: true, update: true, delete: true, manage: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'users',
                    actions: { read: true, update: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'activities',
                    actions: { read: true, create: true, update: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'documents',
                    actions: { read: true, create: true, update: true, delete: true },
                    conditions: { showroomOnly: true }
                },
                {
                    resource: 'messages',
                    actions: { read: true, create: true, update: true, delete: true },
                    conditions: { showroomOnly: true }
                }
            ],
            systemAccess: {
                reports: true,
                settings: true,
                userManagement: true,
                roleManagement: false
            },
            dashboard: {
                url: '/dashboard',
                widgets: ['overview', 'team-performance', 'pipeline', 'reports']
            },
            mobile: { canAccess: true, features: ['projects', 'clients', 'team'] },
            security: { requiresTwoFactor: true }
        }
    },

    OPERATIONS: {
        name: 'Operations',
        description: 'Operational permissions for installers and surveyors',
        permissions: {
            resources: [
                {
                    resource: 'projects',
                    actions: { read: true, update: true },
                    conditions: { assignedOnly: true },
                    scope: ['view_schedule', 'update_progress']
                },
                {
                    resource: 'documents',
                    actions: { read: true, create: true },
                    conditions: { assignedOnly: true },
                    scope: ['upload_photos', 'view_plans']
                },
                {
                    resource: 'activities',
                    actions: { read: true, create: true, update: true },
                    conditions: { ownOnly: true }
                },
                {
                    resource: 'messages',
                    actions: { read: true, create: true },
                    conditions: { assignedOnly: true }
                }
            ],
            systemAccess: {
                reports: false,
                settings: false
            },
            dashboard: {
                url: '/dashboard/operations',
                widgets: ['schedule', 'assignments', 'progress']
            },
            mobile: { canAccess: true, features: ['projects', 'schedule', 'photos'] },
            security: { requiresTwoFactor: false }
        }
    }
}

// Enhanced permission checker
export class AdvancedPermissionChecker {
    constructor(
        private userRole: UserRole,
        private customPermissions?: AdvancedPermissions,
        private userContext?: {
            id: string
            showroomId?: string
            assignedProjects?: string[]
        }
    ) { }

    // Check if user has permission for a specific action on a resource
    hasPermission(
        resource: string,
        action: keyof PermissionAction,
        context?: {
            recordId?: string
            ownerId?: string
            showroomId?: string
            assignedUserId?: string
        }
    ): boolean {
        // Check custom permissions first
        if (this.customPermissions) {
            const resourcePermission = this.customPermissions.resources.find(
                r => r.resource === resource
            )

            if (resourcePermission) {
                return this.checkResourcePermission(resourcePermission, action, context)
            }
        }

        // Fall back to role-based permissions
        return this.checkRoleBasedPermission(resource, action, context)
    }

    // Check system-level permissions
    hasSystemAccess(permission: keyof AdvancedPermissions['systemAccess']): boolean {
        if (this.customPermissions?.systemAccess[permission]) {
            return this.customPermissions.systemAccess[permission] === true
        }

        // Default role-based system access
        const adminRoles: UserRole[] = ['ADMIN', 'DIRECTOR', 'REGIONAL_MANAGER']
        const managerRoles: UserRole[] = [...adminRoles, 'SALES_MANAGER', 'PROJECT_MANAGER', 'INSTALL_MANAGER']

        switch (permission) {
            case 'adminPanel':
            case 'userManagement':
            case 'roleManagement':
            case 'systemLogs':
                return adminRoles.includes(this.userRole)

            case 'reports':
            case 'settings':
                return managerRoles.includes(this.userRole)

            case 'dataExport':
                return [...managerRoles, 'BOOKKEEPER'].includes(this.userRole)

            default:
                return false
        }
    }

    // Check if user can access mobile features
    canAccessMobile(): boolean {
        if (this.customPermissions?.mobile.canAccess !== undefined) {
            return this.customPermissions.mobile.canAccess
        }

        const mobileRoles: UserRole[] = [
            'INSTALLER', 'SURVEYOR', 'PROJECT_MANAGER', 'INSTALL_MANAGER', 'SALES_MANAGER'
        ]
        return mobileRoles.includes(this.userRole)
    }

    // Get user's dashboard URL
    getDashboardUrl(): string {
        if (this.customPermissions?.dashboard.url) {
            return this.customPermissions.dashboard.url
        }

        // Default dashboard URLs by role
        const dashboardMap: Record<UserRole, string> = {
            SALESPERSON: '/dashboard/sales',
            SALES_MANAGER: '/dashboard/sales',
            REGIONAL_MANAGER: '/dashboard',
            PROJECT_MANAGER: '/dashboard/projects',
            INSTALL_MANAGER: '/dashboard/operations',
            INSTALLER: '/dashboard/operations',
            SURVEYOR: '/dashboard/operations',
            ADMIN: '/dashboard/admin',
            DIRECTOR: '/dashboard',
            BOOKKEEPER: '/dashboard/reports',
            CUSTOMER: '/portal',
            AI_ASSISTANT: '/dashboard/ai'
        }

        return dashboardMap[this.userRole] || '/dashboard'
    }

    private checkResourcePermission(
        resourcePermission: ResourcePermission,
        action: keyof PermissionAction,
        context?: any
    ): boolean {
        // Check if action is allowed
        if (!resourcePermission.actions[action]) {
            return false
        }

        // Check conditions
        if (resourcePermission.conditions && context) {
            if (resourcePermission.conditions.ownOnly && context.ownerId !== this.userContext?.id) {
                return false
            }

            if (resourcePermission.conditions.showroomOnly && context.showroomId !== this.userContext?.showroomId) {
                return false
            }

            if (resourcePermission.conditions.assignedOnly) {
                if (context.assignedUserId !== this.userContext?.id &&
                    !this.userContext?.assignedProjects?.includes(context.recordId)) {
                    return false
                }
            }
        }

        return true
    }

    private checkRoleBasedPermission(resource: string, action: string, context?: any): boolean {
        // Implement existing role-based permission logic here
        // This is a simplified version - you can expand based on your current permissions.ts
        const adminRoles: UserRole[] = ['ADMIN', 'DIRECTOR']
        const managerRoles: UserRole[] = [...adminRoles, 'SALES_MANAGER', 'PROJECT_MANAGER', 'INSTALL_MANAGER', 'REGIONAL_MANAGER']

        if (adminRoles.includes(this.userRole)) {
            return true // Admins have all permissions
        }

        if (action === 'delete' && !managerRoles.includes(this.userRole)) {
            return false // Only managers+ can delete
        }

        return true // Default allow for now
    }
}

// Utility functions for working with custom roles
export class CustomRoleService {
    static async getUserPermissions(userId: string): Promise<AdvancedPermissions | null> {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            include: {
                roleAssignments: {
                    where: { isActive: true },
                    include: { customRole: true }
                }
            }
        })

        if (!user || !user.roleAssignments.length) {
            return null
        }

        // For now, take the first active role assignment
        // In the future, you might want to merge multiple roles
        const assignment = user.roleAssignments[0]
        const permissions = JSON.parse(assignment.customRole.permissions)

        return permissions as AdvancedPermissions
    }

    static async assignRole(userId: string, customRoleId: string, assignedById: string): Promise<void> {
        // Deactivate existing role assignments
        await prisma.roleAssignment.updateMany({
            where: { userId, isActive: true },
            data: { isActive: false }
        })

        // Create new role assignment
        await prisma.roleAssignment.create({
            data: {
                userId,
                customRoleId,
                assignedById,
                isActive: true
            }
        })
    }

    static async createRole(
        name: string,
        permissions: AdvancedPermissions,
        createdById: string,
        showroomId?: string
    ): Promise<string> {
        const role = await prisma.customRole.create({
            data: {
                name,
                permissions: JSON.stringify(permissions),
                createdById,
                showroomId
            }
        })

        return role.id
    }
}

// Enhanced permission checker instance
export async function getPermissionChecker(userId: string): Promise<AdvancedPermissionChecker> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
            roleAssignments: {
                where: { isActive: true },
                include: { customRole: true }
            },
            assignedProjects: { select: { id: true } }
        }
    })

    if (!user) {
        throw new Error('User not found')
    }

    const customPermissions = await CustomRoleService.getUserPermissions(userId)

    return new AdvancedPermissionChecker(
        user.role,
        customPermissions || undefined,
        {
            id: user.id,
            showroomId: user.showroomId || undefined,
            assignedProjects: user.assignedProjects.map((p: any) => p.id)
        }
    )
}
