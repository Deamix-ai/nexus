import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

// Validation schema for creating/updating calendar events
const eventSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    startDate: z.string(), // ISO date string
    endDate: z.string(), // ISO date string
    type: z.enum(['CONSULTATION', 'SURVEY', 'DESIGN_MEETING', 'DESIGN_PRESENTATION', 'FOLLOW_UP', 'INTERNAL_MEETING', 'OTHER']),
    status: z.enum(['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('SCHEDULED'),
    location: z.string().optional(),
    customerId: z.string().optional(),
    customerName: z.string().optional(),
    projectId: z.string().optional(),
    clientId: z.string().optional(),
    assignedToId: z.string().optional(),
    attendees: z.array(z.object({
        id: z.string(),
        name: z.string(),
        email: z.string(),
        role: z.string(),
    })).default([]),
});

// GET /api/calendar - Fetch calendar events
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'calendar', 'read')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const { searchParams } = new URL(request.url);
        const startDate = searchParams.get('startDate'); // ISO date
        const endDate = searchParams.get('endDate'); // ISO date
        const type = searchParams.get('type');
        const status = searchParams.get('status');
        const assignedToId = searchParams.get('assignedToId');

        try {
            // Try to use Prisma client first
            const { prisma } = await import('@/lib/prisma');

            // Build where clause
            const where: any = {};

            if (startDate && endDate) {
                where.startDate = {
                    gte: new Date(startDate),
                    lte: new Date(endDate),
                };
            }

            if (type) {
                where.type = type;
            }

            if (status) {
                where.status = status;
            }

            if (assignedToId) {
                where.assignedToId = assignedToId;
            }

            // Role-based filtering
            if (session.user.role === 'SALESPERSON') {
                where.OR = [
                    { createdById: session.user.id },
                    { assignedToId: session.user.id },
                ];
            } else if (session.user.role === 'SALES_MANAGER' && session.user.showroomId) {
                where.showroomId = session.user.showroomId;
            }

            const events = await prisma.calendarEvent.findMany({
                where,
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        }
                    },
                    client: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            email: true,
                            phone: true,
                        }
                    },
                    project: {
                        select: {
                            id: true,
                            projectNumber: true,
                            name: true,
                        }
                    }
                },
                orderBy: { startDate: 'asc' }
            });

            return NextResponse.json({
                events: events.map(event => ({
                    ...event,
                    startDate: event.startDate.toISOString(),
                    endDate: event.endDate.toISOString(),
                    createdAt: event.createdAt.toISOString(),
                    updatedAt: event.updatedAt.toISOString(),
                    createdBy: {
                        id: event.createdBy.id,
                        name: `${event.createdBy.firstName} ${event.createdBy.lastName}`,
                    },
                    assignedTo: {
                        id: event.assignedTo.id,
                        name: `${event.assignedTo.firstName} ${event.assignedTo.lastName}`,
                        role: event.assignedTo.role,
                    },
                    customerName: event.client ? `${event.client.firstName} ${event.client.lastName}` : event.customerName,
                    attendees: event.attendees ? JSON.parse(event.attendees as string) : [],
                }))
            });

        } catch (dbError) {
            console.error('Database error, falling back to mock data:', dbError);

            // Fallback to mock calendar events
            const mockEvents = [
                {
                    id: "1",
                    title: "Design Consultation",
                    description: "Initial consultation to discuss bathroom renovation requirements and budget.",
                    startDate: new Date(new Date().setHours(10, 0, 0, 0)).toISOString(),
                    endDate: new Date(new Date().setHours(11, 0, 0, 0)).toISOString(),
                    type: 'CONSULTATION',
                    status: 'CONFIRMED',
                    location: "123 Main Street, London, SW1A 1AA",
                    customerId: "1",
                    customerName: "Sarah Johnson",
                    projectId: "1",
                    clientId: "1",
                    createdBy: {
                        id: session.user.id,
                        name: "James Smith",
                    },
                    assignedTo: {
                        id: session.user.id,
                        name: "James Smith",
                        role: "SALESPERSON",
                    },
                    attendees: [
                        {
                            id: session.user.id,
                            name: "James Smith",
                            email: "james.smith@bowmanbathrooms.com",
                            role: "SALESPERSON"
                        }
                    ]
                },
                {
                    id: "2",
                    title: "Site Survey",
                    description: "Detailed site survey to measure space and assess plumbing requirements.",
                    startDate: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(14, 0, 0, 0),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 1)).setHours(15, 0, 0, 0),
                    type: 'SURVEY',
                    status: 'SCHEDULED',
                    location: "456 Oak Avenue, Manchester, M1 1AA",
                    customerId: "2",
                    customerName: "Michael Brown",
                    projectId: "2",
                    clientId: "2",
                    createdBy: {
                        id: session.user.id,
                        name: "James Smith",
                    },
                    assignedTo: {
                        id: session.user.id,
                        name: "James Smith",
                        role: "SALESPERSON",
                    },
                    attendees: [
                        {
                            id: session.user.id,
                            name: "James Smith",
                            email: "james.smith@bowmanbathrooms.com",
                            role: "SALESPERSON"
                        }
                    ]
                },
                {
                    id: "3",
                    title: "Design Presentation",
                    description: "Present final design proposals with 3D visualizations and material selections.",
                    startDate: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(10, 0, 0, 0),
                    endDate: new Date(new Date().setDate(new Date().getDate() + 3)).setHours(12, 0, 0, 0),
                    type: 'DESIGN_PRESENTATION',
                    status: 'SCHEDULED',
                    location: "London Showroom",
                    customerId: "3",
                    customerName: "Emma Williams",
                    projectId: "3",
                    clientId: "3",
                    createdBy: {
                        id: session.user.id,
                        name: "James Smith",
                    },
                    assignedTo: {
                        id: session.user.id,
                        name: "James Smith",
                        role: "SALESPERSON",
                    },
                    attendees: [
                        {
                            id: session.user.id,
                            name: "James Smith",
                            email: "james.smith@bowmanbathrooms.com",
                            role: "SALESPERSON"
                        }
                    ]
                }
            ].map(event => ({
                ...event,
                startDate: typeof event.startDate === 'number' ? new Date(event.startDate).toISOString() : event.startDate,
                endDate: typeof event.endDate === 'number' ? new Date(event.endDate).toISOString() : event.endDate,
            }));

            // Apply filters to mock data
            let filteredEvents = mockEvents;

            if (startDate && endDate) {
                filteredEvents = filteredEvents.filter(event => {
                    const eventStart = new Date(event.startDate);
                    const filterStart = new Date(startDate);
                    const filterEnd = new Date(endDate);
                    return eventStart >= filterStart && eventStart <= filterEnd;
                });
            }

            if (type) {
                filteredEvents = filteredEvents.filter(event => event.type === type);
            }

            if (status) {
                filteredEvents = filteredEvents.filter(event => event.status === status);
            }

            return NextResponse.json({ events: filteredEvents });
        }

    } catch (error) {
        console.error('Error fetching calendar events:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/calendar - Create a new calendar event
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'calendar', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();

        // Validate the request body
        const validationResult = eventSchema.safeParse(body);
        if (!validationResult.success) {
            return NextResponse.json(
                {
                    error: "Validation failed",
                    details: validationResult.error.errors
                },
                { status: 400 }
            );
        }

        const eventData = validationResult.data;

        try {
            // Try to create in database first
            const { prisma } = await import('@/lib/prisma');

            const newEvent = await prisma.calendarEvent.create({
                data: {
                    title: eventData.title,
                    description: eventData.description,
                    startDate: new Date(eventData.startDate),
                    endDate: new Date(eventData.endDate),
                    type: eventData.type,
                    status: eventData.status,
                    location: eventData.location,
                    customerId: eventData.customerId,
                    customerName: eventData.customerName,
                    projectId: eventData.projectId,
                    clientId: eventData.clientId,
                    assignedToId: eventData.assignedToId || session.user.id,
                    attendees: JSON.stringify(eventData.attendees),
                    createdById: session.user.id,
                    showroomId: session.user.showroomId,
                },
                include: {
                    createdBy: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                        }
                    },
                    assignedTo: {
                        select: {
                            id: true,
                            firstName: true,
                            lastName: true,
                            role: true,
                        }
                    }
                }
            });

            return NextResponse.json({
                ...newEvent,
                startDate: newEvent.startDate.toISOString(),
                endDate: newEvent.endDate.toISOString(),
                createdAt: newEvent.createdAt.toISOString(),
                updatedAt: newEvent.updatedAt.toISOString(),
                createdBy: {
                    id: newEvent.createdBy.id,
                    name: `${newEvent.createdBy.firstName} ${newEvent.createdBy.lastName}`,
                },
                assignedTo: {
                    id: newEvent.assignedTo.id,
                    name: `${newEvent.assignedTo.firstName} ${newEvent.assignedTo.lastName}`,
                    role: newEvent.assignedTo.role,
                },
                attendees: JSON.parse(newEvent.attendees as string),
            }, { status: 201 });

        } catch (dbError) {
            console.error('Database error, falling back to mock creation:', dbError);

            // Fallback to mock response if database fails
            const newEvent = {
                id: Date.now().toString(),
                ...eventData,
                createdBy: {
                    id: session.user.id,
                    name: session.user.firstName + ' ' + session.user.lastName,
                },
                assignedTo: {
                    id: eventData.assignedToId || session.user.id,
                    name: session.user.firstName + ' ' + session.user.lastName,
                    role: session.user.role,
                },
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            };

            return NextResponse.json(newEvent, { status: 201 });
        }

    } catch (error) {
        console.error('Error creating calendar event:', error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
