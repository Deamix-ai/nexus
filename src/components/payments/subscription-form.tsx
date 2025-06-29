'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { X } from 'lucide-react'

interface Client {
    id: string
    firstName: string
    lastName: string
    email: string
}

interface SubscriptionFormProps {
    clients: Client[]
    onSubmit: (data: SubscriptionFormData) => Promise<void>
    onClose: () => void
    isLoading?: boolean
}

interface SubscriptionFormData {
    clientId: string
    planId: string
    priceId: string
    description?: string
    metadata?: Record<string, string>
}

// Mock subscription plans - in a real app, these would come from Stripe or a database
const SUBSCRIPTION_PLANS = [
    {
        id: 'basic-monthly',
        name: 'Basic Monthly',
        priceId: 'price_basic_monthly',
        amount: 2999, // £29.99
        interval: 'month',
        description: 'Basic plan with essential features'
    },
    {
        id: 'premium-monthly',
        name: 'Premium Monthly',
        priceId: 'price_premium_monthly',
        amount: 4999, // £49.99
        interval: 'month',
        description: 'Premium plan with advanced features'
    },
    {
        id: 'basic-yearly',
        name: 'Basic Yearly',
        priceId: 'price_basic_yearly',
        amount: 29999, // £299.99 (save 2 months)
        interval: 'year',
        description: 'Basic plan billed annually'
    },
    {
        id: 'premium-yearly',
        name: 'Premium Yearly',
        priceId: 'price_premium_yearly',
        amount: 49999, // £499.99 (save 2 months)
        interval: 'year',
        description: 'Premium plan billed annually'
    }
]

export default function SubscriptionForm({
    clients,
    onSubmit,
    onClose,
    isLoading = false
}: SubscriptionFormProps) {
    const [formData, setFormData] = useState<SubscriptionFormData>({
        clientId: '',
        planId: '',
        priceId: '',
        description: '',
        metadata: {}
    })
    const [errors, setErrors] = useState<Record<string, string>>({})

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        // Validation
        const newErrors: Record<string, string> = {}
        if (!formData.clientId) newErrors.clientId = 'Client is required'
        if (!formData.planId) newErrors.planId = 'Plan is required'
        if (!formData.priceId) newErrors.priceId = 'Price is required'

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }

        try {
            await onSubmit(formData)
            // Reset form on success
            setFormData({
                clientId: '',
                planId: '',
                priceId: '',
                description: '',
                metadata: {}
            })
            setErrors({})
        } catch (error) {
            console.error('Error creating subscription:', error)
        }
    }

    const handlePlanChange = (planId: string) => {
        const plan = SUBSCRIPTION_PLANS.find(p => p.id === planId)
        if (plan) {
            setFormData(prev => ({
                ...prev,
                planId,
                priceId: plan.priceId
            }))
        }
    }

    const selectedPlan = SUBSCRIPTION_PLANS.find(p => p.id === formData.planId)

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                        <CardTitle>Create New Subscription</CardTitle>
                        <CardDescription>
                            Set up a recurring subscription for a client
                        </CardDescription>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={onClose}
                        className="h-6 w-6 p-0"
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </CardHeader>

                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Client Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="clientId">Client</Label>
                            <select
                                id="clientId"
                                value={formData.clientId}
                                onChange={(e) => setFormData(prev => ({ ...prev, clientId: e.target.value }))}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a client...</option>
                                {clients.map(client => (
                                    <option key={client.id} value={client.id}>
                                        {client.firstName} {client.lastName} ({client.email})
                                    </option>
                                ))}
                            </select>
                            {errors.clientId && (
                                <p className="text-sm text-red-600">{errors.clientId}</p>
                            )}
                        </div>

                        {/* Plan Selection */}
                        <div className="space-y-2">
                            <Label htmlFor="planId">Subscription Plan</Label>
                            <select
                                id="planId"
                                value={formData.planId}
                                onChange={(e) => handlePlanChange(e.target.value)}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">Select a plan...</option>
                                {SUBSCRIPTION_PLANS.map(plan => (
                                    <option key={plan.id} value={plan.id}>
                                        {plan.name} - £{(plan.amount / 100).toFixed(2)}/{plan.interval}
                                    </option>
                                ))}
                            </select>
                            {errors.planId && (
                                <p className="text-sm text-red-600">{errors.planId}</p>
                            )}
                        </div>

                        {/* Plan Details */}
                        {selectedPlan && (
                            <Card className="bg-gray-50">
                                <CardContent className="pt-4">
                                    <h4 className="font-medium text-lg">{selectedPlan.name}</h4>
                                    <p className="text-sm text-gray-600 mb-2">{selectedPlan.description}</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        £{(selectedPlan.amount / 100).toFixed(2)}
                                        <span className="text-sm font-normal text-gray-500">
                                            /{selectedPlan.interval}
                                        </span>
                                    </p>
                                </CardContent>
                            </Card>
                        )}

                        {/* Description */}
                        <div className="space-y-2">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <Textarea
                                id="description"
                                value={formData.description}
                                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                                placeholder="Additional notes about this subscription..."
                                rows={3}
                            />
                        </div>

                        {/* Metadata */}
                        <div className="space-y-2">
                            <Label>Metadata (Optional)</Label>
                            <div className="space-y-2">
                                <Input
                                    placeholder="Key"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const key = e.currentTarget.value
                                            const valueInput = e.currentTarget.parentElement?.querySelector('input[placeholder="Value"]') as HTMLInputElement
                                            const value = valueInput?.value

                                            if (key && value) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    metadata: { ...prev.metadata, [key]: value }
                                                }))
                                                e.currentTarget.value = ''
                                                if (valueInput) valueInput.value = ''
                                            }
                                        }
                                    }}
                                />
                                <Input
                                    placeholder="Value"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault()
                                            const value = e.currentTarget.value
                                            const keyInput = e.currentTarget.parentElement?.querySelector('input[placeholder="Key"]') as HTMLInputElement
                                            const key = keyInput?.value

                                            if (key && value) {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    metadata: { ...prev.metadata, [key]: value }
                                                }))
                                                e.currentTarget.value = ''
                                                if (keyInput) keyInput.value = ''
                                            }
                                        }
                                    }}
                                />
                            </div>

                            {/* Display current metadata */}
                            {Object.keys(formData.metadata || {}).length > 0 && (
                                <div className="mt-2">
                                    <p className="text-sm text-gray-600 mb-1">Current metadata:</p>
                                    <div className="space-y-1">
                                        {Object.entries(formData.metadata || {}).map(([key, value]) => (
                                            <div key={key} className="flex items-center justify-between bg-gray-100 px-2 py-1 rounded text-sm">
                                                <span><strong>{key}:</strong> {value}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setFormData(prev => {
                                                            const newMetadata = { ...prev.metadata }
                                                            delete newMetadata[key]
                                                            return { ...prev, metadata: newMetadata }
                                                        })
                                                    }}
                                                    className="h-6 w-6 p-0 text-red-600 hover:text-red-800"
                                                >
                                                    <X className="h-3 w-3" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Form Actions */}
                        <div className="flex justify-end space-x-2 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={onClose}
                                disabled={isLoading}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="bg-blue-600 hover:bg-blue-700"
                            >
                                {isLoading ? 'Creating...' : 'Create Subscription'}
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
    )
}
