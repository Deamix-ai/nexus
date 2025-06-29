'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Mail,
    MessageSquare,
    Phone,
    Plus,
    Send,
    Search,
    Filter,
    Clock,
    CheckCircle,
    XCircle,
    Eye,
    MessageCircle,
    Users,
    Calendar
} from 'lucide-react'

interface Message {
    id: string
    type: string
    direction: string
    status: string
    toEmail?: string
    toPhone?: string
    subject?: string
    body: string
    sentAt?: string
    readAt?: string
    fromUser: {
        firstName: string
        lastName: string
    }
    project?: {
        name: string
        projectNumber: string
    }
    client?: {
        firstName: string
        lastName: string
    }
    createdAt: string
}

interface MessageTemplate {
    id: string
    name: string
    type: string
    category?: string
    subject?: string
    body: string
    variables: string[]
}

const messageTypes = [
    { value: 'EMAIL', label: 'Email', icon: Mail },
    { value: 'SMS', label: 'SMS', icon: MessageSquare },
    { value: 'WHATSAPP', label: 'WhatsApp', icon: MessageCircle },
    { value: 'PHONE_CALL', label: 'Phone Call', icon: Phone },
    { value: 'INTERNAL_NOTE', label: 'Internal Note', icon: Users },
]

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'PENDING': return Clock
        case 'SENT': return Send
        case 'DELIVERED': return CheckCircle
        case 'READ': return Eye
        case 'FAILED': return XCircle
        default: return Clock
    }
}

const getStatusColor = (status: string) => {
    switch (status) {
        case 'PENDING': return 'text-yellow-600'
        case 'SENT': return 'text-blue-600'
        case 'DELIVERED': return 'text-green-600'
        case 'READ': return 'text-green-700'
        case 'FAILED': return 'text-red-600'
        default: return 'text-gray-600'
    }
}

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-GB', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
    })
}

