'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    FileText,
    Send,
    Clock,
    CheckCircle,
    XCircle,
    Download,
    Eye,
    Edit,
    Plus,
    Users,
    Upload,
    AlertTriangle,
    Settings,
    Activity,
    Webhook,
    Save,
    Copy,
    Trash2,
    Search,
    Filter
} from 'lucide-react'

interface DocuSignEnvelope {
    id: string
    subject: string
    status: 'sent' | 'delivered' | 'completed' | 'declined' | 'voided' | 'created'
    createdDate: string
    sentDate?: string
    completedDate?: string
    documents: Array<{
        id: string
        name: string
        pages: number
    }>
    recipients: Array<{
        id: string
        name: string
        email: string
        status: string
        signedDate?: string
    }>
    projectId?: string
    clientId?: string
    webhookEvents?: Array<{
        eventType: string
        timestamp: string
        status: string
    }>
}

interface DocuSignTemplate {
    id: string
    name: string
    description: string
    type: 'contract' | 'quote' | 'agreement' | 'receipt' | 'other'
    created: string
    usageCount: number
    isActive: boolean
    fields?: Array<{
        name: string
        type: string
        required: boolean
        position: { x: number; y: number; page: number }
    }>
}

type TemplateType = 'contract' | 'quote' | 'agreement' | 'receipt' | 'other'

interface WebhookEvent {
    id: string
    envelopeId: string
    eventType: string
    timestamp: string
    status: 'success' | 'failed' | 'pending'
    data: any
}

