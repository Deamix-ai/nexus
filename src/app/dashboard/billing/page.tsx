'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import PaymentForm from '@/components/payments/payment-form'
import InvoiceForm from '@/components/payments/invoice-form'
import SubscriptionForm from '@/components/payments/subscription-form'
import FinancialAnalytics from '@/components/analytics/financial-analytics'
import {
    CreditCard,
    Receipt,
    Plus,
    Search,
    Filter,
    Download,
    Send,
    Eye,
    DollarSign,
    Users,
    Calendar,
    CheckCircle,
    XCircle,
    Clock,
    Repeat,
    BarChart3
} from 'lucide-react'

interface Payment {
    id: string
    amount: number
    formattedAmount: string
    status: string
    description?: string
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
}

interface Subscription {
    id: string
    planId: string
    status: string
    amount: number
    formattedAmount: string
    currency: string
    currentPeriodStart: string
    currentPeriodEnd: string
    description?: string
    createdAt: string
    client: {
        firstName: string
        lastName: string
        email: string
    }
    showroom?: {
        name: string
    }
}

interface Invoice {
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
}

export default function BillingPage() {
    const [activeTab, setActiveTab] = useState<'payments' | 'invoices' | 'subscriptions' | 'analytics'>('payments')
    const [showPaymentForm, setShowPaymentForm] = useState(false)
    const [showInvoiceForm, setShowInvoiceForm] = useState(false)
    const [showSubscriptionForm, setShowSubscriptionForm] = useState(false)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    // Payments
    const [payments, setPayments] = useState<Payment[]>([])
    const [paymentFilter, setPaymentFilter] = useState('')
    const [paymentStatusFilter, setPaymentStatusFilter] = useState('')

    // Invoices
    const [invoices, setInvoices] = useState<Invoice[]>([])
    const [invoiceFilter, setInvoiceFilter] = useState('')
    const [invoiceStatusFilter, setInvoiceStatusFilter] = useState('')

    // Subscriptions
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
    const [subscriptionFilter, setSubscriptionFilter] = useState('')
    const [subscriptionStatusFilter, setSubscriptionStatusFilter] = useState('')

    // Clients (for forms)
    const [clients, setClients] = useState<any[]>([])

    useEffect(() => {
        fetchData()
    }, [activeTab])

    const fetchData = async () => {
        setLoading(true)
        try {
            if (activeTab === 'payments') {
                await fetchPayments()
            } else if (activeTab === 'invoices') {
                await fetchInvoices()
            } else if (activeTab === 'subscriptions') {
                await fetchSubscriptions()
            } else if (activeTab === 'analytics') {
                // Analytics tab doesn't need data fetching as it has its own loading
                return
            }

            // Always fetch clients for forms
            await fetchClients()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchPayments = async () => {
        const params = new URLSearchParams()
        if (paymentStatusFilter) params.set('status', paymentStatusFilter)

        const response = await fetch(`/api/payments?${params}`)
        if (!response.ok) throw new Error('Failed to fetch payments')
        const data = await response.json()
        setPayments(data.payments || [])
    }

    const fetchInvoices = async () => {
        const params = new URLSearchParams()
        if (invoiceStatusFilter) params.set('status', invoiceStatusFilter)

        const response = await fetch(`/api/invoices?${params}`)
        if (!response.ok) throw new Error('Failed to fetch invoices')
        const data = await response.json()
        setInvoices(data.invoices || [])
    }

    const fetchSubscriptions = async () => {
        const params = new URLSearchParams()
        if (subscriptionStatusFilter) params.set('status', subscriptionStatusFilter)

        const response = await fetch(`/api/subscriptions?${params}`)
        if (!response.ok) throw new Error('Failed to fetch subscriptions')
        const data = await response.json()
        setSubscriptions(data.subscriptions || [])
    }

    const fetchClients = async () => {
        const response = await fetch('/api/clients')
        if (!response.ok) throw new Error('Failed to fetch clients')
        const data = await response.json()
        setClients(data.clients || [])
    }

    const getStatusIcon = (status: string) => {
        switch (status.toLowerCase()) {
            case 'succeeded':
            case 'paid':
                return <CheckCircle className="h-4 w-4 text-green-600" />
            case 'failed':
            case 'canceled':
                return <XCircle className="h-4 w-4 text-red-600" />
            case 'pending':
            case 'processing':
                return <Clock className="h-4 w-4 text-yellow-600" />
            default:
                return <Clock className="h-4 w-4 text-gray-600" />
        }
    }

    const getStatusColor = (status: string) => {
        switch (status.toLowerCase()) {
            case 'succeeded':
            case 'paid':
                return 'text-green-600 bg-green-100'
            case 'failed':
            case 'canceled':
                return 'text-red-600 bg-red-100'
            case 'pending':
            case 'processing':
                return 'text-yellow-600 bg-yellow-100'
            case 'overdue':
                return 'text-orange-600 bg-orange-100'
            default:
                return 'text-gray-600 bg-gray-100'
        }
    }

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        })
    }

    const filteredPayments = payments.filter(payment => {
        const matchesSearch = !paymentFilter ||
            payment.client.firstName.toLowerCase().includes(paymentFilter.toLowerCase()) ||
            payment.client.lastName.toLowerCase().includes(paymentFilter.toLowerCase()) ||
            payment.description?.toLowerCase().includes(paymentFilter.toLowerCase())

        return matchesSearch
    })

    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = !invoiceFilter ||
            invoice.invoiceNumber.toLowerCase().includes(invoiceFilter.toLowerCase()) ||
            invoice.title.toLowerCase().includes(invoiceFilter.toLowerCase()) ||
            invoice.client.firstName.toLowerCase().includes(invoiceFilter.toLowerCase()) ||
            invoice.client.lastName.toLowerCase().includes(invoiceFilter.toLowerCase())

        return matchesSearch
    })

    const filteredSubscriptions = subscriptions.filter(subscription => {
        const matchesSearch = !subscriptionFilter ||
            subscription.planId.toLowerCase().includes(subscriptionFilter.toLowerCase()) ||
            subscription.client.firstName.toLowerCase().includes(subscriptionFilter.toLowerCase()) ||
            subscription.client.lastName.toLowerCase().includes(subscriptionFilter.toLowerCase()) ||
            subscription.description?.toLowerCase().includes(subscriptionFilter.toLowerCase())

        return matchesSearch
    })

    const handleSubscriptionSubmit = async (data: any) => {
        try {
            const response = await fetch('/api/subscriptions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            })

            if (!response.ok) {
                throw new Error('Failed to create subscription')
            }

            const result = await response.json()
            setShowSubscriptionForm(false)
            await fetchSubscriptions()

            // If there's a client secret, redirect to Stripe checkout
            if (result.stripeClientSecret) {
                // In a real implementation, you'd redirect to Stripe Elements or Checkout
                console.log('Stripe client secret:', result.stripeClientSecret)
            }
        } catch (error) {
            console.error('Error creating subscription:', error)
            throw error
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading billing data...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Billing & Payments</h1>
                    <p className="text-gray-600">Manage payments, invoices, and financial transactions</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        onClick={() => setShowPaymentForm(true)}
                        className="bg-green-600 hover:bg-green-700"
                    >
                        <CreditCard className="h-4 w-4 mr-2" />
                        New Payment
                    </Button>
                    <Button
                        onClick={() => setShowInvoiceForm(true)}
                        className="bg-blue-600 hover:bg-blue-700"
                    >
                        <Receipt className="h-4 w-4 mr-2" />
                        New Invoice
                    </Button>
                    <Button
                        onClick={() => setShowSubscriptionForm(true)}
                        className="bg-purple-600 hover:bg-purple-700"
                    >
                        <Repeat className="h-4 w-4 mr-2" />
                        New Subscription
                    </Button>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'payments', label: 'Payments', icon: CreditCard },
                        { key: 'invoices', label: 'Invoices', icon: Receipt },
                        { key: 'subscriptions', label: 'Subscriptions', icon: Repeat },
                        { key: 'analytics', label: 'Analytics', icon: BarChart3 },
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

            {/* Payments Tab */}
            {activeTab === 'payments' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search payments..."
                                            value={paymentFilter}
                                            onChange={(e) => setPaymentFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={paymentStatusFilter}
                                    onChange={(e) => setPaymentStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="PENDING">Pending</option>
                                    <option value="SUCCEEDED">Succeeded</option>
                                    <option value="FAILED">Failed</option>
                                </select>
                                <Button onClick={fetchPayments} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Payments List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredPayments.map((payment) => (
                            <Card key={payment.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(payment.status)}
                                                <div>
                                                    <p className="font-medium">
                                                        {payment.client.firstName} {payment.client.lastName}
                                                    </p>
                                                    <p className="text-sm text-gray-600">{payment.client.email}</p>
                                                </div>
                                            </div>
                                            <div className="hidden md:block">
                                                {payment.project && (
                                                    <div>
                                                        <p className="text-sm font-medium">{payment.project.name}</p>
                                                        <p className="text-xs text-gray-600">{payment.project.projectNumber}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-semibold">{payment.formattedAmount}</p>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}>
                                                    {payment.status}
                                                </span>
                                                <span className="text-sm text-gray-600">{formatDate(payment.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {payment.description && (
                                        <p className="mt-2 text-sm text-gray-600">{payment.description}</p>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredPayments.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No payments found</p>
                                <p className="text-sm text-gray-500 mt-1">Create payment requests to get started</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Invoices Tab */}
            {activeTab === 'invoices' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search invoices..."
                                            value={invoiceFilter}
                                            onChange={(e) => setInvoiceFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={invoiceStatusFilter}
                                    onChange={(e) => setInvoiceStatusFilter(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="DRAFT">Draft</option>
                                    <option value="SENT">Sent</option>
                                    <option value="PAID">Paid</option>
                                    <option value="OVERDUE">Overdue</option>
                                </select>
                                <Button onClick={fetchInvoices} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Refresh
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Invoices List */}
                    <div className="grid grid-cols-1 gap-4">
                        {filteredInvoices.map((invoice) => (
                            <Card key={invoice.id} className="hover:shadow-md transition-shadow">
                                <CardContent className="pt-6">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-4">
                                            <div className="flex items-center space-x-2">
                                                {getStatusIcon(invoice.status)}
                                                <div>
                                                    <p className="font-medium">{invoice.invoiceNumber}</p>
                                                    <p className="text-sm text-gray-600">{invoice.title}</p>
                                                </div>
                                            </div>
                                            <div className="hidden md:block">
                                                <p className="text-sm font-medium">
                                                    {invoice.client.firstName} {invoice.client.lastName}
                                                </p>
                                                <p className="text-xs text-gray-600">{invoice.client.email}</p>
                                            </div>
                                        </div>

                                        <div className="text-right">
                                            <p className="text-lg font-semibold">{invoice.formattedTotalAmount}</p>
                                            <div className="flex items-center space-x-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(invoice.status)}`}>
                                                    {invoice.status}
                                                </span>
                                                <span className="text-sm text-gray-600">{formatDate(invoice.createdAt)}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {invoice.amountDue > 0 && (
                                        <div className="mt-2 text-sm">
                                            <span className="text-gray-600">Amount Due: </span>
                                            <span className="font-medium text-red-600">{invoice.formattedAmountDue}</span>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <Button size="sm" variant="outline">
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                        <Button size="sm" variant="outline">
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                        </Button>
                                        {invoice.status === 'DRAFT' && (
                                            <Button size="sm" variant="outline">
                                                <Send className="h-3 w-3 mr-1" />
                                                Send
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredInvoices.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Receipt className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No invoices found</p>
                                <p className="text-sm text-gray-500 mt-1">Create invoices to manage billing</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Subscriptions Tab */}
            {activeTab === 'subscriptions' && (
                <div className="space-y-6">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex flex-col sm:flex-row gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search subscriptions..."
                                            value={subscriptionFilter}
                                            onChange={(e) => setSubscriptionFilter(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <div className="sm:w-48">
                                    <select
                                        value={subscriptionStatusFilter}
                                        onChange={(e) => setSubscriptionStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">All Statuses</option>
                                        <option value="active">Active</option>
                                        <option value="trialing">Trialing</option>
                                        <option value="past_due">Past Due</option>
                                        <option value="canceled">Canceled</option>
                                        <option value="unpaid">Unpaid</option>
                                    </select>
                                </div>
                                <Button variant="outline" size="sm">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Filter
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Subscriptions List */}
                    <div className="grid gap-4">
                        {filteredSubscriptions.map((subscription) => (
                            <Card key={subscription.id}>
                                <CardContent className="pt-6">
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-lg">{subscription.planId}</h3>
                                                <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(subscription.status)}`}>
                                                    {getStatusIcon(subscription.status)}
                                                    {subscription.status}
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                                <div>
                                                    <p className="font-medium text-gray-900">Client</p>
                                                    <p className="text-gray-600">
                                                        {subscription.client.firstName} {subscription.client.lastName}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Amount</p>
                                                    <p className="text-gray-600">{subscription.formattedAmount}</p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Current Period</p>
                                                    <p className="text-gray-600">
                                                        {formatDate(subscription.currentPeriodStart)} - {formatDate(subscription.currentPeriodEnd)}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">Created</p>
                                                    <p className="text-gray-600">{formatDate(subscription.createdAt)}</p>
                                                </div>
                                            </div>
                                            {subscription.description && (
                                                <p className="text-sm text-gray-600 mt-2">{subscription.description}</p>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-2 ml-4">
                                            <Button variant="outline" size="sm">
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Button>
                                            {subscription.status === 'active' && (
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="text-red-600 hover:text-red-700"
                                                >
                                                    Cancel
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>

                    {filteredSubscriptions.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Repeat className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No subscriptions found</p>
                                <p className="text-sm text-gray-500 mt-1">Create subscriptions for recurring billing</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
                <div className="space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <BarChart3 className="h-5 w-5" />
                                Financial Analytics
                            </CardTitle>
                            <CardDescription>
                                Comprehensive insights into your financial performance
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <FinancialAnalytics timeframe="30d" />
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Modals */}
            {showPaymentForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50">
                    <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowPaymentForm(false)}></div>
                    <div className="z-10">
                        <PaymentForm
                            onSuccess={(payment) => {
                                setShowPaymentForm(false)
                                fetchPayments()
                            }}
                            onCancel={() => setShowPaymentForm(false)}
                        />
                    </div>
                </div>
            )}

            {showInvoiceForm && (
                <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                    <div className="absolute inset-0 bg-black opacity-30" onClick={() => setShowInvoiceForm(false)}></div>
                    <div className="z-10 max-h-full overflow-y-auto">
                        <InvoiceForm
                            onSuccess={(invoice) => {
                                setShowInvoiceForm(false)
                                fetchInvoices()
                            }}
                            onCancel={() => setShowInvoiceForm(false)}
                        />
                    </div>
                </div>
            )}
            {showSubscriptionForm && (
                <SubscriptionForm
                    clients={clients}
                    onSubmit={handleSubscriptionSubmit}
                    onClose={() => setShowSubscriptionForm(false)}
                    isLoading={loading}
                />
            )}
        </div>
    )
}
