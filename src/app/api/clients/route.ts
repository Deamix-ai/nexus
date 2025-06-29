import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

// Validation schema for creating/updating clients
const clientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone number is required"),
  address: z.object({
    street: z.string().min(1, "Street is required"),
    city: z.string().min(1, "City is required"),
    county: z.string().min(1, "County is required"),
    postcode: z.string().min(1, "Postcode is required"),
  }),
  leadSource: z.string().min(1, "Lead source is required"),
  leadSourceDetail: z.string().optional(),
  notes: z.string().optional(),
});

// GET /api/clients - Fetch clients with filtering and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'clients', 'read')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '12');
    const search = searchParams.get('search') || '';
    
    const offset = (page - 1) * limit;

    // Mock clients data
    const mockClients = [
      {
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
        leadSourceDetail: "Google Ads",
        notes: "Interested in luxury ensuite renovation",
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
            estimatedValue: 12500
          }
        ]
      },
      {
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
        notes: "Family bathroom with accessibility requirements",
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
            estimatedValue: 8500
          }
        ]
      },
      {
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
        leadSourceDetail: "Birmingham showroom",
        notes: "Compact downstairs cloakroom design",
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
            estimatedValue: 4200
          }
        ]
      },
      {
        id: "4",
        firstName: "James",
        lastName: "Wilson",
        email: "james.wilson@email.com",
        phone: "07888 999000",
        address: {
          street: "321 Cedar Close",
          city: "Leeds",
          county: "West Yorkshire", 
          postcode: "LS1 3AA"
        },
        leadSource: "Phone Enquiry",
        leadSourceDetail: "Called main office",
        notes: "Complete bathroom suite replacement",
        status: "PROSPECT",
        createdAt: new Date("2024-03-01"),
        updatedAt: new Date("2024-03-01"),
        projects: []
      },
      {
        id: "5",
        firstName: "Lucy",
        lastName: "Davis",
        email: "lucy.davis@email.com",
        phone: "07444 555666",
        address: {
          street: "567 Elm Grove",
          city: "Bristol",
          county: "Bristol",
          postcode: "BS1 4AA"
        },
        leadSource: "Facebook Ads",
        leadSourceDetail: "Home renovation campaign",
        notes: "Modern minimalist design preference",
        status: "PROSPECT",
        createdAt: new Date("2024-03-10"),
        updatedAt: new Date("2024-03-10"),
        projects: []
      },
      {
        id: "6",
        firstName: "David",
        lastName: "Taylor",
        email: "david.taylor@email.com",
        phone: "07777 888999",
        address: {
          street: "890 Birch Lane",
          city: "Liverpool",
          county: "Merseyside",
          postcode: "L1 5AA"
        },
        leadSource: "Referral",
        leadSourceDetail: "Word of mouth",
        notes: "Previous good experience with company",
        status: "ACTIVE",
        createdAt: new Date("2024-01-20"),
        updatedAt: new Date("2024-01-20"),
        projects: []
      }
    ];

    // Apply search filter
    let filteredClients = mockClients;
    
    if (search) {
      filteredClients = filteredClients.filter(client => 
        client.firstName.toLowerCase().includes(search.toLowerCase()) ||
        client.lastName.toLowerCase().includes(search.toLowerCase()) ||
        client.email.toLowerCase().includes(search.toLowerCase()) ||
        client.phone.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Role-based filtering
    if (session.user.role === 'SALESPERSON' && session.user.showroomId) {
      // Filter by showroom if needed - for now, show all
    }

    const total = filteredClients.length;
    const clients = filteredClients.slice(offset, offset + limit);

    return NextResponse.json({
      clients,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      }
    });

  } catch (error) {
    console.error('Error fetching clients:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST /api/clients - Create a new client
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!hasPermission(session.user.role, 'clients', 'create')) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = clientSchema.parse(body);

    // Mock client creation response
    const mockClient = {
      id: `client_${Date.now()}`,
      ...validatedData,
      status: "PROSPECT",
      createdAt: new Date(),
      updatedAt: new Date(),
      projects: []
    };

    return NextResponse.json({ client: mockClient }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error creating client:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
