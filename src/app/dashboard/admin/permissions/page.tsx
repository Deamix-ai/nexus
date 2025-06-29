'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import RoleForm from '@/components/admin/role-form'
import AssignmentForm from '@/components/admin/assignment-form'
import {
    Users,
    Shield,
    Settings,
    Plus,
    Search,
    Filter,
    Edit,
    Trash2,
    Eye,
    UserCheck,
    UserX,
    Crown,
    Lock,
    Unlock,
    Save,
    X
} from 'lucide-react'

interface CustomRole {
    id: string
    name: string
    description?: string
    baseRole?: string
    permissions: any
    isActive: boolean
    activeAssignments: number
    createdBy: {
        firstName: string
        lastName: string
        email: string
    }
    showroom?: {
        id: string
        name: string
    }
    createdAt: string
}

interface RoleAssignment {
    id: string
    isActive: boolean
    expiresAt?: string
    assignedAt: string
    user: {
        id: string
        firstName: string
        lastName: string
        email: string
        role: string
    }
    customRole: {
        id: string
        name: string
        description?: string
    }
    assignedBy: {
        firstName: string
        lastName: string
    }
}

interface PermissionTemplate {
    id: string
    name: string
    description?: string
    category: string
    permissions: any
    isBuiltIn: boolean
    isActive: boolean
}

