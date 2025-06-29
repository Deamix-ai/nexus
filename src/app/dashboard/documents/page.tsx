'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    FileText,
    Upload,
    Download,
    Eye,
    Trash2,
    Filter,
    Search,
    Plus,
    FileImage,
    FileSpreadsheet,
    MoreHorizontal
} from 'lucide-react'

interface Document {
    id: string
    name: string
    description?: string
    type: string
    category?: string
    status: string
    version: number
    fileUrl: string
    fileName: string
    fileSize: number
    mimeType: string
    tags: string[]
    isPublic: boolean
    expiresAt?: string
    projectId?: string
    clientId?: string
    uploadedById: string
    showroomId?: string
    uploadedBy: {
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
    updatedAt: string
}

const documentTypes = [
    'QUOTE', 'CONTRACT', 'INVOICE', 'DESIGN', 'PHOTO', 'CERTIFICATE',
    'WARRANTY', 'PERMIT', 'SPECIFICATION', 'FLOOR_PLAN', 'EMAIL', 'OTHER'
]

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

export default function DocumentsPage() {
    const [documents, setDocuments] = useState<Document[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterType, setFilterType] = useState('')
    const [showUploadModal, setShowUploadModal] = useState(false)
    const [uploadData, setUploadData] = useState({
        name: '',
        description: '',
        type: 'OTHER',
        category: '',
        tags: '',
        isPublic: false
    })

    useEffect(() => {
        fetchDocuments()
    }, [])

    const fetchDocuments = async () => {
        try {
            setLoading(true)
            const params = new URLSearchParams()
            if (searchTerm) params.set('search', searchTerm)
            if (filterType) params.set('type', filterType)

            const response = await fetch(`/api/documents?${params}`)
            if (!response.ok) throw new Error('Failed to fetch documents')

            const data = await response.json()
            setDocuments(data.documents || [])
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred')
        } finally {
            setLoading(false)
        }
    }

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault()
        fetchDocuments()
    }

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault()

        const fileInput = document.getElementById('file') as HTMLInputElement
        const file = fileInput?.files?.[0]

        if (!file) {
            alert('Please select a file')
            return
        }

