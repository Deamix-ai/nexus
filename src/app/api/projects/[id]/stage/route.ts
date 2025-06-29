import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { z } from "zod";

const stageUpdateSchema = z.object({
  stage: z.enum([
    "ENQUIRY", "ENGAGED_ENQUIRY", "CONSULTATION_BOOKED", "QUALIFIED_LEAD",
    "SURVEY_COMPLETE", "DESIGN_PRESENTED", "SALE_CLIENT_COMMITS", "DESIGN_SIGN_OFF",
    "PAYMENT_75_PROJECT_HANDOVER", "PROJECT_SCHEDULED", "INSTALLATION_IN_PROGRESS",
    "COMPLETION_SIGN_OFF", "COMPLETED", "LOST_NOT_PROCEEDING"
  ]),
});

interface RouteParams {
  params: {
    id: string;
  };
}

// PUT /api/projects/[id]/stage - Update project stage
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
    const { stage } = stageUpdateSchema.parse(body);

    // For now, return a mock response since database migration isn't complete
    // In the future, this would update the project stage in the database
    // and create an audit log entry for the stage change

    const updatedProject = {
      id,
      stage,
      updatedAt: new Date(),
      stageHistory: [
        {
          stage,
          changedAt: new Date(),
          changedBy: session.user.id,
          changedByName: session.user.name || session.user.email,
        }
      ]
    };

    // Auto-update related dates based on stage
    const stageUpdates: Record<string, any> = {};
    
    switch (stage) {
      case 'CONSULTATION_BOOKED':
        stageUpdates.consultationDate = new Date();
        break;
      case 'SURVEY_COMPLETE':
        stageUpdates.surveyDate = new Date();
        break;
      case 'DESIGN_PRESENTED':
        stageUpdates.designPresentedDate = new Date();
        break;
      case 'SALE_CLIENT_COMMITS':
        stageUpdates.saleDate = new Date();
        break;
      case 'INSTALLATION_IN_PROGRESS':
        stageUpdates.actualStartDate = new Date();
        break;
      case 'COMPLETED':
        stageUpdates.actualEndDate = new Date();
        stageUpdates.status = 'COMPLETED';
        break;
      case 'LOST_NOT_PROCEEDING':
        stageUpdates.status = 'CANCELLED';
        break;
    }

    return NextResponse.json({ 
      project: { ...updatedProject, ...stageUpdates },
      message: `Project stage updated to ${stage.replace(/_/g, ' ')}`
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid stage", details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error updating project stage:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
