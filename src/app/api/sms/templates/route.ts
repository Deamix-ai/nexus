import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { SMS_TEMPLATES } from '@/lib/twilio'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // For now, return the predefined templates from Twilio config
        // Later, we can store custom templates in the database
        const templates = Object.entries(SMS_TEMPLATES).map(([key, template]) => ({
            id: key,
            name: template.name,
            content: template.template, // Use 'template' property name
            variables: template.variables,
            category: 'general' // Default category since SMS_TEMPLATES doesn't have category
        }))

        return NextResponse.json({ templates })

    } catch (error) {
        console.error('Error fetching SMS templates:', error)
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

        const { name, content, variables, category } = await request.json()

        if (!name || !content) {
            return NextResponse.json(
                { error: 'Name and content are required' },
                { status: 400 }
            )
        }

        // TODO: Store custom templates in database
        // For now, return success response
        const template = {
            id: `custom_${Date.now()}`,
            name,
            content,
            variables: variables || [],
            category: category || 'custom',
            createdBy: session.user.id,
            createdAt: new Date().toISOString()
        }

        return NextResponse.json({ template })

    } catch (error) {
        console.error('Error creating SMS template:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}
