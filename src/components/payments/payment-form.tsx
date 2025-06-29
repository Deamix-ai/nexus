'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { CreditCard, DollarSign, Receipt, Users } from 'lucide-react'

interface PaymentFormProps {
    clientId?: string
    projectId?: string
    onSuccess?: (payment: any) => void
    onCancel?: () => void
}

export default function PaymentForm({
    clientId,
    projectId,
    onSuccess,
    onCancel
}: PaymentFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        amount: '',
        description: '',
        receiptEmail: ''
    })

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId) return

        setLoading(true)
        try {
            const response = await fetch('/api/payments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    amount: parseFloat(formData.amount),
                    description: formData.description,
                    clientId,
                    projectId,
                    receiptEmail: formData.receiptEmail
                })
            })

            const data = await response.json()

            if (data.success) {
                // In a real implementation, you would redirect to Stripe Checkout
                // or use Stripe Elements for card collection
                alert('Payment intent created! In production, this would redirect to payment page.')
                onSuccess?.(data.payment)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Payment error:', error)
            alert(error instanceof Error ? error.message : 'Failed to create payment')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-md w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <CreditCard className="h-5 w-5 mr-2" />
                    Request Payment
                </CardTitle>
                <CardDescription>
                    Create a payment request for the client
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="amount">Amount (£)</Label>
                        <div className="relative">
                            <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                            <Input
                                id="amount"
                                type="number"
                                step="0.01"
                                min="0"
                                placeholder="0.00"
                                value={formData.amount}
                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                className="pl-10"
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Payment for services..."
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    <div>
                        <Label htmlFor="receiptEmail">Receipt Email (Optional)</Label>
                        <Input
                            id="receiptEmail"
                            type="email"
                            placeholder="client@example.com"
                            value={formData.receiptEmail}
                            onChange={(e) => setFormData({ ...formData, receiptEmail: e.target.value })}
                        />
                    </div>

                    <div className="flex gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading || !clientId} className="flex-1">
                            {loading ? 'Creating...' : 'Create Payment Request'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
