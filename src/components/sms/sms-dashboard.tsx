'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Send,
    MessageSquare,
    Users,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Phone,
    FileText,
    BarChart3
} from 'lucide-react'

interface SMSMessage {
    id: string
    to: string
    message: string
    status: 'queued' | 'sent' | 'delivered' | 'failed' | 'undelivered'
    twilioSid: string
    cost?: number
    errorMessage?: string
    sentAt: string
    deliveredAt?: string
    client?: {
        id: string
        firstName: string
        lastName: string
    }
    project?: {
        id: string
        title: string
    }
    sentBy: {
        id: string
        firstName: string
        lastName: string
        role: string
    }
}

interface SMSTemplate {
    id: string
    name: string
    content: string
    variables: string[]
    category: string
}

interface SMSStats {
    totalSent: number
    totalDelivered: number
    totalFailed: number
    totalCost: number
    deliveryRate: number
    averageResponseTime: number
}

export function SMSDashboard() {
    const [activeTab, setActiveTab] = useState('send')
    const [messages, setMessages] = useState<SMSMessage[]>([])
    const [templates, setTemplates] = useState<SMSTemplate[]>([])
    const [stats, setStats] = useState<SMSStats | null>(null)
    const [loading, setLoading] = useState(false)
    const { toast } = useToast()

    // Send SMS Form State
    const [smsForm, setSmsForm] = useState({
        to: '',
        message: '',
        clientId: '',
        projectId: '',
        templateId: '',
        variables: {} as Record<string, string>
    })

    // Bulk SMS Form State
    const [bulkForm, setBulkForm] = useState({
        recipients: '',
        templateId: '',
        variables: {} as Record<string, string>
    })

    useEffect(() => {
        fetchMessages()
        fetchTemplates()
        fetchStats()
    }, [])

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/sms?action=history&limit=50')
            if (response.ok) {
                const data = await response.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
        }
    }

    const fetchTemplates = async () => {
        try {
            const response = await fetch('/api/sms/templates')
            if (response.ok) {
                const data = await response.json()
                setTemplates(data.templates || [])
            }
        } catch (error) {
            console.error('Error fetching templates:', error)
        }
    }

    const fetchStats = async () => {
        try {
            const response = await fetch('/api/sms/analytics')
            if (response.ok) {
                const data = await response.json()
                setStats(data.stats)
            }
        } catch (error) {
            console.error('Error fetching stats:', error)
        }
    }

    const handleSendSMS = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!smsForm.to || !smsForm.message) {
            toast({
                title: "Error",
                description: "Phone number and message are required",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    to: smsForm.to,
                    message: smsForm.message,
                    clientId: smsForm.clientId || undefined,
                    projectId: smsForm.projectId || undefined,
                    templateId: smsForm.templateId || undefined,
                    variables: smsForm.variables
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: `SMS sent successfully to ${smsForm.to}`,
                })
                setSmsForm({
                    to: '',
                    message: '',
                    clientId: '',
                    projectId: '',
                    templateId: '',
                    variables: {}
                })
                fetchMessages()
                fetchStats()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send SMS')
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to send SMS',
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const handleBulkSMS = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!bulkForm.recipients) {
            toast({
                title: "Error",
                description: "Recipients are required",
                variant: "destructive"
            })
            return
        }

        setLoading(true)
        try {
            // Parse recipients (assume comma-separated phone numbers)
            const phoneNumbers = bulkForm.recipients
                .split(',')
                .map(phone => phone.trim())
                .filter(phone => phone.length > 0)

            if (phoneNumbers.length === 0) {
                throw new Error('No valid phone numbers provided')
            }

            const recipients = phoneNumbers.map(phone => ({
                to: phone,
                message: '', // Will be filled by template
                variables: bulkForm.variables
            }))

            const response = await fetch('/api/sms?action=bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    recipients,
                    templateId: bulkForm.templateId,
                    globalVariables: bulkForm.variables
                })
            })

            if (response.ok) {
                const data = await response.json()
                toast({
                    title: "Success",
                    description: `Bulk SMS sent to ${phoneNumbers.length} recipients`,
                })
                setBulkForm({
                    recipients: '',
                    templateId: '',
                    variables: {}
                })
                fetchMessages()
                fetchStats()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send bulk SMS')
            }
        } catch (error) {
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : 'Failed to send bulk SMS',
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'delivered':
                return <CheckCircle className="h-4 w-4 text-green-500" />
            case 'sent':
                return <Clock className="h-4 w-4 text-yellow-500" />
            case 'failed':
            case 'undelivered':
                return <XCircle className="h-4 w-4 text-red-500" />
            default:
                return <AlertTriangle className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const variants = {
            delivered: 'default',
            sent: 'secondary',
            failed: 'destructive',
            undelivered: 'destructive',
            queued: 'outline'
        } as const

        return (
            <Badge variant={variants[status as keyof typeof variants] || 'outline'}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </Badge>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">SMS Management</h1>
                    <p className="text-muted-foreground">
                        Send SMS messages and manage communication with clients
                    </p>
                </div>
            </div>

            {/* Stats Cards */}
            {stats && (
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Sent</CardTitle>
                            <Send className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalSent}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Delivery Rate</CardTitle>
                            <CheckCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.deliveryRate.toFixed(1)}%</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                            <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">£{stats.totalCost.toFixed(2)}</div>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                            <CardTitle className="text-sm font-medium">Failed</CardTitle>
                            <XCircle className="h-4 w-4 text-muted-foreground" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">{stats.totalFailed}</div>
                        </CardContent>
                    </Card>
                </div>
            )}

            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList>
                    <TabsTrigger value="send">Send SMS</TabsTrigger>
                    <TabsTrigger value="bulk">Bulk SMS</TabsTrigger>
                    <TabsTrigger value="history">Message History</TabsTrigger>
                    <TabsTrigger value="templates">Templates</TabsTrigger>
                </TabsList>

                <TabsContent value="send" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Send SMS Message</CardTitle>
                            <CardDescription>
                                Send an individual SMS message to a client or contact
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSendSMS} className="space-y-4">
                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="to">Phone Number *</Label>
                                        <Input
                                            id="to"
                                            type="tel"
                                            placeholder="+44 7XXX XXXXXX"
                                            value={smsForm.to}
                                            onChange={(e) => setSmsForm({ ...smsForm, to: e.target.value })}
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="template">Template (Optional)</Label>
                                        <select
                                            id="template"
                                            className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                            value={smsForm.templateId}
                                            onChange={(e) => setSmsForm({ ...smsForm, templateId: e.target.value })}
                                        >
                                            <option value="">Select template...</option>
                                            {templates.map((template) => (
                                                <option key={template.id} value={template.id}>
                                                    {template.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message *</Label>
                                    <Textarea
                                        id="message"
                                        placeholder="Your message here..."
                                        value={smsForm.message}
                                        onChange={(e) => setSmsForm({ ...smsForm, message: e.target.value })}
                                        required
                                        maxLength={1600}
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        {smsForm.message.length}/1600 characters
                                    </p>
                                </div>

                                <div className="grid gap-4 md:grid-cols-2">
                                    <div className="space-y-2">
                                        <Label htmlFor="clientId">Client ID (Optional)</Label>
                                        <Input
                                            id="clientId"
                                            placeholder="Client ID to link this message"
                                            value={smsForm.clientId}
                                            onChange={(e) => setSmsForm({ ...smsForm, clientId: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="projectId">Project ID (Optional)</Label>
                                        <Input
                                            id="projectId"
                                            placeholder="Project ID to link this message"
                                            value={smsForm.projectId}
                                            onChange={(e) => setSmsForm({ ...smsForm, projectId: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    <Send className="mr-2 h-4 w-4" />
                                    {loading ? 'Sending...' : 'Send SMS'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Bulk SMS</CardTitle>
                            <CardDescription>
                                Send SMS messages to multiple recipients at once
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleBulkSMS} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="recipients">Recipients *</Label>
                                    <Textarea
                                        id="recipients"
                                        placeholder="Enter phone numbers separated by commas
+44 7XXX XXXXXX, +44 7XXX XXXXXX, +44 7XXX XXXXXX"
                                        value={bulkForm.recipients}
                                        onChange={(e) => setBulkForm({ ...bulkForm, recipients: e.target.value })}
                                        required
                                        rows={4}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Enter phone numbers separated by commas. Maximum 100 recipients per batch.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="bulkTemplate">Template *</Label>
                                    <select
                                        id="bulkTemplate"
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md"
                                        value={bulkForm.templateId}
                                        onChange={(e) => setBulkForm({ ...bulkForm, templateId: e.target.value })}
                                        required
                                    >
                                        <option value="">Select template...</option>
                                        {templates.map((template) => (
                                            <option key={template.id} value={template.id}>
                                                {template.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <Button type="submit" disabled={loading} className="w-full">
                                    <Users className="mr-2 h-4 w-4" />
                                    {loading ? 'Sending...' : 'Send Bulk SMS'}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="history" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Message History</CardTitle>
                            <CardDescription>
                                View all sent SMS messages and their delivery status
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {messages.length === 0 ? (
                                    <div className="text-center py-8">
                                        <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground mt-2">No messages found</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        {messages.map((message) => (
                                            <div key={message.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <div className="flex items-center space-x-2">
                                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                                        <span className="font-medium">{message.to}</span>
                                                        {getStatusBadge(message.status)}
                                                    </div>
                                                    <div className="text-sm text-muted-foreground">
                                                        {new Date(message.sentAt).toLocaleString()}
                                                        {message.cost && (
                                                            <span className="ml-2">£{message.cost.toFixed(3)}</span>
                                                        )}
                                                    </div>
                                                </div>
                                                <p className="text-sm mb-2">{message.message}</p>
                                                <div className="flex items-center justify-between text-xs text-muted-foreground">
                                                    <div>
                                                        Sent by: {message.sentBy.firstName} {message.sentBy.lastName} ({message.sentBy.role})
                                                        {message.client && (
                                                            <span className="ml-2">
                                                                Client: {message.client.firstName} {message.client.lastName}
                                                            </span>
                                                        )}
                                                        {message.project && (
                                                            <span className="ml-2">
                                                                Project: {message.project.title}
                                                            </span>
                                                        )}
                                                    </div>
                                                    {message.errorMessage && (
                                                        <span className="text-red-500">{message.errorMessage}</span>
                                                    )}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="templates" className="space-y-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>SMS Templates</CardTitle>
                            <CardDescription>
                                Manage reusable SMS templates for common messages
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {templates.length === 0 ? (
                                    <div className="text-center py-8">
                                        <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="text-muted-foreground mt-2">No templates found</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {templates.map((template) => (
                                            <div key={template.id} className="border rounded-lg p-4">
                                                <div className="flex items-center justify-between mb-2">
                                                    <h3 className="font-medium">{template.name}</h3>
                                                    <Badge variant="outline">{template.category}</Badge>
                                                </div>
                                                <p className="text-sm text-muted-foreground mb-2">{template.content}</p>
                                                {template.variables.length > 0 && (
                                                    <div className="text-xs text-muted-foreground">
                                                        Variables: {template.variables.join(', ')}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
