import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { hasPermission } from "@/lib/permissions";
import { communicationService } from "@/lib/communication-providers";

// GET /api/communications/test - Test communication providers
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'messages', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const providersStatus = await communicationService.testProviders();

        const status = {
            providers: {
                email: {
                    available: providersStatus.email,
                    sendgrid: !!process.env.SENDGRID_API_KEY,
                    smtp: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
                },
                sms: {
                    available: providersStatus.sms,
                    twilio: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
                }
            },
            environment: {
                sendgridConfigured: !!process.env.SENDGRID_API_KEY,
                smtpConfigured: !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS),
                twilioConfigured: !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN),
            }
        };

        return NextResponse.json(status);

    } catch (error) {
        console.error("Error testing communication providers:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}

// POST /api/communications/test - Send test messages
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!hasPermission(session.user.role, 'messages', 'create')) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { type, to } = body;

        let result;

        if (type === 'email') {
            if (!to || !to.includes('@')) {
                return NextResponse.json({ error: "Valid email address required" }, { status: 400 });
            }

            result = await communicationService.sendEmail({
                to,
                subject: 'Test Email from Nexus CRM',
                body: 'This is a test email sent from the Nexus CRM Communication Hub to verify email functionality.',
                htmlBody: `
          <h2>Test Email from Nexus CRM</h2>
          <p>This is a test email sent from the Nexus CRM Communication Hub to verify email functionality.</p>
          <p><strong>Sent by:</strong> ${session.user.name} (${session.user.email})</p>
          <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
          <hr>
          <p><em>This is an automated test message from Bowman Bathrooms CRM system.</em></p>
        `,
                from: session.user.email,
            });
        } else if (type === 'sms') {
            if (!to || !to.startsWith('+')) {
                return NextResponse.json({ error: "Valid phone number required (must start with +)" }, { status: 400 });
            }

            result = await communicationService.sendSMS({
                to,
                body: `Test SMS from Nexus CRM - This message confirms SMS functionality is working. Sent by ${session.user.name} at ${new Date().toLocaleString()}`,
            });
        } else {
            return NextResponse.json({ error: "Invalid test type. Use 'email' or 'sms'" }, { status: 400 });
        }

        return NextResponse.json({
            success: result.success,
            message: result.success ? 'Test message sent successfully' : 'Failed to send test message',
            details: result
        });

    } catch (error) {
        console.error("Error sending test message:", error);
        return NextResponse.json(
            { error: "Internal server error" },
            { status: 500 }
        );
    }
}