export default function CommunicationsPage() {
    const [messages, setMessages] = useState<Message[]>([])
    const [templates, setTemplates] = useState<MessageTemplate[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [activeTab, setActiveTab] = useState<'messages' | 'compose' | 'templates' | 'settings'>('messages')
    const [filterType, setFilterType] = useState('')
    const [searchTerm, setSearchTerm] = useState('')

    // Provider status
    const [providerStatus, setProviderStatus] = useState<any>(null)

    // Available variables for templates
    const [availableVariables, setAvailableVariables] = useState<any>(null)

    // Compose form state
    const [composeData, setComposeData] = useState({
        type: 'EMAIL' as 'EMAIL' | 'SMS' | 'WHATSAPP' | 'PHONE_CALL' | 'INTERNAL_NOTE',
        toEmail: '',
        toPhone: '',
        subject: '',
        body: '',
        projectId: '',
        clientId: '',
        templateId: ''
    })

    // Template processing state
    const [processingTemplate, setProcessingTemplate] = useState(false)

    useEffect(() => {
        fetchMessages()
        fetchTemplates()
        fetchProviderStatus()
        fetchAvailableVariables()
    }, [])

    const fetchMessages = async () => {
        try {
            const params = new URLSearchParams()
            if (filterType) params.set('type', filterType)

            const response = await fetch(`/api/messages?${params}`)
            if (!response.ok) throw new Error('Failed to fetch messages')

            const data = await response.json()
            setMessages(data.messages || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/message-templates')
            if (!response.ok) throw new Error('Failed to fetch templates')

            const data = await response.json()
            setTemplates(data.templates || [])
        } catch (err) {
            console.error('Error fetching templates:', err)
        }
    }

    const fetchProviderStatus = async () => {
        try {
            const response = await fetch('/api/communications/test')
            if (response.ok) {
                const data = await response.json()
                setProviderStatus(data)
            }
        } catch (err) {
            console.error('Error fetching provider status:', err)
        }
    }

    const fetchAvailableVariables = async () => {
        try {
            const params = new URLSearchParams()
            if (composeData.clientId) params.set('clientId', composeData.clientId)
            if (composeData.projectId) params.set('projectId', composeData.projectId)

            const response = await fetch(`/api/message-templates/variables?${params}`)
            if (response.ok) {
                const data = await response.json()
                setAvailableVariables(data)
            }
        } catch (err) {
            console.error('Error fetching variables:', err)
        }
    }

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/messages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(composeData)
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Failed to send message')
            }

            // Reset form and refresh messages
            setComposeData({
                type: 'EMAIL',
                toEmail: '',
                toPhone: '',
                subject: '',
                body: '',
                projectId: '',
                clientId: '',
                templateId: ''
            })

            setActiveTab('messages')
            fetchMessages()
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to send message')
        }
    }

    const handleTemplateSelect = async (templateId: string) => {
        if (!templateId) {
            setComposeData(prev => ({
                ...prev,
                subject: '',
                body: '',
                templateId: ''
            }))
            return
        }

        setProcessingTemplate(true)
        try {
            const response = await fetch('/api/message-templates/process', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    templateId,
                    clientId: composeData.clientId || undefined,
                    projectId: composeData.projectId || undefined,
                })
            })

            if (response.ok) {
                const processed = await response.json()
                const template = templates.find(t => t.id === templateId)

                setComposeData(prev => ({
                    ...prev,
                    type: template?.type as any || prev.type,
                    subject: processed.subject || '',
                    body: processed.body || '',
                    templateId: templateId
                }))
            } else {
                // Fallback to raw template
                const template = templates.find(t => t.id === templateId)
                if (template) {
                    setComposeData(prev => ({
                        ...prev,
                        type: template.type as any,
                        subject: template.subject || '',
                        body: template.body,
                        templateId: template.id
                    }))
                }
            }
        } catch (err) {
            console.error('Error processing template:', err)
        } finally {
            setProcessingTemplate(false)
        }
    }

    const handleTestMessage = async (type: 'email' | 'sms') => {
        const recipient = type === 'email'
            ? prompt('Enter email address for test:')
            : prompt('Enter phone number for test (include country code, e.g., +44):')

        if (!recipient) return

        try {
            const response = await fetch('/api/communications/test', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type, to: recipient })
            })

            const result = await response.json()
            alert(result.success ? 'Test message sent successfully!' : `Failed to send test message: ${result.details?.error || 'Unknown error'}`)
        } catch (err) {
            alert('Error sending test message')
        }
    }

    // Update variables when compose data changes
    useEffect(() => {
        if (composeData.clientId || composeData.projectId) {
            fetchAvailableVariables()
        }
    }, [composeData.clientId, composeData.projectId])

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading communications...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Communications</h1>
                    <p className="text-gray-600">Manage emails, SMS, and messages with clients and team</p>
                </div>
                <Button
                    onClick={() => setActiveTab('compose')}
                    className="bg-blue-600 hover:bg-blue-700"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    New Message
                </Button>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { key: 'messages', label: 'Messages', icon: MessageSquare },
                        { key: 'compose', label: 'Compose', icon: Plus },
                        { key: 'templates', label: 'Templates', icon: Mail },
                        { key: 'settings', label: 'Settings', icon: Users },
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

            {/* Messages Tab */}
            {activeTab === 'messages' && (
                <div className="space-y-4">
                    {/* Filters */}
                    <Card>
                        <CardContent className="pt-6">
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                        <Input
                                            placeholder="Search messages..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-10"
                                        />
                                    </div>
                                </div>
                                <select
                                    value={filterType}
                                    onChange={(e) => setFilterType(e.target.value)}
                                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">All Types</option>
                                    {messageTypes.map(type => (
                                        <option key={type.value} value={type.value}>{type.label}</option>
                                    ))}
                                </select>
                                <Button onClick={fetchMessages} variant="outline">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Apply
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Messages List */}
                    {error && (
                        <div className="bg-red-50 border border-red-200 rounded-md p-4">
                            <p className="text-red-600">{error}</p>
                        </div>
                    )}

                    <div className="space-y-4">
                        {messages.length === 0 ? (
                            <Card>
                                <CardContent className="text-center py-12">
                                    <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                    <p className="text-gray-600">No messages found</p>
                                    <p className="text-sm text-gray-500 mt-1">Start communicating with your clients</p>
                                </CardContent>
                            </Card>
                        ) : (
                            messages.map((message) => {
                                const StatusIcon = getStatusIcon(message.status)
                                const TypeIcon = messageTypes.find(t => t.value === message.type)?.icon || MessageSquare

                                return (
                                    <Card key={message.id} className="hover:shadow-md transition-shadow">
                                        <CardContent className="p-4">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-3 flex-1">
                                                    <TypeIcon className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h3 className="font-medium text-gray-900 truncate">
                                                                {message.subject || `${message.type} Message`}
                                                            </h3>
                                                            <StatusIcon className={`h-4 w-4 ${getStatusColor(message.status)}`} />
                                                            <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(message.status)} bg-gray-100`}>
                                                                {message.status}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.body}</p>
                                                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                                                            <span>To: {message.toEmail || message.toPhone}</span>
                                                            <span>From: {message.fromUser.firstName} {message.fromUser.lastName}</span>
                                                            <span className="flex items-center">
                                                                <Calendar className="h-3 w-3 mr-1" />
                                                                {formatDate(message.createdAt)}
                                                            </span>
                                                            {message.project && (
                                                                <span>Project: {message.project.projectNumber}</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })
                        )}
                    </div>
                </div>
            )}

            {/* Compose Tab */}
            {activeTab === 'compose' && (
                <Card>
                    <CardHeader>
                        <CardTitle>Compose Message</CardTitle>
                        <CardDescription>Send emails, SMS, or create internal notes</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handleSendMessage} className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <Label htmlFor="type">Message Type</Label>
                                    <select
                                        id="type"
                                        value={composeData.type}
                                        onChange={(e) => setComposeData({ ...composeData, type: e.target.value as any })}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        {messageTypes.map(type => (
                                            <option key={type.value} value={type.value}>{type.label}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <Label htmlFor="template">Use Template (Optional)</Label>
                                    <select
                                        id="template"
                                        value={composeData.templateId}
                                        onChange={(e) => handleTemplateSelect(e.target.value)}
                                        className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="">Select a template...</option>
                                        {templates
                                            .filter(t => t.type === composeData.type)
                                            .map(template => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name} {template.category && `(${template.category})`}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                            </div>

                            {composeData.type === 'EMAIL' && (
                                <div>
                                    <Label htmlFor="toEmail">To Email</Label>
                                    <Input
                                        id="toEmail"
                                        type="email"
                                        value={composeData.toEmail}
                                        onChange={(e) => setComposeData({ ...composeData, toEmail: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {(composeData.type === 'SMS' || composeData.type === 'WHATSAPP') && (
                                <div>
                                    <Label htmlFor="toPhone">To Phone</Label>
                                    <Input
                                        id="toPhone"
                                        type="tel"
                                        value={composeData.toPhone}
                                        onChange={(e) => setComposeData({ ...composeData, toPhone: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            {composeData.type === 'EMAIL' && (
                                <div>
                                    <Label htmlFor="subject">Subject</Label>
                                    <Input
                                        id="subject"
                                        value={composeData.subject}
                                        onChange={(e) => setComposeData({ ...composeData, subject: e.target.value })}
                                        required
                                        className="mt-1"
                                    />
                                </div>
                            )}

                            <div>
                                <Label htmlFor="body">Message</Label>
                                <textarea
                                    id="body"
                                    value={composeData.body}
                                    onChange={(e) => setComposeData({ ...composeData, body: e.target.value })}
                                    required
                                    rows={6}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
                                <Send className="h-4 w-4 mr-2" />
                                Send Message
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Templates Tab */}
            {activeTab === 'templates' && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-gray-600">Manage message templates for consistent communication</p>
                        <Button className="bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4 mr-2" />
                            New Template
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {templates.map((template) => {
                            const TypeIcon = messageTypes.find(t => t.value === template.type)?.icon || Mail

                            return (
                                <Card key={template.id} className="hover:shadow-md transition-shadow">
                                    <CardHeader className="pb-3">
                                        <div className="flex items-center space-x-2">
                                            <TypeIcon className="h-5 w-5 text-blue-600" />
                                            <CardTitle className="text-sm font-medium">{template.name}</CardTitle>
                                        </div>
                                        <CardDescription className="text-xs">
                                            {template.type} • {template.category || 'General'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="pt-0">
                                        <p className="text-sm text-gray-600 line-clamp-3 mb-3">{template.body}</p>
                                        <div className="flex gap-2">
                                            <Button size="sm" variant="outline" className="flex-1">
                                                Edit
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => handleTemplateSelect(template.id)}
                                                className="flex-1"
                                            >
                                                Use
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            )
                        })}
                    </div>

                    {templates.length === 0 && (
                        <Card>
                            <CardContent className="text-center py-12">
                                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-600">No templates found</p>
                                <p className="text-sm text-gray-500 mt-1">Create templates for consistent messaging</p>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Settings Tab */}
            {activeTab === 'settings' && (
                <div className="space-y-6">
                    {/* Provider Status */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Communication Providers</CardTitle>
                            <CardDescription>
                                Status of external communication services
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {/* Email Providers */}
                            <div>
                                <h4 className="font-medium mb-3">Email Services</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="h-5 w-5 text-blue-600" />
                                            <div>
                                                <p className="font-medium">SendGrid</p>
                                                <p className="text-sm text-gray-500">Primary email service</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${providerStatus?.providers?.email?.sendgrid
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {providerStatus?.providers?.email?.sendgrid ? 'Connected' : 'Not configured'}
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <Mail className="h-5 w-5 text-gray-600" />
                                            <div>
                                                <p className="font-medium">SMTP</p>
                                                <p className="text-sm text-gray-500">Backup email service</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${providerStatus?.providers?.email?.smtp
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-yellow-100 text-yellow-800'
                                            }`}>
                                            {providerStatus?.providers?.email?.smtp ? 'Connected' : 'Available'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleTestMessage('email')}
                                        disabled={!providerStatus?.providers?.email?.available}
                                    >
                                        Test Email
                                    </Button>
                                </div>
                            </div>

                            {/* SMS Providers */}
                            <div>
                                <h4 className="font-medium mb-3">SMS Services</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center space-x-3">
                                            <MessageSquare className="h-5 w-5 text-green-600" />
                                            <div>
                                                <p className="font-medium">Twilio</p>
                                                <p className="text-sm text-gray-500">SMS and WhatsApp service</p>
                                            </div>
                                        </div>
                                        <div className={`px-2 py-1 rounded-full text-xs font-medium ${providerStatus?.providers?.sms?.twilio
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-red-100 text-red-800'
                                            }`}>
                                            {providerStatus?.providers?.sms?.twilio ? 'Connected' : 'Not configured'}
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-3 flex gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleTestMessage('sms')}
                                        disabled={!providerStatus?.providers?.sms?.available}
                                    >
                                        Test SMS
                                    </Button>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Template Variables */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Available Template Variables</CardTitle>
                            <CardDescription>
                                Variables you can use in message templates
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {availableVariables ? (
                                <div className="space-y-4">
                                    {Object.entries(availableVariables.grouped || {}).map(([category, variables]: [string, any]) => (
                                        variables?.length > 0 && (
                                            <div key={category}>
                                                <h4 className="font-medium mb-2 capitalize">{category} Variables</h4>
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                    {variables.map((variable: any, index: number) => (
                                                        <div key={index} className="flex items-center space-x-2 p-2 bg-gray-50 rounded text-sm">
                                                            <code className="font-mono text-blue-600">
                                                                {`{{${variable.name}}}`}
                                                            </code>
                                                            {variable.description && (
                                                                <span className="text-gray-500 truncate">
                                                                    - {variable.description}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-8">
                                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                                    <p className="mt-2 text-gray-600">Loading variables...</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Configuration Help */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Configuration</CardTitle>
                            <CardDescription>
                                Setup instructions for communication providers
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="p-4 bg-blue-50 rounded-lg">
                                <h4 className="font-medium text-blue-900 mb-2">Environment Variables Required</h4>
                                <div className="space-y-2 text-sm text-blue-800">
                                    <div>
                                        <strong>SendGrid Email:</strong>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">SENDGRID_API_KEY</code>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">SENDGRID_FROM_EMAIL</code>
                                    </div>
                                    <div>
                                        <strong>Twilio SMS:</strong>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">TWILIO_ACCOUNT_SID</code>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">TWILIO_AUTH_TOKEN</code>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">TWILIO_PHONE_NUMBER</code>
                                    </div>
                                    <div>
                                        <strong>SMTP Backup:</strong>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">SMTP_HOST</code>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">SMTP_USER</code>
                                        <code className="ml-2 px-2 py-1 bg-blue-100 rounded">SMTP_PASS</code>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    )
}
