import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { CONTRACT_TEMPLATES } from '@/lib/docusign'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Return available templates
        const templates = Object.entries(CONTRACT_TEMPLATES).map(([key, template]) => ({
            id: key,
            name: template.name,
            description: template.description,
            type: template.type,
            created: new Date().toISOString(),
            usageCount: Math.floor(Math.random() * 50) // Mock usage count
        }))

        // Add some additional mock templates
        const additionalTemplates = [
            {
                id: 'CONSULTATION_AGREEMENT',
                name: 'Initial Consultation Agreement',
                description: 'Agreement for initial design consultation services',
                type: 'agreement',
                created: new Date(Date.now() - 86400000 * 30).toISOString(),
                usageCount: 25
            },
            {
                id: 'CHANGE_ORDER',
                name: 'Project Change Order',
                description: 'Document for project scope changes and additional work',
                type: 'agreement',
                created: new Date(Date.now() - 86400000 * 15).toISOString(),
                usageCount: 12
            },
            {
                id: 'WARRANTY_AGREEMENT',
                name: 'Warranty and Maintenance Agreement',
                description: 'Post-installation warranty and maintenance terms',
                type: 'agreement',
                created: new Date(Date.now() - 86400000 * 60).toISOString(),
                usageCount: 38
            },
            {
                id: 'PAYMENT_AGREEMENT',
                name: 'Payment Plan Agreement',
                description: 'Structured payment plan for project financing',
                type: 'contract',
                created: new Date(Date.now() - 86400000 * 45).toISOString(),
                usageCount: 17
            }
        ]

        const allTemplates = [...templates, ...additionalTemplates]

        return NextResponse.json({ templates: allTemplates })

    } catch (error) {
        console.error('Error fetching templates:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Check permissions - only admin/manager roles can create templates
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { role: true }
        })

        if (!user || !['ADMIN', 'SALES_MANAGER', 'REGIONAL_MANAGER'].includes(user.role)) {
            return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 })
        }

        const { name, description, type, documentContent } = await request.json()

        if (!name || !description || !type) {
            return NextResponse.json(
                { error: 'Name, description, and type are required' },
                { status: 400 }
            )
        }

        // TODO: In production, this would create a template in DocuSign
        // For now, return a mock success response
        const template = {
            id: `template_${Date.now()}`,
            name,
            description,
            type,
            created: new Date().toISOString(),
            usageCount: 0,
            createdBy: session.user.id
        }

        return NextResponse.json({ template })

    } catch (error) {
        console.error('Error creating template:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
