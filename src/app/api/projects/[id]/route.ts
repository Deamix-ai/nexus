import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for updating projects
const updateProjectSchema = z.object({
  name: z.string().min(1).optional(),
  clientName: z.string().min(1).optional(),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(1).optional(),
  clientAddress: z.object({
    street: z.string(),
    city: z.string(),
    county: z.string(),
    postcode: z.string(),
  }).optional(),
  leadSource: z.string().min(1).optional(),
  leadSourceDetail: z.string().optional(),
  description: z.string().optional(),
  estimatedValue: z.number().positive().optional(),
  status: z.enum(["ACTIVE", "ON_HOLD", "CANCELLED", "COMPLETED"]).optional(),
  stage: z.enum([
    "ENQUIRY", "ENGAGED_ENQUIRY", "CONSULTATION_BOOKED", "QUALIFIED_LEAD",
    "SURVEY_COMPLETE", "DESIGN_PRESENTED", "SALE_CLIENT_COMMITS", "DESIGN_SIGN_OFF",
    "PAYMENT_75_PROJECT_HANDOVER", "PROJECT_SCHEDULED", "INSTALLATION_IN_PROGRESS",
    "COMPLETION_SIGN_OFF", "COMPLETED", "LOST_NOT_PROCEEDING"
  ]).optional(),
  priority: z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]).optional(),
  consultationDate: z.string().optional(),
  surveyDate: z.string().optional(),
  designPresentedDate: z.string().optional(),
  saleDate: z.string().optional(),
  scheduledStartDate: z.string().optional(),
  actualStartDate: z.string().optional(),
  scheduledEndDate: z.string().optional(),
  actualEndDate: z.string().optional(),
  assignedUserId: z.string().optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/projects/[id] - Fetch a specific project
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'projects', 'read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // For now, return mock data since database migration isn't complete
    const mockProjects: Record<string, any> = {
      "1": {
        id: "1",
        projectNumber: "2024-001",
        name: "Master Ensuite Renovation",
        status: "ACTIVE",
        stage: "DESIGN_PRESENTED",
        priority: "MEDIUM",
        clientName: "Sarah Johnson",
        clientEmail: "sarah.johnson@email.com",
        clientPhone: "07123 456789",
        clientAddress: {
          street: "123 Main Street",
          city: "London",
          county: "Greater London",
          postcode: "SW1A 1AA"
        },
        leadSource: "Website",
        leadSourceDetail: "Google Ads campaign",
        description: "Complete master ensuite renovation with luxury finishes including walk-in shower, freestanding bath, and premium tiling",
        estimatedValue: 12500,
        actualValue: null,
        margin: 35.5,
        enquiryDate: new Date("2024-01-15"),
        consultationDate: new Date("2024-01-20"),
        surveyDate: new Date("2024-01-25"),
        designPresentedDate: new Date("2024-02-01"),
        scheduledStartDate: new Date("2024-03-01"),
        scheduledEndDate: new Date("2024-03-15"),
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-02-01"),
        tags: ["luxury", "ensuite", "walk-in-shower"],
        assignedUser: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
          email: "james.smith@bowmanbathrooms.com",
          phone: "020 1234 5678"
        },
        createdBy: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
        },
        showroom: {
          id: "1",
          name: "London Showroom",
          address: "123 Showroom Street, London, SW1A 1AA",
          phone: "020 1234 5678",
          email: "london@bowmanbathrooms.com"
        }
      },
      "2": {
        id: "2",
        projectNumber: "2024-002", 
        name: "Family Bathroom Upgrade",
        status: "ACTIVE",
        stage: "SURVEY_COMPLETE",
        priority: "HIGH",
        clientName: "Michael Brown",
        clientEmail: "michael.brown@email.com",
        clientPhone: "07987 654321",
        clientAddress: {
          street: "456 Oak Avenue",
          city: "Manchester",
          county: "Greater Manchester", 
          postcode: "M1 1AA"
        },
        leadSource: "Referral",
        leadSourceDetail: "Referred by previous client",
        description: "Modern family bathroom with accessibility features including grab rails and easy-access shower",
        estimatedValue: 8500,
        actualValue: null,
        margin: 32.0,
        enquiryDate: new Date("2024-02-01"),
        consultationDate: new Date("2024-02-05"),
        surveyDate: new Date("2024-02-10"),
        scheduledStartDate: new Date("2024-02-28"),
        scheduledEndDate: new Date("2024-03-10"),
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-10"),
        tags: ["family", "accessibility", "modern"],
        assignedUser: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
          email: "james.smith@bowmanbathrooms.com",
          phone: "020 1234 5678"
        },
        createdBy: {
          id: session.user.id,
          firstName: "James",
          lastName: "Smith",
        },
        showroom: {
          id: "1",
          name: "London Showroom",
          address: "123 Showroom Street, London, SW1A 1AA",
          phone: "020 1234 5678",
          email: "london@bowmanbathrooms.com"
        }
      }
    };

    const project = mockProjects[id];
    
    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    // Role-based access control
    if (session.user.role === 'SALESPERSON') {
      if (project.createdById !== session.user.id && project.assignedUserId !== session.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    return NextResponse.json({ project });

  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/projects/[id] - Update a specific project
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'projects', 'update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateProjectSchema.parse(body);

    // For now, return a mock response since database migration isn't complete
    const updatedProject = {
      id,
      projectNumber: "2024-001",
      ...validatedData,
      updatedAt: new Date(),
      clientAddress: validatedData.clientAddress ? JSON.stringify(validatedData.clientAddress) : undefined,
    };

    return NextResponse.json({ project: updatedProject });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating project:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/projects/[id] - Soft delete a project
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'projects', 'delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // For now, return a mock response since database migration isn't complete
    return NextResponse.json({ 
      message: "Project deleted successfully",
      deletedAt: new Date()
    });

  } catch (error) {
    console.error('Error deleting project:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
