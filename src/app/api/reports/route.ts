import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasPermission } from "@/lib/permissions";

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Check if user has permission to view reports
        if (!hasPermission(session.user.role, 'reports', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const period = searchParams.get('period') || '30'; // days
        const showroomId = searchParams.get('showroomId');

        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - parseInt(period));

        // Base filter conditions
        const baseFilter: any = {
            createdAt: {
                gte: startDate,
                lte: endDate
            }
        };

        // Add showroom filter if specified and user has access
        if (showroomId && (session.user.role === 'ADMIN' || session.user.role === 'DIRECTOR')) {
            baseFilter.showroomId = showroomId;
        } else if (session.user.showroomId) {
            baseFilter.showroomId = session.user.showroomId;
        }

        // Get projects data
        const projects = await prisma.project.findMany({
            where: baseFilter,
            include: {
                client: true,
                showroom: true,
                assignedTo: true
            }
        });

        // Get sales data
        const salesMetrics = {
            totalRevenue: projects
                .filter((p: any) => p.status === 'COMPLETED')
                .reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0),

            projectsClosed: projects.filter((p: any) => p.status === 'COMPLETED').length,

            projectsInProgress: projects.filter((p: any) =>
                p.status === 'IN_PROGRESS' || p.status === 'ACTIVE'
            ).length,

            conversionRate: projects.length > 0
                ? (projects.filter((p: any) => p.status === 'COMPLETED').length / projects.length) * 100
                : 0
        };

        // Get pipeline data by stage
        const pipelineData = await prisma.project.groupBy({
            by: ['currentStage'],
            where: {
                showroomId: session.user.showroomId || undefined,
                status: { not: 'COMPLETED' }
            },
            _count: {
                currentStage: true
            },
            _sum: {
                estimatedValue: true
            }
        });

        // Get recent activity
        const recentActivities = await prisma.activity.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate
                }
            },
            include: {
                user: true,
                project: true,
                client: true
            },
            orderBy: { createdAt: 'desc' },
            take: 10
        });

        // Get team performance
        const teamPerformance = await prisma.project.groupBy({
            by: ['assignedToId'],
            where: {
                ...baseFilter,
                assignedToId: { not: null }
            },
            _count: {
                assignedToId: true
            },
            _sum: {
                estimatedValue: true
            }
        });

        // Get detailed team data
        const teamDetails = await Promise.all(
            teamPerformance.map(async (perf: any) => {
                const user = await prisma.user.findUnique({
                    where: { id: perf.assignedToId! }
                });
                return {
                    user,
                    projectsCount: perf._count.assignedToId,
                    totalValue: perf._sum.estimatedValue || 0
                };
            })
        );

        // Get monthly trends (last 12 months)
        const monthlyData = [];
        for (let i = 11; i >= 0; i--) {
            const monthStart = new Date();
            monthStart.setMonth(monthStart.getMonth() - i);
            monthStart.setDate(1);

            const monthEnd = new Date(monthStart);
            monthEnd.setMonth(monthEnd.getMonth() + 1);
            monthEnd.setDate(0);

            const monthProjects = await prisma.project.count({
                where: {
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    showroomId: session.user.showroomId || undefined
                }
            });

            const monthRevenue = await prisma.project.aggregate({
                where: {
                    createdAt: {
                        gte: monthStart,
                        lte: monthEnd
                    },
                    status: 'COMPLETED',
                    showroomId: session.user.showroomId || undefined
                },
                _sum: {
                    estimatedValue: true
                }
            });

            monthlyData.push({
                month: monthStart.toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
                projects: monthProjects,
                revenue: monthRevenue._sum.estimatedValue || 0
            });
        }

        const reports = {
            period: parseInt(period),
            summary: {
                totalRevenue: salesMetrics.totalRevenue,
                projectsClosed: salesMetrics.projectsClosed,
                projectsInProgress: salesMetrics.projectsInProgress,
                conversionRate: Math.round(salesMetrics.conversionRate * 100) / 100,
                totalProjects: projects.length,
                averageProjectValue: projects.length > 0
                    ? Math.round((projects.reduce((sum: number, p: any) => sum + (p.estimatedValue || 0), 0) / projects.length))
                    : 0
            },
            pipeline: pipelineData.map((stage: any) => ({
                stage: stage.currentStage,
                count: stage._count.currentStage,
                value: stage._sum.estimatedValue || 0
            })),
            monthlyTrends: monthlyData,
            teamPerformance: teamDetails.filter((t: any) => t.user),
            recentActivities: recentActivities.slice(0, 10),
            projectsByStatus: {
                completed: projects.filter((p: any) => p.status === 'COMPLETED').length,
                inProgress: projects.filter((p: any) => p.status === 'IN_PROGRESS' || p.status === 'ACTIVE').length,
                cancelled: projects.filter((p: any) => p.status === 'CANCELLED').length,
                onHold: projects.filter((p: any) => p.status === 'ON_HOLD').length
            }
        };

        return NextResponse.json(reports);

    } catch (error) {
        console.error("Error fetching reports:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
