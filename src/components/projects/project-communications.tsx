'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    MessageSquare,
    Mail,
    Phone,
    Plus,
    Send,
    Clock,
    CheckCircle,
    Eye,
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
    fromUser?: {
        firstName: string
        lastName: string
    }
    createdAt: string
}

interface ProjectCommunicationsProps {
    projectId: string
    clientEmail?: string
    clientPhone?: string
}

const getTypeIcon = (type: string) => {
    switch (type) {
        case 'EMAIL': return Mail
        case 'SMS': return MessageSquare
        case 'WHATSAPP': return MessageSquare
        case 'PHONE_CALL': return Phone
        default: return MessageSquare
    }
}

const getStatusIcon = (status: string) => {
    switch (status) {
        case 'PENDING': return Clock
        case 'SENT': return Send
        case 'DELIVERED': return CheckCircle
        case 'READ': return Eye
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

export default function ProjectCommunications({
    projectId,
    clientEmail,
    clientPhone
}: ProjectCommunicationsProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchMessages()
    }, [projectId])

    const fetchMessages = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/messages?projectId=${projectId}&limit=5`)
            if (!response.ok) throw new Error('Failed to fetch messages')

            const data = await response.json()
            setMessages(data.messages || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <MessageSquare className="h-5 w-5" />
                        Communications
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Loading messages...</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            <MessageSquare className="h-5 w-5" />
                            Communications
                        </CardTitle>
                        <CardDescription>
                            Recent messages and client communications
                        </CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {clientEmail && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/dashboard/communications?compose=email&to=${clientEmail}&project=${projectId}`, '_blank')}
                            >
                                <Mail className="h-4 w-4 mr-1" />
                                Email
                            </Button>
                        )}
                        {clientPhone && (
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => window.open(`/dashboard/communications?compose=sms&to=${clientPhone}&project=${projectId}`, '_blank')}
                            >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                SMS
                            </Button>
                        )}
                        <Button
                            size="sm"
                            onClick={() => window.open('/dashboard/communications', '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-1" />
                            New
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {messages.length === 0 ? (
                    <div className="text-center py-8">
                        <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No communications yet</p>
                        <p className="text-sm text-gray-500 mt-1">Start communicating with your client</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {messages.map((message) => {
                            const TypeIcon = getTypeIcon(message.type)
                            const StatusIcon = getStatusIcon(message.status)

                            return (
                                <div
                                    key={message.id}
                                    className="flex items-start space-x-3 p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex-shrink-0 mt-1">
                                        <TypeIcon className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-2 mb-1">
                                            <p className="font-medium text-gray-900 text-sm truncate">
                                                {message.subject || `${message.type} ${message.direction.toLowerCase()}`}
                                            </p>
                                            <StatusIcon className={`h-3 w-3 ${getStatusColor(message.status)}`} />
                                            <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(message.status)} bg-gray-100`}>
                                                {message.status}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600 line-clamp-2 mb-2">{message.body}</p>
                                        <div className="flex items-center space-x-3 text-xs text-gray-500">
                                            <span>
                                                {message.direction === 'OUTBOUND' ? 'To:' : 'From:'} {message.toEmail || message.toPhone}
                                            </span>
                                            {message.fromUser && (
                                                <span>By: {message.fromUser.firstName} {message.fromUser.lastName}</span>
                                            )}
                                            <span className="flex items-center">
                                                <Calendar className="h-3 w-3 mr-1" />
                                                {formatDate(message.createdAt)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })}

                        {messages.length >= 5 && (
                            <div className="text-center pt-3 border-t">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => window.open(`/dashboard/communications?project=${projectId}`, '_blank')}
                                >
                                    View All Messages
                                </Button>
                            </div>
                        )}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