        try {
            const formData = new FormData()
            formData.append('file', file)
            formData.append('name', uploadData.name)
            formData.append('type', uploadData.type)
            formData.append('description', uploadData.description)
            formData.append('category', uploadData.category)
            formData.append('tags', uploadData.tags)
            formData.append('isPublic', uploadData.isPublic.toString())

            const response = await fetch('/api/documents/upload', {
                method: 'POST',
                body: formData
            })

            if (!response.ok) {
                const errorData = await response.json()
                throw new Error(errorData.error || 'Upload failed')
            }

            const newDocument = await response.json()
            console.log('Document uploaded:', newDocument)

            setShowUploadModal(false)
            // Reset form
            setUploadData({
                name: '',
                description: '',
                type: 'OTHER',
                category: '',
                tags: '',
                isPublic: false
            })

            // Refresh documents list
            fetchDocuments()
        } catch (err) {
            console.error('Upload failed:', err)
            alert(err instanceof Error ? err.message : 'Upload failed')
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

    const handleDelete = async (documentId: string) => {
        if (!confirm('Are you sure you want to delete this document?')) return

        try {
            const response = await fetch(`/api/documents/${documentId}`, {
                method: 'DELETE'
            })
            if (!response.ok) throw new Error('Failed to delete document')

            fetchDocuments()
        } catch (err) {
            console.error('Delete failed:', err)
        }
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-48">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading documents...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Document Management</h1>
                    <p className="text-gray-600">Upload, organize, and manage project documents</p>
                </div>
                <Button onClick={() => setShowUploadModal(true)} className="bg-blue-600 hover:bg-blue-700">
                    <Plus className="h-4 w-4 mr-2" />
                    Upload Document
                </Button>
            </div>

            {/* Search and Filters */}
            <Card>
                <CardContent className="pt-6">
                    <form onSubmit={handleSearch} className="flex gap-4">
                        <div className="flex-1">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                                <Input
                                    placeholder="Search documents..."
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
                            {documentTypes.map(type => (
                                <option key={type} value={type}>{type.replace('_', ' ')}</option>
                            ))}
                        </select>
                        <Button type="submit" variant="outline">
                            <Filter className="h-4 w-4 mr-2" />
                            Filter
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Documents Grid */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-md p-4">
                    <p className="text-red-600">{error}</p>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {documents.map((doc) => {
                    const FileIcon = getFileIcon(doc.mimeType)
                    return (
                        <Card key={doc.id} className="hover:shadow-lg transition-shadow">
                            <CardHeader className="pb-3">
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileIcon className="h-8 w-8 text-blue-600" />
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="text-sm font-medium truncate">{doc.name}</CardTitle>
                                            <CardDescription className="text-xs">
                                                {doc.type.replace('_', ' ')} • v{doc.version}
                                            </CardDescription>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="sm">
                                        <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-0">
                                <div className="space-y-2 text-xs text-gray-600">
                                    <p><strong>Size:</strong> {formatFileSize(doc.fileSize)}</p>
                                    <p><strong>Uploaded by:</strong> {doc.uploadedBy.firstName} {doc.uploadedBy.lastName}</p>
                                    <p><strong>Date:</strong> {new Date(doc.createdAt).toLocaleDateString()}</p>
                                    {doc.project && (
                                        <p><strong>Project:</strong> {doc.project.projectNumber}</p>
                                    )}
                                    {doc.client && (
                                        <p><strong>Client:</strong> {doc.client.firstName} {doc.client.lastName}</p>
                                    )}
                                    {doc.description && (
                                        <p className="text-gray-700 line-clamp-2">{doc.description}</p>
                                    )}
                                </div>

                                <div className="flex gap-2 mt-4">
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
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => handleDelete(doc.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </CardContent>
                        </Card>
                    )
                })}
            </div>

            {documents.length === 0 && !loading && (
                <div className="text-center py-12">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No documents found</p>
                    <p className="text-sm text-gray-500 mt-1">Upload your first document to get started</p>
                </div>
            )}

            {/* Upload Modal */}
            {showUploadModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg p-6 w-full max-w-md">
                        <h2 className="text-lg font-semibold mb-4">Upload Document</h2>
                        <form onSubmit={handleUpload} className="space-y-4">
                            <div>
                                <Label htmlFor="file">File</Label>
                                <Input
                                    id="file"
                                    type="file"
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="name">Document Name</Label>
                                <Input
                                    id="name"
                                    value={uploadData.name}
                                    onChange={(e) => setUploadData({ ...uploadData, name: e.target.value })}
                                    required
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="description">Description (Optional)</Label>
                                <Input
                                    id="description"
                                    value={uploadData.description}
                                    onChange={(e) => setUploadData({ ...uploadData, description: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="type">Document Type</Label>
                                <select
                                    id="type"
                                    value={uploadData.type}
                                    onChange={(e) => setUploadData({ ...uploadData, type: e.target.value })}
                                    className="w-full mt-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {documentTypes.map(type => (
                                        <option key={type} value={type}>{type.replace('_', ' ')}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <Label htmlFor="category">Category (Optional)</Label>
                                <Input
                                    id="category"
                                    value={uploadData.category}
                                    onChange={(e) => setUploadData({ ...uploadData, category: e.target.value })}
                                    className="mt-1"
                                />
                            </div>
                            <div>
                                <Label htmlFor="tags">Tags (comma-separated)</Label>
                                <Input
                                    id="tags"
                                    value={uploadData.tags}
                                    onChange={(e) => setUploadData({ ...uploadData, tags: e.target.value })}
                                    placeholder="tag1, tag2, tag3"
                                    className="mt-1"
                                />
                            </div>
                            <div className="flex items-center space-x-2">
                                <input
                                    type="checkbox"
                                    id="isPublic"
                                    checked={uploadData.isPublic}
                                    onChange={(e) => setUploadData({ ...uploadData, isPublic: e.target.checked })}
                                    className="rounded border-gray-300"
                                />
                                <Label htmlFor="isPublic">Make document public</Label>
                            </div>
                            <div className="flex gap-2 pt-4">
                                <Button type="submit" className="flex-1">
                                    <Upload className="h-4 w-4 mr-2" />
                                    Upload
                                </Button>
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setShowUploadModal(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    )
}
