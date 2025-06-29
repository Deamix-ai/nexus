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

        const { address } = await request.json()

        if (!address) {
            return NextResponse.json(
                { error: 'Address is required' },
                { status: 400 }
            )
        }

        const coordinates = await googleMapsService.geocodeAddress(address)

        if (!coordinates) {
            return NextResponse.json(
                { error: 'Unable to geocode address' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            success: true,
            coordinates,
            address
        })

    } catch (error) {
        console.error('Geocoding API error:', error)
        return NextResponse.json(
            { error: 'Failed to geocode address' },
            { status: 500 }
        )
    }
}