export default function AdvancedPermissionsPage() {
    const [activeTab, setActiveTab] = useState<'roles' | 'assignments' | 'templates'>('roles')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Custom Roles
    const [customRoles, setCustomRoles] = useState<CustomRole[]>([])
    const [roleFilter, setRoleFilter] = useState('')

    // Modal states
    const [showCreateRoleModal, setShowCreateRoleModal] = useState(false)
    const [showEditRoleModal, setShowEditRoleModal] = useState(false)
    const [showCreateAssignmentModal, setShowCreateAssignmentModal] = useState(false)
    const [selectedRole, setSelectedRole] = useState<CustomRole | null>(null)

    // Form states
    const [roleForm, setRoleForm] = useState({
        name: '',
        description: '',
        baseRole: 'SALESPERSON',
        showroomId: '',
        permissions: {}
    })

    // Role Assignments
    const [assignments, setAssignments] = useState<RoleAssignment[]>([])
    const [assignmentFilter, setAssignmentFilter] = useState('')

    // Permission Templates
    const [templates, setTemplates] = useState<PermissionTemplate[]>([])
    const [templateCategory, setTemplateCategory] = useState('')

    // Additional data
    const [users, setUsers] = useState<any[]>([])
    const [showrooms, setShowrooms] = useState<any[]>([])

    useEffect(() => {
        fetchData()
        fetchShowrooms()
        fetchUsers()
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'roles') {
                await fetchCustomRoles()
            } else if (activeTab === 'assignments') {
                await fetchAssignments()
            } else if (activeTab === 'templates') {
                await fetchTemplates()
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchCustomRoles = async () => {
        const response = await fetch('/api/admin/custom-roles')
        if (!response.ok) throw new Error('Failed to fetch custom roles')
        const data = await response.json()
        setCustomRoles(data.roles || [])
    }

    const fetchAssignments = async () => {
        const response = await fetch('/api/admin/role-assignments')
        if (!response.ok) throw new Error('Failed to fetch role assignments')
        const data = await response.json()
        setAssignments(data.assignments || [])
    }

    const fetchTemplates = async () => {
        const params = new URLSearchParams()
        if (templateCategory) params.set('category', templateCategory)

        const response = await fetch(`/api/admin/permission-templates?${params}`)
        if (!response.ok) throw new Error('Failed to fetch permission templates')
        const data = await response.json()
        setTemplates(data.templates || [])
    }

    const fetchShowrooms = async () => {
        try {
            const response = await fetch('/api/showrooms')
            if (response.ok) {
                const data = await response.json()
                setShowrooms(data.showrooms || [])
            }
        } catch (err) {
            console.error('Failed to fetch showrooms:', err)
        }
    }

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/users')
            if (response.ok) {
                const data = await response.json()
                setUsers(data.users || [])
            }
        } catch (err) {
            console.error('Failed to fetch users:', err)
        }
    }

    const handleRoleToggle = async (roleId: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/admin/custom-roles/${roleId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive })
            })

            if (!response.ok) throw new Error('Failed to update role')

            await fetchCustomRoles()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update role')
        }
    }

    const handleRemoveAssignment = async (assignmentId: string) => {
        if (!confirm('Are you sure you want to remove this role assignment?')) return

        try {
            const response = await fetch(`/api/admin/role-assignments?id=${assignmentId}`, {
                method: 'DELETE'
            })

            if (!response.ok) throw new Error('Failed to remove assignment')

            await fetchAssignments()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to remove assignment')
        }
    }

    const handleCreateRole = async (formData: any) => {
        try {
            const response = await fetch('/api/admin/custom-roles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Failed to create role')

            setShowCreateRoleModal(false)
            await fetchCustomRoles()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create role')
        }
    }

    const handleEditRole = async (formData: any) => {
        if (!selectedRole) return

        try {
            const response = await fetch(`/api/admin/custom-roles/${selectedRole.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Failed to update role')

            setShowEditRoleModal(false)
            setSelectedRole(null)
            await fetchCustomRoles()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to update role')
        }
    }

    const handleCreateAssignment = async (formData: any) => {
        try {
            const response = await fetch('/api/admin/role-assignments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            })

            if (!response.ok) throw new Error('Failed to create assignment')

            setShowCreateAssignmentModal(false)
            await fetchAssignments()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to create assignment')
        }
    }

    const openEditModal = (role: CustomRole) => {
        setSelectedRole(role)
        setRoleForm({
            name: role.name,
            description: role.description || '',
            baseRole: role.baseRole || 'SALESPERSON',
            showroomId: role.showroom?.id || '',
            permissions: role.permissions
        })
        setShowEditRoleModal(true)
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })
    }

    const getPermissionSummary = (permissions: any) => {
        const resourceCount = permissions.resources?.length || 0
        const systemAccess = Object.values(permissions.systemAccess || {}).filter(Boolean).length
        return `${resourceCount} resources, ${systemAccess} system permissions`
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading permissions...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Advanced Permissions</h1>
                    <p className="text-gray-600">Manage custom roles and fine-grained permissions</p>
                </div>
                <div className="flex gap-2">
                    {activeTab === 'assignments' && (
                        <Button
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => setShowCreateAssignmentModal(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Assign Role
                        </Button>
                    )}
                    {activeTab === 'roles' && (
                        <Button
                            className="bg-blue-600 hover:bg-blue-700"
                            onClick={() => setShowCreateRoleModal(true)}
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Create Role
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'roles', label: 'Custom Roles', icon: Shield },
                        { key: 'assignments', label: 'Role Assignments', icon: Users },
                        { key: 'templates', label: 'Permission Templates', icon: Settings },
                    ].map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.key}
                                onClick={() => setActiveTab(tab.key as any)}
                                className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm ${activeTab === tab.key
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                <Icon className="h-4 w-4 mr-2" />
                                {tab.label}
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Custom Roles Tab */}
            {activeTab === 'roles' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search roles..."
                                            value={roleFilter}
                                            onChange={(e) => setRoleFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button onClick={fetchCustomRoles} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Roles Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {customRoles
                            .filter(role =>
                                role.name.toLowerCase().includes(roleFilter.toLowerCase()) ||
                                role.description?.toLowerCase().includes(roleFilter.toLowerCase())
                            )
                            .map((role) => (
                                <Card key={role.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center space-x-2">
                                                <Crown className="h-5 w-5 text-yellow-600" />
                                                <CardTitle className="text-lg">{role.name}</CardTitle>
                                            </div>
                                            <div className="flex items-center space-x-1">
                                                {role.isActive ? (
                                                    <Unlock className="h-4 w-4 text-green-600" />
                                                ) : (
                                                    <Lock className="h-4 w-4 text-red-600" />
                                                )}
                                            </div>
                                        </div>
                                        <CardDescription>
                                            {role.description || 'No description'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <div className="text-sm text-gray-600">
                                            <p><strong>Base Role:</strong> {role.baseRole || 'None'}</p>
                                            <p><strong>Permissions:</strong> {getPermissionSummary(role.permissions)}</p>
                                            <p><strong>Active Users:</strong> {role.activeAssignments}</p>
                                            {role.showroom && (
                                                <p><strong>Showroom:</strong> {role.showroom.name}</p>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-500">
                                            Created by {role.createdBy.firstName} {role.createdBy.lastName} on {formatDate(role.createdAt)}
                                        </div>

                                        <div className="flex gap-2 pt-2">
                                            <Button size="sm" variant="outline" className="flex-1">
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="flex-1"
                                                onClick={() => openEditModal(role)}
                                            >
                                                <Edit className="h-3 w-3 mr-1" />
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleRoleToggle(role.id, role.isActive)}
                                                className="flex-1"
                                            >
                                                {role.isActive ? (
                                                    <>
                                                        <Lock className="h-3 w-3 mr-1" />
                                                        Disable
                                                    </>
                                                ) : (
                                                    <>
                                                        <Unlock className="h-3 w-3 mr-1" />
                                                        Enable
                                                    </>
                                                )}
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))}
                    </div>

                    {customRoles.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Shield className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No custom roles found</p>
                                <p className="text-sm text-gray-500 mt-1">Create custom roles to assign specific permissions</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Role Assignments Tab */}
            {activeTab === 'assignments' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search assignments..."
                                            value={assignmentFilter}
                                            onChange={(e) => setAssignmentFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <Button onClick={fetchAssignments} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Assignments List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Active Role Assignments</CardTitle>
                            <CardDescription>
                                Users with custom role assignments
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {assignments.length > 0 ? (
                                <div className="space-y-4">
                                    {assignments
                                        .filter(assignment =>
                                            assignment.user.firstName.toLowerCase().includes(assignmentFilter.toLowerCase()) ||
                                            assignment.user.lastName.toLowerCase().includes(assignmentFilter.toLowerCase()) ||
                                            assignment.user.email.toLowerCase().includes(assignmentFilter.toLowerCase()) ||
                                            assignment.customRole.name.toLowerCase().includes(assignmentFilter.toLowerCase())
                                        )
                                        .map((assignment) => (
                                            <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                                                <div className="flex items-center space-x-4">
                                                    <div className="flex-shrink-0">
                                                        {assignment.isActive ? (
                                                            <UserCheck className="h-8 w-8 text-green-600" />
                                                        ) : (
                                                            <UserX className="h-8 w-8 text-red-600" />
                                                        )}
                                                    </div>
                                                    <div>
                                                        <p className="font-medium">
                                                            {assignment.user.firstName} {assignment.user.lastName}
                                                        </p>
                                                        <p className="text-sm text-gray-600">{assignment.user.email}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Base Role: {assignment.user.role}
                                                        </p>
                                                    </div>
                                                    <div className="text-sm">
                                                        <p className="font-medium text-blue-600">{assignment.customRole.name}</p>
                                                        <p className="text-gray-600">{assignment.customRole.description}</p>
                                                        <p className="text-xs text-gray-500">
                                                            Assigned by {assignment.assignedBy.firstName} {assignment.assignedBy.lastName}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <div className="text-right text-sm">
                                                        <p className="text-gray-600">
                                                            Assigned: {formatDate(assignment.assignedAt)}
                                                        </p>
                                                        {assignment.expiresAt && (
                                                            <p className="text-orange-600">
                                                                Expires: {formatDate(assignment.expiresAt)}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        onClick={() => handleRemoveAssignment(assignment.id)}
                                                    >
                                                        <Trash2 className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            </div>
                                        ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No role assignments found</p>
                                    <p className="text-sm text-gray-500 mt-1">Assign custom roles to users for specific permissions</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Permission Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <select
                                    value={templateCategory}
                                    onChange={(e) => setTemplateCategory(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Categories</option>
                                    <option value="sales">Sales</option>
                                    <option value="operations">Operations</option>
                                    <option value="management">Management</option>
                                    <option value="admin">Admin</option>
                                </select>
                                <Button onClick={fetchTemplates} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Apply Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Templates Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => (
                            <Card key={template.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-2">
                                            <Settings className="h-5 w-5 text-purple-600" />
                                            <CardTitle className="text-lg">{template.name}</CardTitle>
                                        </div>
                                        {template.isBuiltIn && (
                                            <div className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                                Built-in
                                            </div>
                                        )}
                                    </div>
                                    <CardDescription>
                                        {template.description || 'No description'}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="text-sm text-gray-600">
                                        <p><strong>Category:</strong> {template.category}</p>
                                        <p><strong>Permissions:</strong> {getPermissionSummary(template.permissions)}</p>
                                    </div>

                                    <div className="flex gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                        <Button size="sm" variant="outline" className="flex-1">
                                            Use Template
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {templates.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No permission templates found</p>
                                <p className="text-sm text-gray-500 mt-1">Permission templates help quickly create roles</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Role Form Modals */}
            <RoleForm
                isOpen={showCreateRoleModal}
                onClose={() => setShowCreateRoleModal(false)}
                onSave={handleCreateRole}
                showrooms={showrooms}
                title="Create Custom Role"
                description="Define a new custom role with specific permissions"
            />

            <RoleForm
                isOpen={showEditRoleModal}
                onClose={() => {
                    setShowEditRoleModal(false)
                    setSelectedRole(null)
                }}
                onSave={handleEditRole}
                initialData={selectedRole}
                showrooms={showrooms}
                title="Edit Custom Role"
                description="Modify the details and permissions of the custom role"
            />

            <AssignmentForm
                isOpen={showCreateAssignmentModal}
                onClose={() => setShowCreateAssignmentModal(false)}
                onSave={handleCreateAssignment}
                users={users}
                roles={customRoles}
            />
        </div>
    )
}
