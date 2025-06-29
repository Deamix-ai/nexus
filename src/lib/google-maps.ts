import { Client } from '@googlemaps/google-maps-services-js'

// Initialize Google Maps client
const googleMapsClient = new Client({})

// Mock API key for development - in production, use environment variable
const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY || 'mock_api_key_for_development'

export interface Address {
    street: string
    city: string
    state: string
    zipCode: string
    country: string
    formattedAddress?: string
    latitude?: number
    longitude?: number
}

export interface Location {
    lat: number
    lng: number
}

export interface RouteInfo {
    distance: string
    duration: string
    steps: Array<{
        instruction: string
        distance: string
        duration: string
    }>
}

export interface Territory {
    id: string
    name: string
    bounds: {
        north: number
        south: number
        east: number
        west: number
    }
    assignedUserId?: string
    color: string
}

export class GoogleMapsService {
    private client = googleMapsClient
    private apiKey = GOOGLE_MAPS_API_KEY

    /**
     * Geocode an address to get coordinates
     */
    async geocodeAddress(address: string): Promise<Location | null> {
        try {
            if (this.apiKey === 'mock_api_key_for_development') {
                // Return mock coordinates for development
                return this.getMockCoordinates(address)
            }

            const response = await this.client.geocode({
                params: {
                    address,
                    key: this.apiKey
                }
            })

            if (response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location
                return {
                    lat: location.lat,
                    lng: location.lng
                }
            }

            return null
        } catch (error) {
            console.error('Geocoding error:', error)
            return null
        }
    }

    /**
     * Reverse geocode coordinates to get address
     */
    async reverseGeocode(location: Location): Promise<string | null> {
        try {
            if (this.apiKey === 'mock_api_key_for_development') {
                return `${location.lat.toFixed(4)}, ${location.lng.toFixed(4)} Mock Address`
            }

            const response = await this.client.reverseGeocode({
                params: {
                    latlng: location,
                    key: this.apiKey
                }
            })

            if (response.data.results.length > 0) {
                return response.data.results[0].formatted_address
            }

            return null
        } catch (error) {
            console.error('Reverse geocoding error:', error)
            return null
        }
    }

    /**
     * Get route between two locations
     */
    async getRoute(origin: string | Location, destination: string | Location): Promise<RouteInfo | null> {
        try {
            if (this.apiKey === 'mock_api_key_for_development') {
                return this.getMockRoute(origin, destination)
            }

            const response = await this.client.directions({
                params: {
                    origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
                    destination: typeof destination === 'string' ? destination : `${destination.lat},${destination.lng}`,
                    key: this.apiKey
                }
            })

            if (response.data.routes.length > 0) {
                const route = response.data.routes[0]
                const leg = route.legs[0]

                return {
                    distance: leg.distance.text,
                    duration: leg.duration.text,
                    steps: leg.steps.map(step => ({
                        instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                        distance: step.distance.text,
                        duration: step.duration.text
                    }))
                }
            }

            return null
        } catch (error) {
            console.error('Route calculation error:', error)
            return null
        }
    }

