'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, X } from 'lucide-react'

interface RoleFormProps {
    isOpen: boolean
    onClose: () => void
    onSave: (formData: any) => void
    initialData?: any
    showrooms?: any[]
    title: string
    description: string
}

export default function RoleForm({
    isOpen,
    onClose,
    onSave,
    initialData = {},
    showrooms = [],
    title,
    description
}: RoleFormProps) {
    const [formData, setFormData] = useState({
        name: initialData.name || '',
        description: initialData.description || '',
        baseRole: initialData.baseRole || 'SALESPERSON',
        showroomId: initialData.showroomId || '',
        permissions: initialData.permissions || {
            resources: [],
            systemAccess: {},
            mobile: { canAccess: false },
            security: { requiresTwoFactor: false }
        }
    })

    const handleResourcePermissionChange = (resource: string, action: string, checked: boolean) => {
        const currentResources = formData.permissions.resources || []
        const existingIndex = currentResources.findIndex((r: any) => r.resource === resource)

        let updatedResources
        if (existingIndex >= 0) {
            updatedResources = [...currentResources]
            updatedResources[existingIndex] = {
                ...updatedResources[existingIndex],
                actions: {
                    ...updatedResources[existingIndex].actions,
                    [action]: checked
                }
            }
        } else {
            updatedResources = [
                ...currentResources,
                {
                    resource,
                    actions: { [action]: checked },
                    conditions: { showroomOnly: true }
                }
            ]
        }

        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                resources: updatedResources
            }
        })
    }

    const handleSystemAccessChange = (permission: string, checked: boolean) => {
        setFormData({
            ...formData,
            permissions: {
                ...formData.permissions,
                systemAccess: {
                    ...formData.permissions.systemAccess,
                    [permission]: checked
                }
            }
        })
    }

    const handleSubmit = () => {
        onSave(formData)
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
            <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto z-10 m-4">
                <CardHeader>
                    <CardTitle>{title}</CardTitle>
                    <CardDescription>{description}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        {/* Basic Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label>Role Name</Label>
                                <Input
                                    placeholder="Enter role name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Base Role</Label>
                                <select
                                    value={formData.baseRole}
                                    onChange={(e) => setFormData({ ...formData, baseRole: e.target.value })}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                                >
                                    <option value="SALESPERSON">Salesperson</option>
                                    <option value="SALES_MANAGER">Sales Manager</option>
                                    <option value="PROJECT_MANAGER">Project Manager</option>
                                    <option value="INSTALL_MANAGER">Install Manager</option>
                                    <option value="INSTALLER">Installer</option>
                                    <option value="SURVEYOR">Surveyor</option>
                                    <option value="BOOKKEEPER">Bookkeeper</option>
                                </select>
                            </div>
                        </div>

                        <div>
                            <Label>Description</Label>
                            <Input
                                placeholder="Enter role description"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div>
                            <Label>Showroom (Optional)</Label>
                            <select
                                value={formData.showroomId}
                                onChange={(e) => setFormData({ ...formData, showroomId: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">All Showrooms (Global Role)</option>
                                {showrooms.map((showroom) => (
                                    <option key={showroom.id} value={showroom.id}>
                                        {showroom.name}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Permissions Section */}
                        <div>
                            <Label className="text-lg font-semibold">Permissions</Label>
                            <div className="border rounded-lg p-4 space-y-6 mt-2">

                                {/* Resource Permissions */}
                                <div>
                                    <Label className="text-md font-semibold text-gray-700">Resource Permissions</Label>
                                    <div className="grid grid-cols-1 gap-4 mt-3">
                                        {[
                                            { key: 'projects', label: 'Projects', description: 'Manage project data, stages, and assignments' },
                                            { key: 'clients', label: 'Clients', description: 'Manage client information and communications' },
                                            { key: 'documents', label: 'Documents', description: 'Upload, download, and manage documents' },
                                            { key: 'messages', label: 'Messages', description: 'Send and manage communications' },
                                            { key: 'reports', label: 'Reports', description: 'Generate and view analytics reports' }
                                        ].map((resource) => (
                                            <div key={resource.key} className="border rounded-md p-3 bg-gray-50">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div>
                                                        <span className="text-sm font-medium">{resource.label}</span>
                                                        <p className="text-xs text-gray-600">{resource.description}</p>
                                                    </div>
                                                </div>
                                                <div className="grid grid-cols-4 gap-3">
                                                    {[
                                                        { key: 'create', label: 'Create', color: 'text-green-600' },
                                                        { key: 'read', label: 'Read', color: 'text-blue-600' },
                                                        { key: 'update', label: 'Update', color: 'text-yellow-600' },
                                                        { key: 'delete', label: 'Delete', color: 'text-red-600' }
                                                    ].map((action) => (
                                                        <label key={action.key} className="flex items-center space-x-2 text-sm">
                                                            <input
                                                                type="checkbox"
                                                                checked={formData.permissions.resources?.find((r: any) => r.resource === resource.key)?.actions?.[action.key] || false}
                                                                onChange={(e) => handleResourcePermissionChange(resource.key, action.key, e.target.checked)}
                                                                className="rounded border-gray-300"
                                                            />
                                                            <span className={action.color}>{action.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* System Access */}
                                <div>
                                    <Label className="text-md font-semibold text-gray-700">System Access</Label>
                                    <div className="grid grid-cols-2 gap-3 mt-3">
                                        {[
                                            { key: 'reports', label: 'Reports & Analytics', description: 'Access system reports and analytics' },
                                            { key: 'settings', label: 'System Settings', description: 'Modify system configuration' },
                                            { key: 'userManagement', label: 'User Management', description: 'Manage user accounts and permissions' },
                                            { key: 'dataExport', label: 'Data Export', description: 'Export data from the system' },
                                            { key: 'adminPanel', label: 'Admin Panel', description: 'Access administrative features' },
                                            { key: 'systemLogs', label: 'System Logs', description: 'View system activity logs' }
                                        ].map((permission) => (
                                            <label key={permission.key} className="flex items-start space-x-3 p-2 border rounded bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.systemAccess?.[permission.key] || false}
                                                    onChange={(e) => handleSystemAccessChange(permission.key, e.target.checked)}
                                                    className="rounded border-gray-300 mt-1"
                                                />
                                                <div>
                                                    <span className="text-sm font-medium">{permission.label}</span>
                                                    <p className="text-xs text-gray-600">{permission.description}</p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                </div>

                                {/* Mobile & Security */}
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <Label className="text-md font-semibold text-gray-700">Mobile Access</Label>
                                        <div className="mt-3 space-y-2">
                                            <label className="flex items-center space-x-3 p-2 border rounded bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.mobile?.canAccess || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        permissions: {
                                                            ...formData.permissions,
                                                            mobile: {
                                                                ...formData.permissions.mobile,
                                                                canAccess: e.target.checked
                                                            }
                                                        }
                                                    })}
                                                    className="rounded border-gray-300"
                                                />
                                                <div>
                                                    <span className="text-sm font-medium">Mobile App Access</span>
                                                    <p className="text-xs text-gray-600">Allow access to mobile application</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-md font-semibold text-gray-700">Security Settings</Label>
                                        <div className="mt-3 space-y-2">
                                            <label className="flex items-center space-x-3 p-2 border rounded bg-gray-50">
                                                <input
                                                    type="checkbox"
                                                    checked={formData.permissions.security?.requiresTwoFactor || false}
                                                    onChange={(e) => setFormData({
                                                        ...formData,
                                                        permissions: {
                                                            ...formData.permissions,
                                                            security: {
                                                                ...formData.permissions.security,
                                                                requiresTwoFactor: e.target.checked
                                                            }
                                                        }
                                                    })}
                                                    className="rounded border-gray-300"
                                                />
                                                <div>
                                                    <span className="text-sm font-medium">Require 2FA</span>
                                                    <p className="text-xs text-gray-600">Require two-factor authentication</p>
                                                </div>
                                            </label>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>

                {/* Footer */}
                <div className="flex justify-end p-6 border-t bg-gray-50">
                    <Button
                        variant="outline"
                        className="mr-3"
                        onClick={onClose}
                    >
                        <X className="h-4 w-4 mr-2" />
                        Cancel
                    </Button>
                    <Button
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={handleSubmit}
                    >
                        <Save className="h-4 w-4 mr-2" />
                        Save Role
                    </Button>
                </div>
            </Card>
        </div>
    )
}
