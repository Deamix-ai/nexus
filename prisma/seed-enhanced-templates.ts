import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function addEnhancedTemplates() {
    console.log('📧 Adding enhanced message templates...')

    // Get the first showroom for templates
    const showroom = await prisma.showroom.findFirst()
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })

    if (!showroom || !adminUser) {
        console.log('❌ No showroom or admin user found')
        return
    }

    // Enhanced email templates with variables
    const emailTemplates = [
        {
            name: 'Initial Consultation Confirmation',
            description: 'Sent when a consultation is scheduled',
            type: 'EMAIL' as const,
            category: 'Consultation',
            subject: 'Your Bathroom Consultation with {{company_name}} - {{current_date}}',
            body: `Dear {{client_first_name}},

Thank you for choosing {{company_name}} for your bathroom renovation project!

This email confirms your consultation appointment details:

📅 Date: {{current_date}}
🏢 Showroom: {{showroom_name}}
📍 Address: {{showroom_address}}
📞 Contact: {{showroom_phone}}

What to expect:
• Detailed discussion of your requirements
• Design ideas and inspiration
• Material and fixture options
• Preliminary cost estimates
• Next steps in the process

If you have any questions before your appointment, please don't hesitate to contact us.

Best regards,
{{user_first_name}} {{user_last_name}}
{{company_name}}
{{showroom_phone}}`,
            htmlBody: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Your Bathroom Consultation with {{company_name}}</h2>
          
          <p>Dear {{client_first_name}},</p>
          
          <p>Thank you for choosing <strong>{{company_name}}</strong> for your bathroom renovation project!</p>
          
          <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #374151;">Consultation Details</h3>
            <p><strong>📅 Date:</strong> {{current_date}}</p>
            <p><strong>🏢 Showroom:</strong> {{showroom_name}}</p>
            <p><strong>📍 Address:</strong> {{showroom_address}}</p>
            <p><strong>📞 Contact:</strong> {{showroom_phone}}</p>
          </div>
          
          <h3 style="color: #374151;">What to expect:</h3>
          <ul>
            <li>Detailed discussion of your requirements</li>
            <li>Design ideas and inspiration</li>
            <li>Material and fixture options</li>
            <li>Preliminary cost estimates</li>
            <li>Next steps in the process</li>
          </ul>
          
          <p>If you have any questions before your appointment, please don't hesitate to contact us.</p>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
            <p>Best regards,<br>
            <strong>{{user_first_name}} {{user_last_name}}</strong><br>
            {{company_name}}<br>
            {{showroom_phone}}</p>
          </div>
        </div>
      `,
            variables: JSON.stringify(['client_first_name', 'current_date', 'company_name', 'showroom_name', 'showroom_address', 'showroom_phone', 'user_first_name', 'user_last_name']),
            isActive: true,
            isDefault: true,
            triggerEvents: JSON.stringify(['consultation_scheduled'])
        },
        {
            name: 'Quote Ready Notification',
            description: 'Sent when a quote is ready for review',
            type: 'EMAIL' as const,
            category: 'Sales',
            subject: 'Your Bathroom Quote is Ready - {{project_name}}',
            body: `Dear {{client_first_name}},

Great news! Your personalized bathroom renovation quote is now ready for review.

Project Details:
🛁 Project: {{project_name}}
💷 Estimated Value: {{project_value}}
📋 Description: {{project_description}}

Your quote includes:
• Detailed breakdown of all costs
• High-quality materials and fixtures
• Professional installation services
• Project timeline and milestones
• Our comprehensive warranty

To review your quote, please visit our showroom or we can schedule a convenient time to discuss it over the phone.

This quote is valid for 30 days from {{current_date}}.

We're excited to help transform your bathroom into the space of your dreams!

Best regards,
{{user_first_name}} {{user_last_name}}
{{company_name}}
{{user_email}}`,
            variables: JSON.stringify(['client_first_name', 'project_name', 'project_value', 'project_description', 'current_date', 'user_first_name', 'user_last_name', 'company_name', 'user_email']),
            isActive: true,
            isDefault: false,
            triggerEvents: JSON.stringify(['quote_ready'])
        },
        {
            name: 'Installation Schedule Confirmation',
            description: 'Sent when installation is scheduled',
            type: 'EMAIL' as const,
            category: 'Installation',
            subject: 'Installation Scheduled - {{project_name}}',
            body: `Dear {{client_first_name}},

Your bathroom installation has been scheduled! We're excited to bring your new bathroom to life.

Installation Details:
🛁 Project: {{project_name}} ({{project_number}})
📅 Start Date: {{current_date}}
⏰ Estimated Duration: Based on project scope
👷 Our professional installation team will handle everything

Before we begin:
• Please ensure clear access to the bathroom
• Remove any personal items from the area
• Our team will protect surrounding areas
• We'll provide daily progress updates

Contact Information:
📞 Project Manager: {{user_first_name}} {{user_last_name}}
📧 Email: {{user_email}}
☎️ Showroom: {{showroom_phone}}

Thank you for choosing {{company_name}}!

Best regards,
{{user_first_name}} {{user_last_name}}`,
            variables: JSON.stringify(['client_first_name', 'project_name', 'project_number', 'current_date', 'user_first_name', 'user_last_name', 'user_email', 'showroom_phone', 'company_name']),
            isActive: true,
            isDefault: false,
            triggerEvents: JSON.stringify(['installation_scheduled'])
        }
    ]

    // SMS Templates
    const smsTemplates = [
        {
            name: 'Appointment Reminder',
            description: 'SMS reminder for upcoming appointments',
            type: 'SMS' as const,
            category: 'Reminder',
            subject: null,
            body: 'Hi {{client_first_name}}, this is a reminder about your appointment with {{company_name}} tomorrow. Contact us on {{showroom_phone}} if you need to reschedule.',
            variables: JSON.stringify(['client_first_name', 'company_name', 'showroom_phone']),
            isActive: true,
            isDefault: true,
            triggerEvents: JSON.stringify(['appointment_reminder'])
        },
        {
            name: 'Installation Team Arrival',
            description: 'SMS sent when installation team is on the way',
            type: 'SMS' as const,
            category: 'Installation',
            subject: null,
            body: 'Good morning {{client_first_name}}! Our installation team will arrive between 8-9am for your {{project_name}} project. Team leader: {{user_first_name}}. Any questions? Call {{showroom_phone}}.',
            variables: JSON.stringify(['client_first_name', 'project_name', 'user_first_name', 'showroom_phone']),
            isActive: true,
            isDefault: false,
            triggerEvents: JSON.stringify(['team_dispatched'])
        }
    ]

    // Internal note templates
    const internalTemplates = [
        {
            name: 'Project Handover Notes',
            description: 'Internal notes for project handover between stages',
            type: 'INTERNAL_NOTE' as const,
            category: 'Project Management',
            subject: 'Project Handover - {{project_name}}',
            body: `Project handover notes for {{project_name}} ({{project_number}})

Client: {{client_full_name}}
Current Stage: {{project_stage}}
Project Value: {{project_value}}

Key Points:
• [Add specific notes about client preferences]
• [Material selections and special requirements]
• [Timeline considerations]
• [Any challenges or concerns]

Next Actions:
• [List required follow-up actions]

Handover by: {{user_full_name}}
Date: {{current_date}}`,
            variables: JSON.stringify(['project_name', 'project_number', 'client_full_name', 'project_stage', 'project_value', 'user_full_name', 'current_date']),
            isActive: true,
            isDefault: false,
            triggerEvents: JSON.stringify(['stage_change'])
        }
    ]

    // Create all templates
    const allTemplates = [...emailTemplates, ...smsTemplates, ...internalTemplates]

    for (const template of allTemplates) {
        await prisma.messageTemplate.create({
            data: {
                ...template,
                createdById: adminUser.id,
                showroomId: showroom.id,
            }
        })
    }

    console.log(`✅ Created ${allTemplates.length} enhanced message templates`)
}

// Run if called directly
if (require.main === module) {
    addEnhancedTemplates()
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
}

export default addEnhancedTemplates
