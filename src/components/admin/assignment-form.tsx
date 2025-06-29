'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Save, X, UserPlus } from 'lucide-react'

interface AssignmentFormProps {
    isOpen: boolean
    onClose: () => void
    onSave: (formData: any) => void
    users?: any[]
    roles?: any[]
}

export default function AssignmentForm({
    isOpen,
    onClose,
    onSave,
    users = [],
    roles = []
}: AssignmentFormProps) {
    const [formData, setFormData] = useState({
        userId: '',
        customRoleId: '',
        expiresAt: '',
        notes: ''
    })

    const handleSubmit = () => {
        if (!formData.userId || !formData.customRoleId) {
            alert('Please select both a user and a role')
            return
        }

        const submitData = {
            ...formData,
            expiresAt: formData.expiresAt ? new Date(formData.expiresAt).toISOString() : null
        }

        onSave(submitData)
        setFormData({
            userId: '',
            customRoleId: '',
            expiresAt: '',
            notes: ''
        })
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black opacity-30" onClick={onClose}></div>
            <Card className="max-w-lg w-full z-10 m-4">
                <CardHeader>
                    <CardTitle className="flex items-center">
                        <UserPlus className="h-5 w-5 mr-2" />
                        Assign Custom Role
                    </CardTitle>
                    <CardDescription>
                        Assign a custom role to a user with optional expiration
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div>
                            <Label>Select User</Label>
                            <select
                                value={formData.userId}
                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Choose a user...</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.firstName} {user.lastName} ({user.email}) - {user.role}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Select Custom Role</Label>
                            <select
                                value={formData.customRoleId}
                                onChange={(e) => setFormData({ ...formData, customRoleId: e.target.value })}
                                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
                            >
                                <option value="">Choose a role...</option>
                                {roles.filter(role => role.isActive).map((role) => (
                                    <option key={role.id} value={role.id}>
                                        {role.name} {role.showroom ? `(${role.showroom.name})` : '(Global)'}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <Label>Expiration Date (Optional)</Label>
                            <Input
                                type="datetime-local"
                                value={formData.expiresAt}
                                onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                                placeholder="Leave empty for permanent assignment"
                            />
                        </div>

                        <div>
                            <Label>Notes (Optional)</Label>
                            <Input
                                placeholder="Assignment notes or reasons..."
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                            />
                        </div>
                    </div>
                </CardContent>

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
                        Assign Role
                    </Button>
                </div>
            </Card>
        </div>
    )
}
