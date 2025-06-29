import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { googleMapsService, Territory } from '@/lib/google-maps'

// Mock territories data
const mockTerritories: Territory[] = [
    {
        id: 'territory_1',
        name: 'Downtown District',
        bounds: {
            north: 40.8000,
            south: 40.7000,
            east: -73.9000,
            west: -74.1000
        },
        assignedUserId: 'user_123',
        color: '#3b82f6'
    },
    {
        id: 'territory_2',
        name: 'Suburban Area',
        bounds: {
            north: 40.9000,
            south: 40.8000,
            east: -73.8000,
            west: -74.0000
        },
        assignedUserId: 'user_456',
        color: '#10b981'
    },
    {
        id: 'territory_3',
        name: 'Industrial Zone',
        bounds: {
            north: 40.7000,
            south: 40.6000,
            east: -73.9000,
            west: -74.1000
        },
        assignedUserId: null,
        color: '#f59e0b'
    }
]

export async function GET() {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        return NextResponse.json({
            success: true,
            territories: mockTerritories
        })

    } catch (error) {
        console.error('Territories fetch error:', error)
        return NextResponse.json(
            { error: 'Failed to fetch territories' },
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

        const { name, bounds, assignedUserId, color } = await request.json()

        if (!name || !bounds) {
            return NextResponse.json(
                { error: 'Name and bounds are required' },
                { status: 400 }
            )
        }

        const newTerritory: Territory = {
            id: `territory_${Date.now()}`,
            name,
            bounds,
            assignedUserId: assignedUserId || null,
            color: color || '#6b7280'
        }

        // In a real implementation, save to database
        mockTerritories.push(newTerritory)

        return NextResponse.json({
            success: true,
            territory: newTerritory,
            message: 'Territory created successfully'
        })

    } catch (error) {
        console.error('Territory creation error:', error)
        return NextResponse.json(
            { error: 'Failed to create territory' },
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

        const { territoryId, ...updateData } = await request.json()

        if (!territoryId) {
            return NextResponse.json(
                { error: 'Territory ID is required' },
                { status: 400 }
            )
        }

        const territoryIndex = mockTerritories.findIndex(t => t.id === territoryId)
        if (territoryIndex === -1) {
            return NextResponse.json(
                { error: 'Territory not found' },
                { status: 404 }
            )
        }

        // Update territory
        mockTerritories[territoryIndex] = { ...mockTerritories[territoryIndex], ...updateData }

        return NextResponse.json({
            success: true,
            territory: mockTerritories[territoryIndex],
            message: 'Territory updated successfully'
        })

    } catch (error) {
        console.error('Territory update error:', error)
        return NextResponse.json(
            { error: 'Failed to update territory' },
            { status: 500 }
        )
    }
}

export async function DELETE(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const territoryId = searchParams.get('id')

        if (!territoryId) {
            return NextResponse.json(
                { error: 'Territory ID is required' },
                { status: 400 }
            )
        }

        const territoryIndex = mockTerritories.findIndex(t => t.id === territoryId)
        if (territoryIndex === -1) {
            return NextResponse.json(
                { error: 'Territory not found' },
                { status: 404 }
            )
        }

        // Remove territory
        mockTerritories.splice(territoryIndex, 1)

        return NextResponse.json({
            success: true,
            message: 'Territory deleted successfully'
        })

    } catch (error) {
        console.error('Territory deletion error:', error)
        return NextResponse.json(
            { error: 'Failed to delete territory' },
            { status: 500 }
        )
    }
}
