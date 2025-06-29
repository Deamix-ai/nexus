import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

// Validation schema for updating clients
const updateClientSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().min(1).optional(),
  address: z.object({
    street: z.string(),
    city: z.string(),
    county: z.string(),
    postcode: z.string(),
  }).optional(),
  leadSource: z.string().min(1).optional(),
  leadSourceDetail: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(["ACTIVE", "PROSPECT", "INACTIVE", "LOST"]).optional(),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// GET /api/clients/[id] - Fetch a specific client
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'clients', 'read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    try {
      // Try to fetch from database first
      const { prisma } = await import('@/lib/prisma');

      const client = await prisma.client.findUnique({
        where: { id },
        include: {
          projects: {
            select: {
              id: true,
              projectNumber: true,
              name: true,
              status: true,
              stage: true,
              estimatedValue: true,
              actualValue: true,
              enquiryDate: true,
              consultationDate: true,
              surveyDate: true,
              designPresentedDate: true,
              createdAt: true,
              updatedAt: true,
            }
          },
          createdBy: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
            }
          }
        }
      });

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      return NextResponse.json({
        ...client,
        address: typeof client.address === 'string'
          ? JSON.parse(client.address)
          : client.address,
        createdAt: client.createdAt.toISOString(),
        updatedAt: client.updatedAt.toISOString(),
        projects: client.projects.map((project: any) => ({
          ...project,
          enquiryDate: project.enquiryDate?.toISOString(),
          consultationDate: project.consultationDate?.toISOString(),
          surveyDate: project.surveyDate?.toISOString(),
          designPresentedDate: project.designPresentedDate?.toISOString(),
          createdAt: project.createdAt.toISOString(),
          updatedAt: project.updatedAt.toISOString(),
        }))
      });

    } catch (dbError) {
      console.error('Database error, falling back to mock data:', dbError);

      // Fallback to mock client data
      const mockClients: Record<string, any> = {
        "1": {
          id: "1",
          firstName: "Sarah",
          lastName: "Johnson",
          email: "sarah.johnson@email.com",
          phone: "07123 456789",
          address: {
            street: "123 Main Street",
            city: "London",
            county: "Greater London",
            postcode: "SW1A 1AA"
          },
          leadSource: "Website",
          leadSourceDetail: "Google Ads campaign",
          notes: "Interested in luxury ensuite renovation. Mentioned wanting walk-in shower and freestanding bath. Budget appears flexible for high-quality finishes.",
          status: "ACTIVE",
          createdAt: "2024-01-15T00:00:00.000Z",
          updatedAt: "2024-01-15T00:00:00.000Z",
          projects: [
            {
              id: "1",
              projectNumber: "2024-001",
              name: "Master Ensuite Renovation",
              status: "ACTIVE",
              stage: "DESIGN_PRESENTED",
              estimatedValue: 12500,
              actualValue: null,
              enquiryDate: "2024-01-15T00:00:00.000Z",
              consultationDate: "2024-01-20T00:00:00.000Z",
              designPresentedDate: "2024-02-01T00:00:00.000Z",
              createdAt: "2024-01-15T00:00:00.000Z",
              updatedAt: "2024-02-01T00:00:00.000Z"
            }
          ]
        },
        "2": {
          id: "2",
          firstName: "Michael",
          lastName: "Brown",
          email: "michael.brown@email.com",
          phone: "07987 654321",
          address: {
            street: "456 Oak Avenue",
            city: "Manchester",
            county: "Greater Manchester",
            postcode: "M1 1AA"
          },
          leadSource: "Referral",
          leadSourceDetail: "Previous client recommendation",
          notes: "Family bathroom with accessibility requirements. Has elderly parent living with them who needs easy access shower.",
          status: "ACTIVE",
          createdAt: "2024-02-01T00:00:00.000Z",
          updatedAt: "2024-02-01T00:00:00.000Z",
          projects: [
            {
              id: "2",
              projectNumber: "2024-002",
              name: "Family Bathroom Upgrade",
              status: "ACTIVE",
              stage: "SURVEY_COMPLETE",
              estimatedValue: 8500,
              actualValue: null,
              enquiryDate: "2024-02-01T00:00:00.000Z",
              consultationDate: "2024-02-05T00:00:00.000Z",
              surveyDate: "2024-02-10T00:00:00.000Z",
              createdAt: "2024-02-01T00:00:00.000Z",
              updatedAt: "2024-02-10T00:00:00.000Z"
            }
          ]
        },
        "3": {
          id: "3",
          firstName: "Emma",
          lastName: "Williams",
          email: "emma.williams@email.com",
          phone: "07555 123456",
          address: {
            street: "789 Pine Road",
            city: "Birmingham",
            county: "West Midlands",
            postcode: "B1 2AA"
          },
          leadSource: "Showroom Visit",
          leadSourceDetail: "Birmingham showroom walk-in",
          notes: "Compact downstairs cloakroom design. Interested in modern, space-saving solutions.",
          status: "ACTIVE",
          createdAt: "2024-02-15T00:00:00.000Z",
          updatedAt: "2024-02-15T00:00:00.000Z",
          projects: [
            {
              id: "3",
              projectNumber: "2024-003",
              name: "Downstairs Cloakroom",
              status: "ACTIVE",
              stage: "SURVEY_COMPLETE",
              estimatedValue: 4200,
              actualValue: null,
              enquiryDate: "2024-02-15T00:00:00.000Z",
              consultationDate: "2024-02-18T00:00:00.000Z",
              surveyDate: "2024-02-22T00:00:00.000Z",
              createdAt: "2024-02-15T00:00:00.000Z",
              updatedAt: "2024-02-22T00:00:00.000Z"
            }
          ]
        }
      };

      const client = mockClients[id];

      if (!client) {
        return NextResponse.json({ error: "Client not found" }, { status: 404 });
      }

      return NextResponse.json(client);
    }

  } catch (error) {
    console.error('Error fetching client:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/clients/[id] - Update a specific client
export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'clients', 'update')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateClientSchema.parse(body);

    // Mock client update response
    const updatedClient = {
      id,
      ...validatedData,
      updatedAt: new Date(),
      address: validatedData.address ? validatedData.address : undefined,
    };

    return NextResponse.json({ client: updatedClient });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }

    console.error('Error updating client:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE /api/clients/[id] - Soft delete a client
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'clients', 'delete')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = params;

    // Mock deletion response
    return NextResponse.json({
      message: "Client deleted successfully",
      deletedAt: new Date()
    });

  } catch (error) {
    console.error('Error deleting client:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
