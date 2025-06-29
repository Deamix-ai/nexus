'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    FileText,
    Download,
    Eye,
    Upload,
    Plus,
    FileImage,
    FileSpreadsheet,
    Calendar
} from 'lucide-react'

interface Document {
    id: string
    name: string
    description?: string
    type: string
    category?: string
    version: number
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    tags: string[]
    uploadedBy: {
        firstName: string
        lastName: string
    }
    createdAt: string
}

interface ProjectDocumentsProps {
    projectId: string
    canUpload?: boolean
}

const getFileIcon = (mimeType: string) => {
    if (mimeType.startsWith('image/')) return FileImage
    if (mimeType.includes('pdf')) return FileText
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return FileSpreadsheet
    return FileText
}

const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

const formatDocumentType = (type: string) => {
    return type.replace('_', ' ')
}

export default function ProjectDocuments({ projectId, canUpload = true }: ProjectDocumentsProps) {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetchDocuments()
    }, [projectId])

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const response = await fetch(`/api/documents?projectId=${projectId}`)
            if (!response.ok) throw new Error('Failed to fetch documents')

            const data = await response.json()
            setDocuments(data.documents || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleDownload = async (documentId: string, fileName: string) => {
        try {
            const response = await fetch(`/api/documents/${documentId}/download`)
            if (!response.ok) throw new Error('Failed to download document')

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = fileName
            document.body.appendChild(a)
            a.click()
            window.URL.revokeObjectURL(url)
            document.body.removeChild(a)
        } catch (err) {
            console.error('Download failed:', err)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Project Documents
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-2 text-sm text-gray-600">Loading documents...</p>
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
                            <FileText className="h-5 w-5" />
                            Project Documents
                        </CardTitle>
                        <CardDescription>
                            {documents.length} document{documents.length !== 1 ? 's' : ''} attached to this project
                        </CardDescription>
                    </div>
                    {canUpload && (
                        <Button
                            size="sm"
                            onClick={() => window.open('/dashboard/documents', '_blank')}
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Document
                        </Button>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
                        <p className="text-red-600 text-sm">{error}</p>
                    </div>
                )}

                {documents.length === 0 ? (
                    <div className="text-center py-8">
                        <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">No documents attached</p>
                        <p className="text-sm text-gray-500 mt-1">Upload documents to keep all project files organized</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {documents.map((doc) => {
                            const FileIcon = getFileIcon(doc.mimeType)
                            return (
                                <div
                                    key={doc.id}
                                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                                        <FileIcon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-gray-900 truncate">{doc.name}</p>
                                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                                <span>{formatDocumentType(doc.type)}</span>
                                                <span>•</span>
                                                <span>{formatFileSize(doc.fileSize)}</span>
                                                <span>•</span>
                                                <span>v{doc.version}</span>
                                                <span>•</span>
                                                <span className="flex items-center">
                                                    <Calendar className="h-3 w-3 mr-1" />
                                                    {new Date(doc.createdAt).toLocaleDateString()}
                                                </span>
                                            </div>
                                            {doc.description && (
                                                <p className="text-xs text-gray-600 mt-1 line-clamp-1">{doc.description}</p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Uploaded by {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 flex-shrink-0">
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => window.open(doc.fileUrl, '_blank')}
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            View
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleDownload(doc.id, doc.fileName)}
                                        >
                                            <Download className="h-3 w-3 mr-1" />
                                            Download
                                        </Button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>
                )}
            </CardContent>
        </Card>
    )
}
