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

        // Fetch invoices from Xero
        const invoices = await xeroClient.getInvoices()

        return NextResponse.json({
            success: true,
            invoices: invoices || []
        })

    } catch (error) {
        console.error('Xero invoices fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch invoices from Xero' },
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

        const invoiceData = await request.json()

        // Create invoice in Xero
        const invoice = await xeroClient.createInvoice(invoiceData)

        return NextResponse.json({
            success: true,
            invoice,
            message: 'Invoice created successfully in Xero'
        })

    } catch (error) {
        console.error('Xero invoice creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create invoice in Xero' },
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

        const { invoiceId, ...updateData } = await request.json()

        // Update invoice in Xero
        const invoice = await xeroClient.updateInvoice(invoiceId, updateData)

        return NextResponse.json({
            success: true,
            invoice,
            message: 'Invoice updated successfully in Xero'
        })

    } catch (error) {
        console.error('Xero invoice update error:', error)
        return NextResponse.json(
            { error: 'Failed to update invoice in Xero' },
            { status: 500 }
        )
    }
}
