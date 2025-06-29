import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for creating/updating projects
const projectSchema = z.object({
  name: z.string().min(1, "Project name is required"),
  clientName: z.string().min(1, "Client name is required"),
  clientEmail: z.string().email("Valid email is required"),
  clientPhone: z.string().min(1, "Client phone is required"),
  clientAddress: z.object({
    street: z.string(),
    city: z.string(),
    county: z.string(),
    postcode: z.string(),
  }),
  leadSource: z.string().min(1, "Lead source is required"),
  leadSourceDetail: z.string().optional(),
  description: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  consultationDate: z.string().optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).default("MEDIUM"),
});

// GET /api/projects - Fetch projects with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'projects', 'read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status') || '';
    const stage = searchParams.get('stage') || '';
    const assignedUserId = searchParams.get('assignedUserId') || '';

    const offset = (page - 1) * limit;

    // Build where clause
    const where: any = {
      deletedAt: null,
    };

    // Add search filter
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { clientName: { contains: search } },
        { clientEmail: { contains: search } },
        { projectNumber: { contains: search } },
      ];
    }

    // Add status filter
    if (status) {
      where.status = status;
    }

    // Add stage filter  
    if (stage) {
      where.stage = stage;
    }

    // Add assigned user filter
    if (assignedUserId) {
      where.assignedUserId = assignedUserId;
    }

    // Role-based filtering
    if (session.user.role === 'SALESPERSON') {
      where.OR = [
        { createdById: session.user.id },
        { assignedUserId: session.user.id },
      ];
    } else if (session.user.role === 'SALES_MANAGER' && session.user.showroomId) {
      where.showroomId = session.user.showroomId;
    }

    // For now, return mock data since we haven't migrated the database yet
    const mockProjects = [
      {
        id: "1",
        projectNumber: "2024-001",
        name: "Master Ensuite Renovation",
        status: "ACTIVE",
        stage: "DESIGN_PRESENTED",
        priority: "MEDIUM",
        clientName: "Sarah Johnson",
        clientEmail: "sarah.johnson@email.com",
        clientPhone: "07123 456789",
        clientAddress: "123 Main St, London",
        leadSource: "Website",
        description: "Complete master ensuite renovation with luxury finishes",
        estimatedValue: 12500,
        enquiryDate: new Date("2024-01-15"),
        consultationDate: new Date("2024-01-20"),
        designPresentedDate: new Date("2024-02-01"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-01"),
        assignedUser: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
        },
        showroom: {
          id: "1",
          name: "London Showroom",
        }
      },
      {
        id: "2",
        projectNumber: "2024-002",
        name: "Family Bathroom Upgrade",
        status: "ACTIVE",
        stage: "SURVEY_COMPLETE",
        priority: "HIGH",
        clientName: "Michael Brown",
        clientEmail: "michael.brown@email.com",
        clientPhone: "07987 654321",
        clientAddress: "456 Oak Avenue, Manchester",
        leadSource: "Referral",
        description: "Modern family bathroom with accessibility features",
        estimatedValue: 8500,
        enquiryDate: new Date("2024-02-01"),
        surveyDate: new Date("2024-02-10"),
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-10"),
        assignedUser: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
        },
        showroom: {
          id: "1",
          name: "London Showroom",
        }
      }
    ];

    // Apply filters to mock data
    let filteredProjects = mockProjects;

    if (search) {
      filteredProjects = filteredProjects.filter(p =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.clientName.toLowerCase().includes(search.toLowerCase()) ||
        p.clientEmail.toLowerCase().includes(search.toLowerCase()) ||
        p.projectNumber.toLowerCase().includes(search.toLowerCase())
      );
    }

    if (status) {
      filteredProjects = filteredProjects.filter(p => p.status === status);
    }

    if (stage) {
      filteredProjects = filteredProjects.filter(p => p.stage === stage);
    }

    const total = filteredProjects.length;
    const projects = filteredProjects.slice(offset, offset + limit);

    return NextResponse.json({
      projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching projects:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/projects - Create a new project
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'projects', 'create')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = projectSchema.parse(body);

    // For now, return a mock response since database migration isn't complete
    const mockProject = {
      id: `proj_${Date.now()}`,
      projectNumber: `2024-${String(Math.floor(Math.random() * 1000)).padStart(3, '0')}`,
      ...validatedData,
      status: "ACTIVE",
      stage: "ENQUIRY",
      clientAddress: JSON.stringify(validatedData.clientAddress),
      enquiryDate: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      createdById: session.user.id,
      showroomId: session.user.showroomId || "1",
      assignedUserId: session.user.id,
    };

    return NextResponse.json(mockProject, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error creating project:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
