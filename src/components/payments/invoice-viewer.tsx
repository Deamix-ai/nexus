'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Download,
    Send,
    Eye,
    DollarSign,
    Calendar,
    User,
    FileText,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react'

interface InvoiceViewerProps {
    invoice: {
        id: string
        invoiceNumber: string
        title: string
        status: string
        totalAmount: number
        formattedTotalAmount: string
        amountPaid: number
        formattedAmountPaid: string
        amountDue: number
        formattedAmountDue: string
        dueDate?: string
        createdAt: string
        client: {
            firstName: string
            lastName: string
            email: string
        }
        project?: {
            name: string
            projectNumber: string
        }
        lineItems?: Array<{
            id: string
            description: string
            quantity: number
            unitPrice: number
            totalPrice: number
        }>
    }
    onClose: () => void
    onSend?: (invoiceId: string) => Promise<void>
    onMarkPaid?: (invoiceId: string) => Promise<void>
    onDownload?: (invoiceId: string) => Promise<void>
}

export default function InvoiceViewer({
    invoice,
    onClose,
    onSend,
    onMarkPaid,
    onDownload
}: InvoiceViewerProps) {
    const [loading, setLoading] = useState(false)
    const [action, setAction] = useState<string | null>(null)

    const handleAction = async (actionType: string, actionFn?: (id: string) => Promise<void>) => {
        if (!actionFn) return

        setLoading(true)
        setAction(actionType)

        try {
            await actionFn(invoice.id)
        } catch (error) {
            console.error(`Error ${actionType}:`, error)
        } finally {
            setLoading(false)
            setAction(null)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return <CheckCircle className="h-5 w-5 text-green-600" />
            case 'canceled':
            case 'void':
                return <XCircle className="h-5 w-5 text-red-600" />
            case 'draft':
            case 'open':
                return <Clock className="h-5 w-5 text-yellow-600" />
            default:
                return <FileText className="h-5 w-5 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'paid':
                return 'text-green-600 bg-green-100'
            case 'canceled':
            case 'void':
                return 'text-red-600 bg-red-100'
            case 'overdue':
                return 'text-orange-600 bg-orange-100'
            case 'draft':
            case 'open':
                return 'text-yellow-600 bg-yellow-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        })
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
                <CardHeader className="border-b">
                    <div className="flex items-start justify-between">
                        <div>
                            <CardTitle className="text-2xl font-bold">
                                Invoice {invoice.invoiceNumber}
                            </CardTitle>
                            <CardDescription className="text-lg mt-1">
                                {invoice.title}
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(invoice.status)}`}>
                                {getStatusIcon(invoice.status)}
                                {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                            </div>
                            <Button variant="ghost" onClick={onClose}>
                                ×
                            </Button>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-6">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Invoice Details */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="h-5 w-5" />
                                    Invoice Details
                                </h3>
                                <div className="space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Invoice Number:</span>
                                        <span className="font-medium">{invoice.invoiceNumber}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Created:</span>
                                        <span className="font-medium">{formatDate(invoice.createdAt)}</span>
                                    </div>
                                    {invoice.dueDate && (
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Due Date:</span>
                                            <span className="font-medium">{formatDate(invoice.dueDate)}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <User className="h-5 w-5" />
                                    Client Information
                                </h3>
                                <div className="space-y-2">
                                    <p className="font-medium">
                                        {invoice.client.firstName} {invoice.client.lastName}
                                    </p>
                                    <p className="text-gray-600">{invoice.client.email}</p>
                                </div>
                            </div>

                            {invoice.project && (
                                <div>
                                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                        <Calendar className="h-5 w-5" />
                                        Project Information
                                    </h3>
                                    <div className="space-y-2">
                                        <p className="font-medium">{invoice.project.name}</p>
                                        <p className="text-gray-600">#{invoice.project.projectNumber}</p>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Financial Summary */}
                        <div className="space-y-6">
                            <div>
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Financial Summary
                                </h3>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Total Amount:</span>
                                        <span className="font-medium text-lg">{invoice.formattedTotalAmount}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-gray-600">Amount Paid:</span>
                                        <span className="font-medium text-green-600">{invoice.formattedAmountPaid}</span>
                                    </div>
                                    <div className="border-t pt-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold">Amount Due:</span>
                                            <span className="font-bold text-xl text-red-600">{invoice.formattedAmountDue}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Actions */}
                            <div>
                                <h3 className="text-lg font-semibold mb-4">Actions</h3>
                                <div className="space-y-3">
                                    {onDownload && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => handleAction('download', onDownload)}
                                            disabled={loading}
                                        >
                                            <Download className="h-4 w-4 mr-2" />
                                            {loading && action === 'download' ? 'Downloading...' : 'Download PDF'}
                                        </Button>
                                    )}

                                    {onSend && invoice.status !== 'paid' && (
                                        <Button
                                            variant="outline"
                                            className="w-full justify-start"
                                            onClick={() => handleAction('send', onSend)}
                                            disabled={loading}
                                        >
                                            <Send className="h-4 w-4 mr-2" />
                                            {loading && action === 'send' ? 'Sending...' : 'Send to Client'}
                                        </Button>
                                    )}

                                    {onMarkPaid && invoice.status !== 'paid' && invoice.amountDue > 0 && (
                                        <Button
                                            className="w-full justify-start bg-green-600 hover:bg-green-700"
                                            onClick={() => handleAction('markPaid', onMarkPaid)}
                                            disabled={loading}
                                        >
                                            <CheckCircle className="h-4 w-4 mr-2" />
                                            {loading && action === 'markPaid' ? 'Processing...' : 'Mark as Paid'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Line Items */}
                    {invoice.lineItems && invoice.lineItems.length > 0 && (
                        <div className="mt-8">
                            <h3 className="text-lg font-semibold mb-4">Line Items</h3>
                            <div className="overflow-x-auto">
                                <table className="w-full border-collapse border border-gray-200">
                                    <thead>
                                        <tr className="bg-gray-50">
                                            <th className="border border-gray-200 px-4 py-2 text-left">Description</th>
                                            <th className="border border-gray-200 px-4 py-2 text-center">Quantity</th>
                                            <th className="border border-gray-200 px-4 py-2 text-right">Unit Price</th>
                                            <th className="border border-gray-200 px-4 py-2 text-right">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {invoice.lineItems.map((item) => (
                                            <tr key={item.id}>
                                                <td className="border border-gray-200 px-4 py-2">{item.description}</td>
                                                <td className="border border-gray-200 px-4 py-2 text-center">{item.quantity}</td>
                                                <td className="border border-gray-200 px-4 py-2 text-right">
                                                    £{(item.unitPrice / 100).toFixed(2)}
                                                </td>
                                                <td className="border border-gray-200 px-4 py-2 text-right font-medium">
                                                    £{(item.totalPrice / 100).toFixed(2)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