    /**
     * Optimize route for multiple stops
     */
    async optimizeRoute(
        origin: string | Location,
        destinations: Array<string | Location>,
        returnToOrigin: boolean = false
    ): Promise<{
        optimizedOrder: number[]
        totalDistance: string
        totalDuration: string
        routes: RouteInfo[]
    } | null> {
        try {
            if (this.apiKey === 'mock_api_key_for_development') {
                return this.getMockOptimizedRoute(origin, destinations, returnToOrigin)
            }

            const waypoints = destinations.map(dest =>
                typeof dest === 'string' ? dest : `${dest.lat},${dest.lng}`
            )

            const response = await this.client.directions({
                params: {
                    origin: typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`,
                    destination: returnToOrigin
                        ? (typeof origin === 'string' ? origin : `${origin.lat},${origin.lng}`)
                        : waypoints[waypoints.length - 1],
                    waypoints: waypoints.slice(0, -1),
                    optimize: true,
                    key: this.apiKey
                }
            })

            if (response.data.routes.length > 0) {
                const route = response.data.routes[0]
                const optimizedOrder = route.waypoint_order || []

                let totalDistance = 0
                let totalDuration = 0
                const routes: RouteInfo[] = []

                route.legs.forEach(leg => {
                    totalDistance += leg.distance.value
                    totalDuration += leg.duration.value

                    routes.push({
                        distance: leg.distance.text,
                        duration: leg.duration.text,
                        steps: leg.steps.map(step => ({
                            instruction: step.html_instructions.replace(/<[^>]*>/g, ''),
                            distance: step.distance.text,
                            duration: step.duration.text
                        }))
                    })
                })

                return {
                    optimizedOrder,
                    totalDistance: this.formatDistance(totalDistance),
                    totalDuration: this.formatDuration(totalDuration),
                    routes
                }
            }

            return null
        } catch (error) {
            console.error('Route optimization error:', error)
            return null
        }
    }

    /**
     * Calculate distance between two points
     */
    async getDistance(origin: Location, destination: Location): Promise<{ distance: string; duration: string } | null> {
        try {
            if (this.apiKey === 'mock_api_key_for_development') {
                const distance = this.calculateMockDistance(origin, destination)
                return {
                    distance: `${distance.toFixed(1)} km`,
                    duration: `${Math.round(distance * 2)} mins`
                }
            }

            const response = await this.client.distancematrix({
                params: {
                    origins: [`${origin.lat},${origin.lng}`],
                    destinations: [`${destination.lat},${destination.lng}`],
                    key: this.apiKey
                }
            })

            if (response.data.rows.length > 0 && response.data.rows[0].elements.length > 0) {
                const element = response.data.rows[0].elements[0]
                if (element.status === 'OK') {
                    return {
                        distance: element.distance.text,
                        duration: element.duration.text
                    }
                }
            }

            return null
        } catch (error) {
            console.error('Distance calculation error:', error)
            return null
        }
    }

    /**
     * Check if a location is within a territory
     */
    isLocationInTerritory(location: Location, territory: Territory): boolean {
        return (
            location.lat >= territory.bounds.south &&
            location.lat <= territory.bounds.north &&
            location.lng >= territory.bounds.west &&
            location.lng <= territory.bounds.east
        )
    }

    /**
     * Find the best territory for a location
     */
    findBestTerritory(location: Location, territories: Territory[]): Territory | null {
        for (const territory of territories) {
            if (this.isLocationInTerritory(location, territory)) {
                return territory
            }
        }
        return null
    }

    // Mock functions for development
    private getMockCoordinates(address: string): Location {
        // Generate deterministic coordinates based on address
        const hash = this.simpleHash(address)
        return {
            lat: 40.7128 + (hash % 1000) / 10000, // Around NYC
            lng: -74.0060 + (hash % 1000) / 10000
        }
    }

    private getMockRoute(origin: string | Location, destination: string | Location): RouteInfo {
        return {
            distance: '15.2 km',
            duration: '22 mins',
            steps: [
                { instruction: 'Head north on Main St', distance: '0.5 km', duration: '2 mins' },
                { instruction: 'Turn right onto Highway 1', distance: '12.0 km', duration: '15 mins' },
                { instruction: 'Turn left onto Oak Ave', distance: '2.7 km', duration: '5 mins' }
            ]
        }
    }

    private getMockOptimizedRoute(
        origin: string | Location,
        destinations: Array<string | Location>,
        returnToOrigin: boolean
    ) {
        return {
            optimizedOrder: destinations.map((_, index) => index),
            totalDistance: '45.8 km',
            totalDuration: '1 hour 15 mins',
            routes: destinations.map((_, index) => ({
                distance: `${(Math.random() * 20 + 5).toFixed(1)} km`,
                duration: `${Math.round(Math.random() * 30 + 10)} mins`,
                steps: [
                    { instruction: `Route to stop ${index + 1}`, distance: '5.0 km', duration: '8 mins' }
                ]
            }))
        }
    }

    private calculateMockDistance(origin: Location, destination: Location): number {
        // Simple Haversine formula approximation
        const dLat = destination.lat - origin.lat
        const dLng = destination.lng - origin.lng
        return Math.sqrt(dLat * dLat + dLng * dLng) * 111 // Rough km conversion
    }

    private formatDistance(meters: number): string {
        if (meters < 1000) {
            return `${meters} m`
        }
        return `${(meters / 1000).toFixed(1)} km`
    }

    private formatDuration(seconds: number): string {
        const hours = Math.floor(seconds / 3600)
        const minutes = Math.floor((seconds % 3600) / 60)

        if (hours > 0) {
            return `${hours}h ${minutes}m`
        }
        return `${minutes} mins`
    }

    private simpleHash(str: string): number {
        let hash = 0
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i)
            hash = ((hash << 5) - hash) + char
            hash = hash & hash // Convert to 32-bit integer
        }
        return Math.abs(hash)
    }
}

// Export singleton instance
export const googleMapsService = new GoogleMapsService()
