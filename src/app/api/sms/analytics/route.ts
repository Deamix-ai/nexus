import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const url = new URL(request.url)
        const period = url.searchParams.get('period') || '30' // days
        const startDate = new Date()
        startDate.setDate(startDate.getDate() - parseInt(period))

        // Get SMS statistics
        const messages = await prisma.message.findMany({
            where: {
                type: 'SMS',
                createdAt: {
                    gte: startDate
                }
            },
            select: {
                status: true,
                cost: true,
                sentAt: true,
                deliveredAt: true,
                errorMessage: true
            }
        })

        // Calculate statistics
        const totalSent = messages.length
        const totalDelivered = messages.filter((m: any) => m.status === 'DELIVERED').length
        const totalFailed = messages.filter((m: any) => m.status === 'FAILED').length
        const totalCost = messages.reduce((sum: number, m: any) => sum + (m.cost || 0), 0)
        const deliveryRate = totalSent > 0 ? (totalDelivered / totalSent) * 100 : 0

        // Calculate average response time (for delivered messages)
        const deliveredMessages = messages.filter((m: any) => m.sentAt && m.deliveredAt)
        const averageResponseTime = deliveredMessages.length > 0
            ? deliveredMessages.reduce((sum: number, m: any) => {
                const sentAt = new Date(m.sentAt!).getTime()
                const deliveredAt = new Date(m.deliveredAt!).getTime()
                return sum + (deliveredAt - sentAt)
            }, 0) / deliveredMessages.length / 1000 // Convert to seconds
            : 0

        // Get daily breakdown for charts
        const dailyStats = await getDailyStats(startDate)

        const stats = {
            totalSent,
            totalDelivered,
            totalFailed,
            totalCost,
            deliveryRate,
            averageResponseTime,
            dailyStats
        }

        return NextResponse.json({ stats })

    } catch (error) {
        console.error('Error fetching SMS analytics:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function getDailyStats(startDate: Date) {
    const endDate = new Date()
    const days = []

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const dayStart = new Date(d)
        dayStart.setHours(0, 0, 0, 0)

        const dayEnd = new Date(d)
        dayEnd.setHours(23, 59, 59, 999)

        const dayMessages = await prisma.message.count({
            where: {
                type: 'SMS',
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        })

        const dayDelivered = await prisma.message.count({
            where: {
                type: 'SMS',
                status: 'DELIVERED',
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        })

        const dayFailed = await prisma.message.count({
            where: {
                type: 'SMS',
                status: 'FAILED',
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            }
        })

        const dayCost = await prisma.message.aggregate({
            where: {
                type: 'SMS',
                createdAt: {
                    gte: dayStart,
                    lte: dayEnd
                }
            },
            _sum: {
                cost: true
            }
        })

        days.push({
            date: dayStart.toISOString().split('T')[0],
            sent: dayMessages,
            delivered: dayDelivered,
            failed: dayFailed,
            cost: dayCost._sum.cost || 0
        })
    }

    return days
}
