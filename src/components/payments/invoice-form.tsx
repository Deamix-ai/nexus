'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Receipt, Plus, Trash2 } from 'lucide-react'

interface LineItem {
    description: string
    quantity: number
    unitPrice: number
}

interface InvoiceFormProps {
    clientId?: string
    projectId?: string
    onSuccess?: (invoice: any) => void
    onCancel?: () => void
}

export default function InvoiceForm({
    clientId,
    projectId,
    onSuccess,
    onCancel
}: InvoiceFormProps) {
    const [loading, setLoading] = useState(false)
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        dueDate: '',
        notes: '',
        terms: 'Payment due within 30 days of invoice date.'
    })
    const [lineItems, setLineItems] = useState<LineItem[]>([
        { description: '', quantity: 1, unitPrice: 0 }
    ])

    const addLineItem = () => {
        setLineItems([...lineItems, { description: '', quantity: 1, unitPrice: 0 }])
    }

    const removeLineItem = (index: number) => {
        if (lineItems.length > 1) {
            setLineItems(lineItems.filter((_, i) => i !== index))
        }
    }

    const updateLineItem = (index: number, field: keyof LineItem, value: string | number) => {
        const updated = [...lineItems]
        updated[index] = { ...updated[index], [field]: value }
        setLineItems(updated)
    }

    const calculateSubtotal = () => {
        return lineItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0)
    }

    const calculateTax = () => {
        return calculateSubtotal() * 0.20 // 20% VAT
    }

    const calculateTotal = () => {
        return calculateSubtotal() + calculateTax()
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!clientId) return

        setLoading(true)
        try {
            const response = await fetch('/api/invoices', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title: formData.title,
                    description: formData.description,
                    clientId,
                    projectId,
                    dueDate: formData.dueDate || undefined,
                    lineItems: lineItems.filter(item => item.description && item.unitPrice > 0),
                    notes: formData.notes,
                    terms: formData.terms
                })
            })

            const data = await response.json()

            if (data.success) {
                onSuccess?.(data.invoice)
            } else {
                throw new Error(data.error)
            }
        } catch (error) {
            console.error('Invoice error:', error)
            alert(error instanceof Error ? error.message : 'Failed to create invoice')
        } finally {
            setLoading(false)
        }
    }

    return (
        <Card className="max-w-4xl w-full">
            <CardHeader>
                <CardTitle className="flex items-center">
                    <Receipt className="h-5 w-5 mr-2" />
                    Create Invoice
                </CardTitle>
                <CardDescription>
                    Generate a professional invoice for the client
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="title">Invoice Title</Label>
                            <Input
                                id="title"
                                placeholder="Bathroom Renovation Services"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                required
                            />
                        </div>
                        <div>
                            <Label htmlFor="dueDate">Due Date</Label>
                            <Input
                                id="dueDate"
                                type="date"
                                value={formData.dueDate}
                                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                            />
                        </div>
                    </div>

                    <div>
                        <Label htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            placeholder="Brief description of services provided"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                    </div>

                    {/* Line Items */}
                    <div>
                        <div className="flex items-center justify-between mb-4">
                            <Label className="text-lg font-medium">Line Items</Label>
                            <Button type="button" onClick={addLineItem} size="sm" variant="outline">
                                <Plus className="h-4 w-4 mr-2" />
                                Add Item
                            </Button>
                        </div>

                        <div className="space-y-3">
                            {lineItems.map((item, index) => (
                                <div key={index} className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-5">
                                        <Label className="text-sm">Description</Label>
                                        <Input
                                            placeholder="Service or product description"
                                            value={item.description}
                                            onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-sm">Qty</Label>
                                        <Input
                                            type="number"
                                            min="1"
                                            step="1"
                                            value={item.quantity}
                                            onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-sm">Unit Price (£)</Label>
                                        <Input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            value={item.unitPrice}
                                            onChange={(e) => updateLineItem(index, 'unitPrice', parseFloat(e.target.value) || 0)}
                                        />
                                    </div>
                                    <div className="col-span-2">
                                        <Label className="text-sm">Total</Label>
                                        <div className="h-10 flex items-center px-3 bg-gray-50 rounded border text-sm">
                                            £{(item.quantity * item.unitPrice).toFixed(2)}
                                        </div>
                                    </div>
                                    <div className="col-span-1">
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={() => removeLineItem(index)}
                                            disabled={lineItems.length === 1}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="mt-6 border-t pt-4">
                            <div className="grid grid-cols-2 gap-4 max-w-sm ml-auto">
                                <div className="text-right">
                                    <p className="text-sm text-gray-600">Subtotal:</p>
                                    <p className="text-sm text-gray-600">VAT (20%):</p>
                                    <p className="font-semibold">Total:</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm">£{calculateSubtotal().toFixed(2)}</p>
                                    <p className="text-sm">£{calculateTax().toFixed(2)}</p>
                                    <p className="font-semibold">£{calculateTotal().toFixed(2)}</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Additional Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <Label htmlFor="notes">Notes</Label>
                            <textarea
                                id="notes"
                                placeholder="Additional notes for the client"
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                        <div>
                            <Label htmlFor="terms">Terms & Conditions</Label>
                            <textarea
                                id="terms"
                                value={formData.terms}
                                onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                rows={3}
                            />
                        </div>
                    </div>

                    <div className="flex gap-2 pt-4">
                        {onCancel && (
                            <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
                                Cancel
                            </Button>
                        )}
                        <Button type="submit" disabled={loading || !clientId} className="flex-1">
                            {loading ? 'Creating...' : 'Create Invoice'}
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    )
}
