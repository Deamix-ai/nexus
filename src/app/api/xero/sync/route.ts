import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { xeroClient } from '@/lib/xero'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { projectId, clientId } = await request.json()

        if (!projectId && !clientId) {
            return NextResponse.json(
                { error: 'Either projectId or clientId is required' },
                { status: 400 }
            )
        }

        // Sync project/client data to Xero
        let result
        if (projectId) {
            result = await xeroClient.syncProject(projectId)
        } else {
            result = await xeroClient.syncClient(clientId)
        }

        return NextResponse.json({
            success: true,
            syncResult: result,
            message: 'Data synchronized successfully with Xero'
        })

    } catch (error) {
        console.error('Xero sync error:', error)
        return NextResponse.json(
            { error: 'Failed to synchronize data with Xero' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const type = searchParams.get('type') // 'all', 'invoices', 'contacts', 'payments'

        // Get sync status and recent activity
        const syncStatus = await xeroClient.getSyncStatus(type)

        return NextResponse.json({
            success: true,
            syncStatus
        })

    } catch (error) {
        console.error('Xero sync status error:', error)
        return NextResponse.json(
            { error: 'Failed to get sync status' },
            { status: 500 }
        )
    }
}
