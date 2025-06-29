import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { xeroClient } from '@/lib/xero'

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Fetch contacts from Xero
        const contacts = await xeroClient.getContacts()

        return NextResponse.json({
            success: true,
            contacts: contacts || []
        })

    } catch (error) {
        console.error('Xero contacts fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch contacts from Xero' },
            { status: 500 }
        )
    }
}

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const contactData = await request.json()

        // Create contact in Xero
        const contact = await xeroClient.createContact(contactData)

        return NextResponse.json({
            success: true,
            contact,
            message: 'Contact created successfully in Xero'
        })

    } catch (error) {
        console.error('Xero contact creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create contact in Xero' },
            { status: 500 }
        )
    }
}

export async function PUT(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { contactId, ...updateData } = await request.json()

        // Update contact in Xero
        const contact = await xeroClient.updateContact(contactId, updateData)

        return NextResponse.json({
            success: true,
            contact,
            message: 'Contact updated successfully in Xero'
        })

    } catch (error) {
        console.error('Xero contact update error:', error)
        return NextResponse.json(
            { error: 'Failed to update contact in Xero' },
            { status: 500 }
        )
    }
}
