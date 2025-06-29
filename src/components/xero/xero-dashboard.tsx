'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    DollarSign,
    Users,
    FileText,
    TrendingUp,
    RefreshCw,
    Download,
    Upload,
    Eye,
    Edit,
    Plus,
    CheckCircle,
    AlertCircle,
    Clock,
    RotateCcw,
    Search,
    Filter,
    Calendar,
    BarChart3
} from 'lucide-react'

interface XeroInvoice {
    id: string
    invoiceNumber: string
    contact: {
        id: string
        name: string
        email: string
    }
    status: 'draft' | 'submitted' | 'authorised' | 'paid' | 'voided'
    date: string
    dueDate: string
    total: number
    amountDue: number
    lineItems: Array<{
        description: string
        quantity: number
        unitAmount: number
        totalAmount: number
    }>
}

interface XeroContact {
    id: string
    name: string
    email: string
    phone: string
    address: string
    contactType: 'customer' | 'supplier'
    status: 'active' | 'archived'
    accountsReceivableOutstanding: number
    accountsPayableOutstanding: number
}

interface SyncStatus {
    lastSync: string
    status: 'success' | 'error' | 'pending'
    totalInvoices: number
    totalContacts: number
    pendingItems: number
    errorCount: number
}

export function XeroDashboard() {
    const [activeSection, setActiveSection] = useState('overview')
    const [invoices, setInvoices] = useState<XeroInvoice[]>([])
    const [contacts, setContacts] = useState<XeroContact[]>([])
    const [syncStatus, setSyncStatus] = useState<SyncStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Invoice form state
    const [invoiceForm, setInvoiceForm] = useState({
        contactId: '',
        description: '',
        lineItems: [
            { description: '', quantity: 1, unitAmount: 0 }
        ],
        dueDate: ''
    })

    // Contact form state
    const [contactForm, setContactForm] = useState({
        name: '',
        email: '',
        phone: '',
        address: '',
        contactType: 'customer' as 'customer' | 'supplier'
    })

    useEffect(() => {
        fetchInvoices()
        fetchContacts()
        fetchSyncStatus()
    }, [])

    const fetchInvoices = async () => {
        try {
            const response = await fetch('/api/xero/invoices')
            if (response.ok) {
                const data = await response.json()
                setInvoices(data.invoices || [])
            }
        } catch (error) {
            console.error('Error fetching invoices:', error)
        }
    }

    const fetchContacts = async () => {
        try {
            const response = await fetch('/api/xero/contacts')
            if (response.ok) {
                const data = await response.json()
                setContacts(data.contacts || [])
            }
        } catch (error) {
            console.error('Error fetching contacts:', error)
        }
    }

    const fetchSyncStatus = async () => {
        try {
            const response = await fetch('/api/xero/sync')
            if (response.ok) {
                const data = await response.json()
                setSyncStatus(data.syncStatus)
            }
        } catch (error) {
            console.error('Error fetching sync status:', error)
        }
    }

    const handleCreateInvoice = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!invoiceForm.contactId || !invoiceForm.description) {
            alert('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/xero/invoices', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(invoiceForm)
            })

            if (response.ok) {
                alert('Invoice created successfully in Xero!')
                setInvoiceForm({
                    contactId: '',
                    description: '',
                    lineItems: [{ description: '', quantity: 1, unitAmount: 0 }],
                    dueDate: ''
                })
                fetchInvoices()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create invoice')
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to create invoice'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateContact = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!contactForm.name || !contactForm.email) {
            alert('Please fill in name and email')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/xero/contacts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(contactForm)
            })

            if (response.ok) {
                alert('Contact created successfully in Xero!')
                setContactForm({
                    name: '',
                    email: '',
                    phone: '',
                    address: '',
                    contactType: 'customer'
                })
                fetchContacts()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create contact')
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to create contact'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleSync = async (type?: string) => {
        setLoading(true)
        try {
            const response = await fetch('/api/xero/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ type: type || 'all' })
            })

            if (response.ok) {
                alert('Synchronization started successfully!')
                fetchSyncStatus()
                fetchInvoices()
                fetchContacts()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to start synchronization')
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to start synchronization'}`)
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'paid':
            case 'authorised':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'submitted':
            case 'draft':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'voided':
                return <AlertCircle className="h-4 w-4 text-red-500" />
            default:
                return <FileText className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colorClass = {
            paid: 'bg-green-100 text-green-800',
            authorised: 'bg-blue-100 text-blue-800',
            submitted: 'bg-yellow-100 text-yellow-800',
            draft: 'bg-gray-100 text-gray-800',
            voided: 'bg-red-100 text-red-800'
        }[status] || 'bg-gray-100 text-gray-800'

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </span>
        )
    }

    const addLineItem = () => {
        setInvoiceForm({
            ...invoiceForm,
            lineItems: [...invoiceForm.lineItems, { description: '', quantity: 1, unitAmount: 0 }]
        })
    }

    const updateLineItem = (index: number, field: string, value: string | number) => {
        const newLineItems = [...invoiceForm.lineItems]
        newLineItems[index] = { ...newLineItems[index], [field]: value }
        setInvoiceForm({ ...invoiceForm, lineItems: newLineItems })
    }

    const removeLineItem = (index: number) => {
        if (invoiceForm.lineItems.length > 1) {
            const newLineItems = invoiceForm.lineItems.filter((_, i) => i !== index)
            setInvoiceForm({ ...invoiceForm, lineItems: newLineItems })
        }
    }

    // Filter data
    const filteredInvoices = invoices.filter(invoice => {
        const matchesSearch = invoice.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
            invoice.contact.name.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter
        return matchesSearch && matchesStatus
    })

    const filteredContacts = contacts.filter(contact => {
        const matchesSearch = contact.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchQuery.toLowerCase())
        return matchesSearch
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Xero Accounting</h1>
                    <p className="text-muted-foreground">
                        Manage invoices, contacts, and financial data with Xero integration
                    </p>
                </div>
                <Button onClick={() => handleSync()}>
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Sync Now
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Invoices</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{invoices.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Outstanding</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            ${invoices.reduce((sum, inv) => sum + inv.amountDue, 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Paid Invoices</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {invoices.filter(inv => inv.status === 'paid').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Contacts</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{contacts.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Sync Status</CardTitle>
                        <RotateCcw className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {syncStatus?.status === 'success' ? 'OK' :
                                syncStatus?.status === 'error' ? 'Error' : 'Pending'}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Sync Status Alert */}
            {syncStatus && (
                <Card>
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className={`p-2 rounded-full ${syncStatus.status === 'success' ? 'bg-green-100' :
                                        syncStatus.status === 'error' ? 'bg-red-100' : 'bg-yellow-100'
                                    }`}>
                                    {syncStatus.status === 'success' ? (
                                        <CheckCircle className="h-4 w-4 text-green-600" />
                                    ) : syncStatus.status === 'error' ? (
                                        <AlertCircle className="h-4 w-4 text-red-600" />
                                    ) : (
                                        <Clock className="h-4 w-4 text-yellow-600" />
                                    )}
                                </div>
                                <div>
                                    <p className="font-medium">
                                        Last Sync: {syncStatus.lastSync ? new Date(syncStatus.lastSync).toLocaleString() : 'Never'}
                                    </p>
                                    <p className="text-sm text-muted-foreground">
                                        {syncStatus.errorCount > 0 && `${syncStatus.errorCount} errors • `}
                                        {syncStatus.pendingItems > 0 && `${syncStatus.pendingItems} pending items`}
                                    </p>
                                </div>
                            </div>
                            <Button variant="outline" onClick={() => fetchSyncStatus()}>
                                <RefreshCw className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'overview', name: 'Overview', icon: BarChart3 },
                        { id: 'invoices', name: 'Invoices', icon: FileText },
                        { id: 'contacts', name: 'Contacts', icon: Users },
                        { id: 'create-invoice', name: 'Create Invoice', icon: Plus },
                        { id: 'create-contact', name: 'Add Contact', icon: Plus },
                    ].map((tab) => {
                        const Icon = tab.icon
                        return (
                            <button
                                key={tab.id}
                                onClick={() => setActiveSection(tab.id)}
                                className={`
                  flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm
                  ${activeSection === tab.id
                                        ? 'border-blue-500 text-blue-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }
                `}
                            >
                                <Icon className="h-4 w-4" />
                                <span>{tab.name}</span>
                            </button>
                        )
                    })}
                </nav>
            </div>

            {/* Overview Section */}
            {activeSection === 'overview' && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Invoices</CardTitle>
                            <CardDescription>Latest invoice activity</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {invoices.slice(0, 5).map((invoice) => (
                                    <div key={invoice.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{invoice.invoiceNumber}</p>
                                            <p className="text-sm text-muted-foreground">{invoice.contact.name}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-medium">${invoice.total.toLocaleString()}</p>
                                            {getStatusBadge(invoice.status)}
                                        </div>
                                    </div>
                                ))}
                                {invoices.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">No invoices found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Contacts</CardTitle>
                            <CardDescription>Newly added contacts</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                {contacts.slice(0, 5).map((contact) => (
                                    <div key={contact.id} className="flex items-center justify-between">
                                        <div>
                                            <p className="font-medium">{contact.name}</p>
                                            <p className="text-sm text-muted-foreground">{contact.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs ${contact.contactType === 'customer'
                                                    ? 'bg-blue-100 text-blue-800'
                                                    : 'bg-green-100 text-green-800'
                                                }`}>
                                                {contact.contactType}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                                {contacts.length === 0 && (
                                    <p className="text-center text-muted-foreground py-4">No contacts found</p>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Invoices Section */}
            {activeSection === 'invoices' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Invoices</CardTitle>
                                <CardDescription>Manage Xero invoices and billing</CardDescription>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search invoices..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-8 w-64"
                                    />
                                </div>
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    className="h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                >
                                    <option value="all">All Status</option>
                                    <option value="draft">Draft</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="authorised">Authorised</option>
                                    <option value="paid">Paid</option>
                                    <option value="voided">Voided</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredInvoices.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">
                                        {searchQuery || statusFilter !== 'all' ? 'No invoices match your filters' : 'No invoices found'}
                                    </p>
                                    <Button
                                        onClick={() => setActiveSection('create-invoice')}
                                        className="mt-4"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Invoice
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredInvoices.map((invoice) => (
                                        <div key={invoice.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <h3 className="font-medium">{invoice.invoiceNumber}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            {invoice.contact.name} • Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(invoice.status)}
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    <Button variant="outline" size="sm">
                                                        <Download className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Total Amount</h4>
                                                    <p className="text-lg font-bold">${invoice.total.toLocaleString()}</p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Amount Due</h4>
                                                    <p className="text-lg font-bold text-orange-600">
                                                        ${invoice.amountDue.toLocaleString()}
                                                    </p>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Line Items</h4>
                                                    <p className="text-sm text-muted-foreground">
                                                        {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Contacts Section */}
            {activeSection === 'contacts' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Contacts</CardTitle>
                                <CardDescription>Manage Xero contacts and customers</CardDescription>
                            </div>
                            <div className="relative">
                                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search contacts..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-8 w-64"
                                />
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredContacts.length === 0 ? (
                                <div className="text-center py-8">
                                    <Users className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">
                                        {searchQuery ? 'No contacts match your search' : 'No contacts found'}
                                    </p>
                                    <Button
                                        onClick={() => setActiveSection('create-contact')}
                                        className="mt-4"
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Contact
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {filteredContacts.map((contact) => (
                                        <div key={contact.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium">{contact.name}</h3>
                                                <span className={`text-xs px-2 py-1 rounded-full ${contact.contactType === 'customer'
                                                        ? 'bg-blue-100 text-blue-800'
                                                        : 'bg-green-100 text-green-800'
                                                    }`}>
                                                    {contact.contactType}
                                                </span>
                                            </div>
                                            <div className="space-y-1 text-sm text-muted-foreground">
                                                <p>{contact.email}</p>
                                                {contact.phone && <p>{contact.phone}</p>}
                                                {contact.accountsReceivableOutstanding > 0 && (
                                                    <p className="text-orange-600 font-medium">
                                                        Outstanding: ${contact.accountsReceivableOutstanding.toLocaleString()}
                                                    </p>
                                                )}
                                            </div>
                                            <div className="mt-3 flex space-x-2">
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button variant="outline" size="sm" className="flex-1">
                                                    <Eye className="h-3 w-3 mr-1" />
                                                    View
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Create Invoice Section */}
            {activeSection === 'create-invoice' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Create Invoice</CardTitle>
                        <CardDescription>Create a new invoice in Xero</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateInvoice} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contact">Contact *</Label>
                                    <select
                                        id="contact"
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                        value={invoiceForm.contactId}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, contactId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select contact...</option>
                                        {contacts.filter(c => c.contactType === 'customer').map((contact) => (
                                            <option key={contact.id} value={contact.id}>
                                                {contact.name} ({contact.email})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="dueDate">Due Date</Label>
                                    <Input
                                        id="dueDate"
                                        type="date"
                                        value={invoiceForm.dueDate}
                                        onChange={(e) => setInvoiceForm({ ...invoiceForm, dueDate: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="description">Description</Label>
                                <Textarea
                                    id="description"
                                    placeholder="Invoice description or reference"
                                    value={invoiceForm.description}
                                    onChange={(e) => setInvoiceForm({ ...invoiceForm, description: e.target.value })}
                                    rows={2}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Line Items *</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Item
                                    </Button>
                                </div>

                                {invoiceForm.lineItems.map((item, index) => (
                                    <div key={index} className="grid gap-4 md:grid-cols-5 items-end border p-3 rounded">
                                        <div className="space-y-2 md:col-span-2">
                                            <Label>Description</Label>
                                            <Input
                                                placeholder="Bathroom renovation"
                                                value={item.description}
                                                onChange={(e) => updateLineItem(index, 'description', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Quantity</Label>
                                            <Input
                                                type="number"
                                                min="1"
                                                value={item.quantity}
                                                onChange={(e) => updateLineItem(index, 'quantity', parseInt(e.target.value) || 1)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Unit Price</Label>
                                            <Input
                                                type="number"
                                                min="0"
                                                step="0.01"
                                                value={item.unitAmount}
                                                onChange={(e) => updateLineItem(index, 'unitAmount', parseFloat(e.target.value) || 0)}
                                                required
                                            />
                                        </div>
                                        <div className="flex items-end space-x-2">
                                            <div className="text-sm font-medium">
                                                ${(item.quantity * item.unitAmount).toFixed(2)}
                                            </div>
                                            {invoiceForm.lineItems.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeLineItem(index)}
                                                >
                                                    ✕
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="text-right">
                                <div className="text-lg font-bold">
                                    Total: ${invoiceForm.lineItems.reduce((sum, item) => sum + (item.quantity * item.unitAmount), 0).toFixed(2)}
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Invoice in Xero'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Create Contact Section */}
            {activeSection === 'create-contact' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Add Contact</CardTitle>
                        <CardDescription>Create a new contact in Xero</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateContact} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contactName">Name *</Label>
                                    <Input
                                        id="contactName"
                                        placeholder="John Smith"
                                        value={contactForm.name}
                                        onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactEmail">Email *</Label>
                                    <Input
                                        id="contactEmail"
                                        type="email"
                                        placeholder="john@example.com"
                                        value={contactForm.email}
                                        onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="contactPhone">Phone</Label>
                                    <Input
                                        id="contactPhone"
                                        placeholder="+1 (555) 123-4567"
                                        value={contactForm.phone}
                                        onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="contactType">Contact Type</Label>
                                    <select
                                        id="contactType"
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                        value={contactForm.contactType}
                                        onChange={(e) => setContactForm({ ...contactForm, contactType: e.target.value as 'customer' | 'supplier' })}
                                    >
                                        <option value="customer">Customer</option>
                                        <option value="supplier">Supplier</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="contactAddress">Address</Label>
                                <Textarea
                                    id="contactAddress"
                                    placeholder="123 Main St, City, State 12345"
                                    value={contactForm.address}
                                    onChange={(e) => setContactForm({ ...contactForm, address: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                <Plus className="mr-2 h-4 w-4" />
                                {loading ? 'Creating...' : 'Create Contact in Xero'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
