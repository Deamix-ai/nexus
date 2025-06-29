import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting communication hub seed...')

    // Clear existing data
    await prisma.message.deleteMany()
    await prisma.messageTemplate.deleteMany()
    await prisma.activity.deleteMany()
    await prisma.document.deleteMany()
    await prisma.project.deleteMany()
    await prisma.client.deleteMany()
    await prisma.user.deleteMany()
    await prisma.showroom.deleteMany()

    // Create demo showroom
    const showroom = await prisma.showroom.create({
        data: {
            name: 'Bowman Bathrooms - Manchester',
            type: 'RETAIL',
            address: JSON.stringify({
                street: '123 Design Quarter',
                city: 'Manchester',
                state: 'Greater Manchester',
                postcode: 'M1 7DA',
                country: 'United Kingdom'
            }),
            phone: '+44 161 123 4567',
            email: 'manchester@bowmanbathrooms.com',
            manager: 'Sarah Johnson',
            isActive: true,
            settings: JSON.stringify({}),
            branding: JSON.stringify({})
        }
    })

    // Create demo users
    const hashedPassword = await bcrypt.hash('password123', 12)

    const adminUser = await prisma.user.create({
        data: {
            email: 'admin@bowmanbathrooms.com',
            firstName: 'Admin',
            lastName: 'User',
            password: hashedPassword,
            role: 'ADMIN',
            showroomId: showroom.id,
            isActive: true,
        }
    })

    const salesUser = await prisma.user.create({
        data: {
            email: 'james.smith@bowmanbathrooms.com',
            firstName: 'James',
            lastName: 'Smith',
            password: hashedPassword,
            role: 'SALESPERSON',
            showroomId: showroom.id,
            isActive: true,
        }
    })

    // Create demo client
    const client = await prisma.client.create({
        data: {
            firstName: 'Sarah',
            lastName: 'Wilson',
            email: 'sarah.wilson@example.com',
            phone: '+44 7700 900123',
            address: JSON.stringify({
                street: '456 Oak Avenue',
                city: 'Manchester',
                state: 'Greater Manchester',
                postcode: 'M2 3BC',
                country: 'United Kingdom'
            }),
            company: null,
            leadSource: 'Website',
            status: 'ACTIVE',
            showroomId: showroom.id,
            createdById: salesUser.id,
        }
    })

    // Create demo project
    const project = await prisma.project.create({
        data: {
            projectNumber: 'PRJ-2025-001',
            name: 'Wilson Master Bathroom Renovation',
            status: 'ACTIVE',
            stage: 'DESIGN_PRESENTED',
            priority: 'HIGH',
            clientName: 'Sarah Wilson',
            clientEmail: 'sarah.wilson@example.com',
            clientPhone: '+44 7700 900123',
            clientAddress: JSON.stringify({
                street: '456 Oak Avenue',
                city: 'Manchester',
                state: 'Greater Manchester',
                postcode: 'M2 3BC',
                country: 'United Kingdom'
            }),
            leadSource: 'Website',
            description: 'Complete master bathroom renovation including luxury fixtures, walk-in shower, and heated floors.',
            estimatedValue: 15000.00,
            actualValue: 16500.00,
            margin: 35.5,
            enquiryDate: new Date('2025-06-01'),
            consultationDate: new Date('2025-06-08'),
            surveyDate: new Date('2025-06-15'),
            designPresentedDate: new Date('2025-06-22'),
            scheduledStartDate: new Date('2025-07-15'),
            scheduledEndDate: new Date('2025-08-15'),
            showroomId: showroom.id,
            assignedUserId: salesUser.id,
            createdById: salesUser.id,
            tags: JSON.stringify(['luxury', 'master-bath', 'heated-floors']),
            customFields: JSON.stringify({})
        }
    })

    // Create message templates
    const templates = [
        {
            name: 'Welcome Email',
            description: 'Initial welcome email for new enquiries',
            type: 'EMAIL',
            category: 'Sales',
            subject: 'Welcome to Bowman Bathrooms - Your Project: {{PROJECT_NAME}}',
            body: `Dear {{CLIENT_NAME}},

Thank you for choosing Bowman Bathrooms for your bathroom renovation project. We're excited to help transform your vision into reality.

Your project reference: {{PROJECT_NUMBER}}
Assigned specialist: {{ASSIGNED_USER}}

What happens next:
1. We'll schedule a consultation at your convenience
2. Our design team will create 3D visualizations
3. You'll receive a detailed quote within 48 hours

If you have any questions, please don't hesitate to contact me directly.

Best regards,
{{USER_NAME}}
Bowman Bathrooms
{{SHOWROOM_PHONE}}`,
            htmlBody: null,
            variables: JSON.stringify(['CLIENT_NAME', 'PROJECT_NAME', 'PROJECT_NUMBER', 'ASSIGNED_USER', 'USER_NAME', 'SHOWROOM_PHONE']),
            isActive: true,
            isDefault: true,
            autoSend: true,
            triggerEvents: JSON.stringify(['project_created']),
            showroomId: showroom.id,
            createdById: salesUser.id,
        },
        {
            name: 'Consultation Reminder',
            description: 'SMS reminder for upcoming consultations',
            type: 'SMS',
            category: 'Appointments',
            subject: null,
            body: `Hi {{CLIENT_NAME}}! This is a reminder that your bathroom consultation is scheduled for {{CONSULTATION_DATE}} at {{CONSULTATION_TIME}}. Please ensure access to the bathroom area. See you then! - {{USER_NAME}} from Bowman Bathrooms`,
            htmlBody: null,
            variables: JSON.stringify(['CLIENT_NAME', 'CONSULTATION_DATE', 'CONSULTATION_TIME', 'USER_NAME']),
            isActive: true,
            isDefault: false,
            autoSend: true,
            triggerEvents: JSON.stringify(['consultation_reminder_24h']),
            showroomId: showroom.id,
            createdById: salesUser.id,
        },
        {
            name: 'Design Presentation',
            description: 'Email with design presentation and next steps',
            type: 'EMAIL',
            category: 'Design',
            subject: 'Your Bathroom Design is Ready! - {{PROJECT_NAME}}',
            body: `Dear {{CLIENT_NAME}},

I'm delighted to share that your bathroom design is now complete! 

Attached you'll find:
- 3D visualizations of your new bathroom
- Detailed specifications for all fixtures
- Timeline for installation
- Updated quote reflecting any changes

Key highlights of your design:
- {{DESIGN_HIGHLIGHTS}}

Please review the designs and let me know if you'd like any adjustments. I'm available to discuss any questions you may have.

To proceed to the next stage, simply reply to confirm you're happy with the design, and I'll prepare your contract.

Looking forward to bringing your dream bathroom to life!

Best regards,
{{USER_NAME}}
{{USER_PHONE}}`,
            htmlBody: null,
            variables: JSON.stringify(['CLIENT_NAME', 'PROJECT_NAME', 'DESIGN_HIGHLIGHTS', 'USER_NAME', 'USER_PHONE']),
            isActive: true,
            isDefault: true,
            autoSend: false,
            triggerEvents: JSON.stringify(['design_completed']),
            showroomId: showroom.id,
            createdById: salesUser.id,
        },
        {
            name: 'Installation Starting',
            description: 'SMS notification when installation begins',
            type: 'SMS',
            category: 'Installation',
            subject: null,
            body: `Hi {{CLIENT_NAME}}! Your bathroom installation starts tomorrow. Your installer {{INSTALLER_NAME}} will arrive at {{START_TIME}}. Contact: {{INSTALLER_PHONE}}. Exciting times ahead! - Bowman Bathrooms`,
            htmlBody: null,
            variables: JSON.stringify(['CLIENT_NAME', 'INSTALLER_NAME', 'START_TIME', 'INSTALLER_PHONE']),
            isActive: true,
            isDefault: true,
            autoSend: true,
            triggerEvents: JSON.stringify(['installation_starting']),
            showroomId: showroom.id,
            createdById: salesUser.id,
        },
        {
            name: 'Follow-up After Consultation',
            description: 'Follow-up email after initial consultation',
            type: 'EMAIL',
            category: 'Follow-up',
            subject: 'Thank you for meeting with us - Next Steps',
            body: `Dear {{CLIENT_NAME}},

It was a pleasure meeting with you today to discuss your bathroom renovation project. I hope you found our consultation helpful and informative.

As discussed, here's what happens next:

1. Survey: We'll schedule a detailed technical survey within the next 7 days
2. Design: Our design team will create your personalized 3D visualizations
3. Quote: You'll receive a comprehensive quote within 5 working days

In the meantime, I've attached some additional inspiration images and our latest brochure featuring recent projects similar to yours.

If any questions arise or if you'd like to schedule your survey earlier, please don't hesitate to contact me.

Thank you again for considering Bowman Bathrooms.

Best regards,
{{USER_NAME}}
{{USER_EMAIL}}
{{USER_PHONE}}`,
            htmlBody: null,
            variables: JSON.stringify(['CLIENT_NAME', 'USER_NAME', 'USER_EMAIL', 'USER_PHONE']),
            isActive: true,
            isDefault: false,
            autoSend: false,
            triggerEvents: JSON.stringify([]),
            showroomId: showroom.id,
            createdById: salesUser.id,
        }
    ]

    for (const templateData of templates) {
        await prisma.messageTemplate.create({ data: templateData })
    }

    // Create sample messages
    const messages = [
        {
            type: 'EMAIL',
            direction: 'OUTBOUND',
            status: 'DELIVERED',
            fromUserId: salesUser.id,
            toEmail: 'sarah.wilson@example.com',
            subject: 'Welcome to Bowman Bathrooms - Your Project: Wilson Master Bathroom',
            body: `Dear Sarah,

Thank you for choosing Bowman Bathrooms for your bathroom renovation project. We're excited to help transform your vision into reality.

Your project reference: PRJ-2025-001
Assigned specialist: James Smith

What happens next:
1. We'll schedule a consultation at your convenience
2. Our design team will create 3D visualizations
3. You'll receive a detailed quote within 48 hours

If you have any questions, please don't hesitate to contact me directly.

Best regards,
James Smith
Bowman Bathrooms
+44 161 123 4567`,
            projectId: project.id,
            clientId: client.id,
            showroomId: showroom.id,
            sentAt: new Date('2025-06-01T10:00:00'),
            deliveredAt: new Date('2025-06-01T10:02:00'),
            readAt: new Date('2025-06-01T14:30:00'),
            metadata: JSON.stringify({ campaign: 'welcome_sequence' }),
            attachments: JSON.stringify([]),
        },
        {
            type: 'SMS',
            direction: 'OUTBOUND',
            status: 'READ',
            fromUserId: salesUser.id,
            toPhone: '+44 7700 900123',
            body: 'Hi Sarah! This is a reminder that your bathroom consultation is scheduled for tomorrow at 2 PM. Please ensure access to the bathroom area. See you then! - James from Bowman Bathrooms',
            projectId: project.id,
            clientId: client.id,
            showroomId: showroom.id,
            sentAt: new Date('2025-06-07T17:00:00'),
            deliveredAt: new Date('2025-06-07T17:01:00'),
            readAt: new Date('2025-06-07T17:15:00'),
            metadata: JSON.stringify({ reminder_type: '24h_consultation' }),
            attachments: JSON.stringify([]),
        },
        {
            type: 'EMAIL',
            direction: 'INBOUND',
            status: 'READ',
            toEmail: 'james.smith@bowmanbathrooms.com',
            subject: 'Re: Your Bathroom Design is Ready!',
            body: 'Hi James, I love the 3D designs! The walk-in shower looks amazing and the heated floors are exactly what I wanted. Please go ahead with the contract. When can we start? Thanks, Sarah',
            projectId: project.id,
            clientId: client.id,
            showroomId: showroom.id,
            sentAt: new Date('2025-06-23T09:30:00'),
            deliveredAt: new Date('2025-06-23T09:30:00'),
            readAt: new Date('2025-06-23T09:35:00'),
            metadata: JSON.stringify({ reply_to_message: 'design_presentation' }),
            attachments: JSON.stringify([]),
        },
        {
            type: 'INTERNAL_NOTE',
            direction: 'OUTBOUND',
            status: 'SENT',
            fromUserId: salesUser.id,
            body: 'Client is very happy with the design. Need to prepare contract and schedule installation team. Priority project - high margin client.',
            projectId: project.id,
            clientId: client.id,
            showroomId: showroom.id,
            sentAt: new Date('2025-06-23T09:40:00'),
            metadata: JSON.stringify({ note_type: 'client_feedback', priority: 'high' }),
            attachments: JSON.stringify([]),
        }
    ]

    for (const messageData of messages) {
        await prisma.message.create({ data: messageData })
    }

    console.log('✅ Communication hub seeded successfully!')
    console.log('📧 Message Templates Created:')
    console.log(`   ${templates.length} templates for emails, SMS, and follow-ups`)
    console.log('💬 Sample Messages Created:')
    console.log(`   ${messages.length} messages showing communication flow`)
    console.log('👤 Demo Users:')
    console.log('   james.smith@bowmanbathrooms.com / password123')
    console.log('🏗️ Project: Wilson Master Bathroom Renovation')
    console.log('📱 Communication Hub ready for testing!')
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