export function DocuSignDashboard() {
    const [activeSection, setActiveSection] = useState('envelopes')
    const [envelopes, setEnvelopes] = useState<DocuSignEnvelope[]>([])
    const [templates, setTemplates] = useState<DocuSignTemplate[]>([])
    const [webhookEvents, setWebhookEvents] = useState<WebhookEvent[]>([])
    const [loading, setLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')

    // Create envelope form state
    const [createForm, setCreateForm] = useState({
        templateId: '',
        subject: '',
        message: '',
        recipients: [{ name: '', email: '', role: 'Customer' }],
        clientId: '',
        projectId: ''
    })

    // Template form state
    const [templateForm, setTemplateForm] = useState({
        id: '',
        name: '',
        description: '',
        type: 'contract' as TemplateType,
        content: '',
        fields: [] as Array<{
            name: string
            type: string
            required: boolean
            position: { x: number; y: number; page: number }
        }>
    })

    const [editingTemplate, setEditingTemplate] = useState<string | null>(null)

    useEffect(() => {
        fetchEnvelopes()
        fetchTemplates()
        fetchWebhookEvents()
    }, [])

    const fetchEnvelopes = async () => {
        try {
            const response = await fetch('/api/docusign/envelopes')
            if (response.ok) {
                const data = await response.json()
                setEnvelopes(data.envelopes || [])
            }
        } catch (error) {
            console.error('Error fetching envelopes:', error)
        }
    }

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/docusign/templates')
            if (response.ok) {
                const data = await response.json()
                setTemplates(data.templates || [])
            }
        } catch (error) {
            console.error('Error fetching templates:', error)
        }
    }

    const fetchWebhookEvents = async () => {
        try {
            const response = await fetch('/api/docusign/webhooks')
            if (response.ok) {
                const data = await response.json()
                setWebhookEvents(data.events || [])
            }
        } catch (error) {
            console.error('Error fetching webhook events:', error)
        }
    }

    const handleCreateEnvelope = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!createForm.templateId || !createForm.subject || createForm.recipients.length === 0) {
            alert('Please fill in all required fields')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/docusign/envelopes', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    templateId: createForm.templateId,
                    subject: createForm.subject,
                    message: createForm.message,
                    recipients: createForm.recipients,
                    clientId: createForm.clientId || undefined,
                    projectId: createForm.projectId || undefined
                })
            })

            if (response.ok) {
                alert('Document sent for signing successfully!')
                setCreateForm({
                    templateId: '',
                    subject: '',
                    message: '',
                    recipients: [{ name: '', email: '', role: 'Customer' }],
                    clientId: '',
                    projectId: ''
                })
                fetchEnvelopes()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to create envelope')
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to create envelope'}`)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveTemplate = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!templateForm.name || !templateForm.description) {
            alert('Please fill in template name and description')
            return
        }

        setLoading(true)
        try {
            const method = editingTemplate ? 'PUT' : 'POST'
            const url = editingTemplate ? `/api/docusign/templates/${editingTemplate}` : '/api/docusign/templates'

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(templateForm)
            })

            if (response.ok) {
                alert(`Template ${editingTemplate ? 'updated' : 'created'} successfully!`)
                setTemplateForm({
                    id: '',
                    name: '',
                    description: '',
                    type: 'contract',
                    content: '',
                    fields: []
                })
                setEditingTemplate(null)
                fetchTemplates()
            } else {
                const error = await response.json()
                throw new Error(error.error || `Failed to ${editingTemplate ? 'update' : 'create'} template`)
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : `Failed to ${editingTemplate ? 'update' : 'create'} template`}`)
        } finally {
            setLoading(false)
        }
    }

    const handleEditTemplate = (template: DocuSignTemplate) => {
        setTemplateForm({
            id: template.id,
            name: template.name,
            description: template.description,
            type: template.type,
            content: '',
            fields: template.fields || []
        })
        setEditingTemplate(template.id)
        setActiveSection('template-editor')
    }

    const handleDeleteTemplate = async (templateId: string) => {
        if (!confirm('Are you sure you want to delete this template?')) {
            return
        }

        try {
            const response = await fetch(`/api/docusign/templates/${templateId}`, {
                method: 'DELETE'
            })

            if (response.ok) {
                alert('Template deleted successfully!')
                fetchTemplates()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to delete template')
            }
        } catch (error) {
            alert(`Error: ${error instanceof Error ? error.message : 'Failed to delete template'}`)
        }
    }

    const handleDuplicateTemplate = async (template: DocuSignTemplate) => {
        setTemplateForm({
            id: '',
            name: `${template.name} (Copy)`,
            description: template.description,
            type: template.type,
            content: '',
            fields: template.fields || []
        })
        setEditingTemplate(null)
        setActiveSection('template-editor')
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'sent':
            case 'delivered':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'declined':
            case 'voided':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <FileText className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colorClass = {
            completed: 'bg-green-100 text-green-800',
            sent: 'bg-blue-100 text-blue-800',
            delivered: 'bg-yellow-100 text-yellow-800',
            declined: 'bg-red-100 text-red-800',
            voided: 'bg-gray-100 text-gray-800',
            created: 'bg-gray-100 text-gray-800'
        }[status] || 'bg-gray-100 text-gray-800'

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </span>
        )
    }

    const addRecipient = () => {
        setCreateForm({
            ...createForm,
            recipients: [...createForm.recipients, { name: '', email: '', role: 'Customer' }]
        })
    }

    const updateRecipient = (index: number, field: string, value: string) => {
        const newRecipients = [...createForm.recipients]
        newRecipients[index] = { ...newRecipients[index], [field]: value }
        setCreateForm({ ...createForm, recipients: newRecipients })
    }

    const removeRecipient = (index: number) => {
        if (createForm.recipients.length > 1) {
            const newRecipients = createForm.recipients.filter((_, i) => i !== index)
            setCreateForm({ ...createForm, recipients: newRecipients })
        }
    }

    // Filter envelopes based on search and status
    const filteredEnvelopes = envelopes.filter(envelope => {
        const matchesSearch = envelope.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
            envelope.recipients.some(r => r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                r.email.toLowerCase().includes(searchQuery.toLowerCase()))
        const matchesStatus = statusFilter === 'all' || envelope.status === statusFilter
        return matchesSearch && matchesStatus
    })

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Document Signing</h1>
                    <p className="text-muted-foreground">
                        Manage digital document signing with DocuSign integration
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Envelopes</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{envelopes.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed</CardTitle>
                        <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {envelopes.filter(e => e.status === 'completed').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Pending</CardTitle>
                        <Clock className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {envelopes.filter(e => ['sent', 'delivered'].includes(e.status)).length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Templates</CardTitle>
                        <Upload className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{templates.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Webhooks</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{webhookEvents.length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'envelopes', name: 'Documents', icon: FileText },
                        { id: 'create', name: 'Send Document', icon: Send },
                        { id: 'templates', name: 'Templates', icon: Upload },
                        { id: 'template-editor', name: 'Template Editor', icon: Edit },
                        { id: 'webhooks', name: 'Webhooks', icon: Webhook },
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

            {/* Envelopes Section */}
            {activeSection === 'envelopes' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Document Envelopes</CardTitle>
                                <CardDescription>
                                    View and manage all document signing envelopes
                                </CardDescription>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative">
                                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        placeholder="Search envelopes..."
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
                                    <option value="created">Created</option>
                                    <option value="sent">Sent</option>
                                    <option value="delivered">Delivered</option>
                                    <option value="completed">Completed</option>
                                    <option value="declined">Declined</option>
                                    <option value="voided">Voided</option>
                                </select>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredEnvelopes.length === 0 ? (
                                <div className="text-center py-8">
                                    <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">
                                        {searchQuery || statusFilter !== 'all' ? 'No documents match your filters' : 'No documents found'}
                                    </p>
                                    <Button
                                        onClick={() => setActiveSection('create')}
                                        className="mt-4"
                                    >
                                        <Send className="mr-2 h-4 w-4" />
                                        Send Your First Document
                                    </Button>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {filteredEnvelopes.map((envelope) => (
                                        <div key={envelope.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center space-x-3">
                                                    <FileText className="h-5 w-5 text-muted-foreground" />
                                                    <div>
                                                        <h3 className="font-medium">{envelope.subject}</h3>
                                                        <p className="text-sm text-muted-foreground">
                                                            Created: {new Date(envelope.createdDate).toLocaleDateString()}
                                                            {envelope.sentDate && ` • Sent: ${new Date(envelope.sentDate).toLocaleDateString()}`}
                                                            {envelope.completedDate && ` • Completed: ${new Date(envelope.completedDate).toLocaleDateString()}`}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    {getStatusBadge(envelope.status)}
                                                    <Button variant="outline" size="sm">
                                                        <Eye className="h-4 w-4" />
                                                    </Button>
                                                    {envelope.status === 'completed' && (
                                                        <Button variant="outline" size="sm">
                                                            <Download className="h-4 w-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="grid gap-4 md:grid-cols-3">
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Documents</h4>
                                                    <div className="space-y-1">
                                                        {envelope.documents.map((doc) => (
                                                            <div key={doc.id} className="text-sm text-muted-foreground">
                                                                {doc.name} ({doc.pages} pages)
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Recipients</h4>
                                                    <div className="space-y-1">
                                                        {envelope.recipients.map((recipient) => (
                                                            <div key={recipient.id} className="flex items-center justify-between text-sm">
                                                                <span>{recipient.name} ({recipient.email})</span>
                                                                <span className={`px-2 py-1 rounded text-xs ${recipient.status === 'completed'
                                                                        ? 'bg-green-100 text-green-800'
                                                                        : 'bg-yellow-100 text-yellow-800'
                                                                    }`}>
                                                                    {recipient.status}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-medium mb-2">Recent Events</h4>
                                                    <div className="space-y-1">
                                                        {envelope.webhookEvents?.slice(0, 3).map((event, index) => (
                                                            <div key={index} className="text-sm text-muted-foreground">
                                                                {event.eventType} - {new Date(event.timestamp).toLocaleDateString()}
                                                            </div>
                                                        )) || <div className="text-sm text-muted-foreground">No events</div>}
                                                    </div>
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

            {/* Create Envelope Section */}
            {activeSection === 'create' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Send Document for Signing</CardTitle>
                        <CardDescription>
                            Create a new envelope and send documents for digital signature
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleCreateEnvelope} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="template">Document Template *</Label>
                                    <select
                                        id="template"
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                        value={createForm.templateId}
                                        onChange={(e) => setCreateForm({ ...createForm, templateId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select template...</option>
                                        {templates.filter(t => t.isActive).map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name} ({template.type})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="subject">Email Subject *</Label>
                                    <Input
                                        id="subject"
                                        placeholder="Please sign: Bathroom Renovation Contract"
                                        value={createForm.subject}
                                        onChange={(e) => setCreateForm({ ...createForm, subject: e.target.value })}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="message">Email Message</Label>
                                <Textarea
                                    id="message"
                                    placeholder="Please review and sign the attached document. If you have any questions, please contact us."
                                    value={createForm.message}
                                    onChange={(e) => setCreateForm({ ...createForm, message: e.target.value })}
                                    rows={3}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Recipients *</Label>
                                    <Button type="button" variant="outline" size="sm" onClick={addRecipient}>
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Recipient
                                    </Button>
                                </div>

                                {createForm.recipients.map((recipient, index) => (
                                    <div key={index} className="grid gap-4 md:grid-cols-4 items-end">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                placeholder="John Smith"
                                                value={recipient.name}
                                                onChange={(e) => updateRecipient(index, 'name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                placeholder="john@example.com"
                                                value={recipient.email}
                                                onChange={(e) => updateRecipient(index, 'email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Role</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                                value={recipient.role}
                                                onChange={(e) => updateRecipient(index, 'role', e.target.value)}
                                            >
                                                <option value="Customer">Customer</option>
                                                <option value="Sales Rep">Sales Rep</option>
                                                <option value="Project Manager">Project Manager</option>
                                                <option value="Witness">Witness</option>
                                            </select>
                                        </div>
                                        <div>
                                            {createForm.recipients.length > 1 && (
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => removeRecipient(index)}
                                                >
                                                    <XCircle className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="clientId">Client ID (Optional)</Label>
                                    <Input
                                        id="clientId"
                                        placeholder="Link to client record"
                                        value={createForm.clientId}
                                        onChange={(e) => setCreateForm({ ...createForm, clientId: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="projectId">Project ID (Optional)</Label>
                                    <Input
                                        id="projectId"
                                        placeholder="Link to project record"
                                        value={createForm.projectId}
                                        onChange={(e) => setCreateForm({ ...createForm, projectId: e.target.value })}
                                    />
                                </div>
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                {loading ? 'Sending...' : 'Send for Signature'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Templates Section */}
            {activeSection === 'templates' && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle>Document Templates</CardTitle>
                                <CardDescription>
                                    Manage reusable document templates for common signing workflows
                                </CardDescription>
                            </div>
                            <Button onClick={() => setActiveSection('template-editor')}>
                                <Plus className="mr-2 h-4 w-4" />
                                Create Template
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {templates.length === 0 ? (
                                <div className="text-center py-8">
                                    <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">No templates found</p>
                                    <Button
                                        className="mt-4"
                                        onClick={() => setActiveSection('template-editor')}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Create Template
                                    </Button>
                                </div>
                            ) : (
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                                    {templates.map((template) => (
                                        <div key={template.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <h3 className="font-medium">{template.name}</h3>
                                                <div className="flex items-center space-x-1">
                                                    <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded-full">
                                                        {template.type}
                                                    </span>
                                                    {!template.isActive && (
                                                        <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">
                                                            Inactive
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                            <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                                            <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                                                <span>Used {template.usageCount} times</span>
                                                <span>{new Date(template.created).toLocaleDateString()}</span>
                                            </div>
                                            <div className="flex space-x-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="flex-1"
                                                    onClick={() => handleEditTemplate(template)}
                                                >
                                                    <Edit className="h-3 w-3 mr-1" />
                                                    Edit
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDuplicateTemplate(template)}
                                                >
                                                    <Copy className="h-3 w-3" />
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleDeleteTemplate(template.id)}
                                                >
                                                    <Trash2 className="h-3 w-3" />
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

            {/* Template Editor Section */}
            {activeSection === 'template-editor' && (
                <Card>
                    <CardHeader>
                        <CardTitle>
                            {editingTemplate ? 'Edit Template' : 'Create New Template'}
                        </CardTitle>
                        <CardDescription>
                            {editingTemplate ? 'Modify existing document template' : 'Create a new reusable document template'}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSaveTemplate} className="space-y-6">
                            <div className="grid gap-4 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label htmlFor="templateName">Template Name *</Label>
                                    <Input
                                        id="templateName"
                                        placeholder="Bathroom Renovation Contract"
                                        value={templateForm.name}
                                        onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="templateType">Document Type *</Label>
                                    <select
                                        id="templateType"
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                        value={templateForm.type}
                                        onChange={(e) => setTemplateForm({ ...templateForm, type: e.target.value as any })}
                                        required
                                    >
                                        <option value="contract">Contract</option>
                                        <option value="quote">Quote</option>
                                        <option value="agreement">Agreement</option>
                                        <option value="receipt">Receipt</option>
                                        <option value="other">Other</option>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="templateDescription">Description *</Label>
                                <Textarea
                                    id="templateDescription"
                                    placeholder="Standard contract template for bathroom renovation projects including terms, conditions, and pricing."
                                    value={templateForm.description}
                                    onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                                    rows={3}
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="templateContent">Template Content</Label>
                                <Textarea
                                    id="templateContent"
                                    placeholder="Template content or upload a document file..."
                                    value={templateForm.content}
                                    onChange={(e) => setTemplateForm({ ...templateForm, content: e.target.value })}
                                    rows={8}
                                />
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Signature Fields</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={() => {
                                            setTemplateForm({
                                                ...templateForm,
                                                fields: [...templateForm.fields, {
                                                    name: 'Customer Signature',
                                                    type: 'signature',
                                                    required: true,
                                                    position: { x: 100, y: 100, page: 1 }
                                                }]
                                            })
                                        }}
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Add Field
                                    </Button>
                                </div>

                                {templateForm.fields.map((field, index) => (
                                    <div key={index} className="grid gap-4 md:grid-cols-4 items-end border p-3 rounded">
                                        <div className="space-y-2">
                                            <Label>Field Name</Label>
                                            <Input
                                                placeholder="Customer Signature"
                                                value={field.name}
                                                onChange={(e) => {
                                                    const newFields = [...templateForm.fields]
                                                    newFields[index] = { ...field, name: e.target.value }
                                                    setTemplateForm({ ...templateForm, fields: newFields })
                                                }}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Field Type</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                                value={field.type}
                                                onChange={(e) => {
                                                    const newFields = [...templateForm.fields]
                                                    newFields[index] = { ...field, type: e.target.value }
                                                    setTemplateForm({ ...templateForm, fields: newFields })
                                                }}
                                            >
                                                <option value="signature">Signature</option>
                                                <option value="text">Text</option>
                                                <option value="date">Date</option>
                                                <option value="checkbox">Checkbox</option>
                                                <option value="initial">Initial</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Required</Label>
                                            <select
                                                className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                                value={field.required ? 'true' : 'false'}
                                                onChange={(e) => {
                                                    const newFields = [...templateForm.fields]
                                                    newFields[index] = { ...field, required: e.target.value === 'true' }
                                                    setTemplateForm({ ...templateForm, fields: newFields })
                                                }}
                                            >
                                                <option value="true">Required</option>
                                                <option value="false">Optional</option>
                                            </select>
                                        </div>
                                        <div>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => {
                                                    const newFields = templateForm.fields.filter((_, i) => i !== index)
                                                    setTemplateForm({ ...templateForm, fields: newFields })
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="flex space-x-4">
                                <Button type="submit" disabled={loading} className="flex-1">
                                    <Save className="mr-2 h-4 w-4" />
                                    {loading ? 'Saving...' : editingTemplate ? 'Update Template' : 'Create Template'}
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setTemplateForm({
                                            id: '',
                                            name: '',
                                            description: '',
                                            type: 'contract',
                                            content: '',
                                            fields: []
                                        })
                                        setEditingTemplate(null)
                                        setActiveSection('templates')
                                    }}
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Webhooks Section */}
            {activeSection === 'webhooks' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Webhook Events</CardTitle>
                        <CardDescription>
                            Monitor real-time DocuSign webhook events and status updates
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {webhookEvents.length === 0 ? (
                                <div className="text-center py-8">
                                    <Webhook className="mx-auto h-12 w-12 text-muted-foreground" />
                                    <p className="text-muted-foreground mt-2">No webhook events recorded</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Events will appear here when documents are sent, viewed, or signed
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {webhookEvents.map((event) => (
                                        <div key={event.id} className="border rounded-lg p-4">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center space-x-3">
                                                    <Activity className="h-4 w-4 text-muted-foreground" />
                                                    <div>
                                                        <h4 className="font-medium">{event.eventType}</h4>
                                                        <p className="text-sm text-muted-foreground">
                                                            {new Date(event.timestamp).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className={`px-2 py-1 rounded text-xs font-medium ${event.status === 'success'
                                                        ? 'bg-green-100 text-green-800'
                                                        : event.status === 'failed'
                                                            ? 'bg-red-100 text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {event.status}
                                                </span>
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                <p>Envelope ID: {event.envelopeId}</p>
                                                {event.data && (
                                                    <details className="mt-2">
                                                        <summary className="cursor-pointer font-medium">Event Data</summary>
                                                        <pre className="mt-2 p-2 bg-gray-50 rounded text-xs overflow-auto">
                                                            {JSON.stringify(event.data, null, 2)}
                                                        </pre>
                                                    </details>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
