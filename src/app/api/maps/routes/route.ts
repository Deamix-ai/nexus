import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { googleMapsService } from '@/lib/google-maps'

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { origin, destination, waypoints, optimize } = await request.json()

        if (!origin || !destination) {
            return NextResponse.json(
                { error: 'Origin and destination are required' },
                { status: 400 }
            )
        }

        let routeInfo
        if (waypoints && waypoints.length > 0 && optimize) {
            // Optimize route with multiple stops
            routeInfo = await googleMapsService.optimizeRoute(origin, [...waypoints, destination], false)
        } else {
            // Simple route between two points
            routeInfo = await googleMapsService.getRoute(origin, destination)
        }

        if (!routeInfo) {
            return NextResponse.json(
                { error: 'Unable to calculate route' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            route: routeInfo,
            origin,
            destination,
            waypoints: waypoints || []
        })

    } catch (error) {
        console.error('Route calculation API error:', error)
        return NextResponse.json(
            { error: 'Failed to calculate route' },
            { status: 500 }
        )
    }
}
