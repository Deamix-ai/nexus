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

    // Mock client data - in real implementation, fetch from database
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
        createdAt: new Date("2024-01-15"),
        updatedAt: new Date("2024-01-15"),
        projects: [
          {
            id: "1",
            projectNumber: "2024-001",
            name: "Master Ensuite Renovation",
            status: "ACTIVE",
            stage: "DESIGN_PRESENTED",
            estimatedValue: 12500,
            actualValue: null,
            enquiryDate: new Date("2024-01-15"),
            consultationDate: new Date("2024-01-20"),
            designPresentedDate: new Date("2024-02-01"),
            createdAt: new Date("2024-01-15"),
            updatedAt: new Date("2024-02-01")
          }
        ],
        activities: [
          {
            id: "1",
            type: "CONSULTATION",
            subject: "Initial consultation completed",
            description: "Met with client to discuss requirements for master ensuite renovation. Showed portfolio of similar projects.",
            date: new Date("2024-01-20"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          },
          {
            id: "2",
            type: "EMAIL",
            subject: "Design presentation scheduled",
            description: "Sent email to client with design appointment confirmation for February 1st.",
            date: new Date("2024-01-25"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          },
          {
            id: "3",
            type: "DESIGN_REVIEW",
            subject: "Design presented to client",
            description: "Presented 3D designs and material samples. Client very positive about the proposal. Requested minor modifications to lighting.",
            date: new Date("2024-02-01"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
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
        createdAt: new Date("2024-02-01"),
        updatedAt: new Date("2024-02-01"),
        projects: [
          {
            id: "2",
            projectNumber: "2024-002",
            name: "Family Bathroom Upgrade",
            status: "ACTIVE",
            stage: "SURVEY_COMPLETE",
            estimatedValue: 8500,
            actualValue: null,
            enquiryDate: new Date("2024-02-01"),
            consultationDate: new Date("2024-02-05"),
            surveyDate: new Date("2024-02-10"),
            createdAt: new Date("2024-02-01"),
            updatedAt: new Date("2024-02-10")
          }
        ],
        activities: [
          {
            id: "4",
            type: "CALL",
            subject: "Initial phone enquiry",
            description: "Client called about family bathroom renovation with accessibility features. Arranged consultation.",
            date: new Date("2024-02-01"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          },
          {
            id: "5",
            type: "CONSULTATION",
            subject: "Home consultation completed",
            description: "Visited client's home to assess current bathroom and discuss accessibility requirements. Measured space and took photos.",
            date: new Date("2024-02-05"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          },
          {
            id: "6",
            type: "SURVEY",
            subject: "Technical survey completed",
            description: "Completed detailed survey of bathroom space. Identified plumbing requirements for accessibility shower installation.",
            date: new Date("2024-02-10"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
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
        createdAt: new Date("2024-02-15"),
        updatedAt: new Date("2024-02-15"),
        projects: [
          {
            id: "3",
            projectNumber: "2024-003",
            name: "Downstairs Cloakroom",
            status: "ACTIVE",
            stage: "SURVEY_COMPLETE",
            estimatedValue: 4200,
            actualValue: null,
            enquiryDate: new Date("2024-02-15"),
            consultationDate: new Date("2024-02-18"),
            surveyDate: new Date("2024-02-22"),
            createdAt: new Date("2024-02-15"),
            updatedAt: new Date("2024-02-22")
          }
        ],
        activities: [
          {
            id: "7",
            type: "CONSULTATION",
            subject: "Showroom consultation",
            description: "Client visited Birmingham showroom. Discussed compact cloakroom solutions and viewed display models.",
            date: new Date("2024-02-15"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          },
          {
            id: "8",
            type: "SITE_VISIT",
            subject: "Home visit for survey",
            description: "Visited client's home to survey the downstairs cloakroom space. Very compact area requiring creative design solutions.",
            date: new Date("2024-02-22"),
            createdBy: {
              firstName: "James",
              lastName: "Smith"
            }
          }
        ]
      }
    };

    const client = mockClients[id];
    
    if (!client) {
      return NextResponse.json({ error: "Client not found" }, { status: 404 });
    }

    // Role-based access control (if needed)
    if (session.user.role === 'SALESPERSON' && session.user.showroomId) {
      // In real implementation, check if client belongs to user's showroom
    }

    return NextResponse.json({ client });

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
