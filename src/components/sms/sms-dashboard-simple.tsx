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

interface SMSStats {
    totalSent: number
    totalDelivered: number
    totalFailed: number
    totalCost: number
    deliveryRate: number
}

export function SMSDashboard() {
    const [activeSection, setActiveSection] = useState('send')
    const [messages, setMessages] = useState<SMSMessage[]>([])
    const [stats, setStats] = useState<SMSStats | null>(null)
    const [loading, setLoading] = useState(false)

    // Send SMS Form State
    const [smsForm, setSmsForm] = useState({
        to: '',
        message: '',
        clientId: '',
        projectId: ''
    })

    useEffect(() => {
        fetchMessages()
        fetchStats()
    }, [])

    const fetchMessages = async () => {
        try {
            const response = await fetch('/api/sms?action=history&limit=20')
            if (response.ok) {
                const data = await response.json()
                setMessages(data.messages || [])
            }
        } catch (error) {
            console.error('Error fetching messages:', error)
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

    const showToast = (title: string, description: string, type: 'success' | 'error' = 'success') => {
        // Simple alert for now - can be replaced with proper toast later
        alert(`${title}: ${description}`)
    }

    const handleSendSMS = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!smsForm.to || !smsForm.message) {
            showToast("Error", "Phone number and message are required", 'error')
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
                    projectId: smsForm.projectId || undefined
                })
            })

            if (response.ok) {
                showToast("Success", `SMS sent successfully to ${smsForm.to}`)
                setSmsForm({
                    to: '',
                    message: '',
                    clientId: '',
                    projectId: ''
                })
                fetchMessages()
                fetchStats()
            } else {
                const error = await response.json()
                throw new Error(error.error || 'Failed to send SMS')
            }
        } catch (error) {
            showToast("Error", error instanceof Error ? error.message : 'Failed to send SMS', 'error')
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
                return <Clock className="h-4 w-4 text-gray-500" />
        }
    }

    const getStatusBadge = (status: string) => {
        const colorClass = {
            delivered: 'bg-green-100 text-green-800',
            sent: 'bg-yellow-100 text-yellow-800',
            failed: 'bg-red-100 text-red-800',
            undelivered: 'bg-red-100 text-red-800',
            queued: 'bg-gray-100 text-gray-800'
        }[status] || 'bg-gray-100 text-gray-800'

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorClass}`}>
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
            </span>
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

            {/* Navigation Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    {[
                        { id: 'send', name: 'Send SMS', icon: Send },
                        { id: 'history', name: 'Message History', icon: MessageSquare },
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

            {/* Send SMS Section */}
            {activeSection === 'send' && (
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
                                    <Label htmlFor="clientId">Client ID (Optional)</Label>
                                    <Input
                                        id="clientId"
                                        placeholder="Client ID to link this message"
                                        value={smsForm.clientId}
                                        onChange={(e) => setSmsForm({ ...smsForm, clientId: e.target.value })}
                                    />
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

                            <div className="space-y-2">
                                <Label htmlFor="projectId">Project ID (Optional)</Label>
                                <Input
                                    id="projectId"
                                    placeholder="Project ID to link this message"
                                    value={smsForm.projectId}
                                    onChange={(e) => setSmsForm({ ...smsForm, projectId: e.target.value })}
                                />
                            </div>

                            <Button type="submit" disabled={loading} className="w-full">
                                <Send className="mr-2 h-4 w-4" />
                                {loading ? 'Sending...' : 'Send SMS'}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            )}

            {/* Message History Section */}
            {activeSection === 'history' && (
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
            )}
        </div>
    )
}
