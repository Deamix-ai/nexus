import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
    console.log('🌱 Starting enhanced database seed with documents...')

    // Clear existing data
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
            settings: JSON.stringify({
                businessHours: {
                    monday: '9:00-17:30',
                    tuesday: '9:00-17:30',
                    wednesday: '9:00-17:30',
                    thursday: '9:00-17:30',
                    friday: '9:00-17:30',
                    saturday: '9:00-16:00',
                    sunday: 'Closed'
                },
                currency: 'GBP',
                timezone: 'Europe/London'
            }),
            branding: JSON.stringify({
                primaryColor: '#1e3a8a',
                secondaryColor: '#f59e0b',
                logo: '/logos/manchester.png'
            })
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
            customFields: JSON.stringify({
                preferredStartTime: '8:00 AM',
                specialRequirements: 'Access restrictions during school hours',
                designStyle: 'Modern Contemporary'
            })
        }
    })

    // Create sample documents
    const documents = [
        {
            name: 'Initial Quote - Wilson Project',
            description: 'Detailed quote for master bathroom renovation including all fixtures and labor',
            type: 'QUOTE',
            category: 'Sales',
            fileUrl: '/sample-documents/quote-wilson-001.pdf',
            fileName: 'quote-wilson-001.pdf',
            fileSize: 245760, // 240KB
            mimeType: 'application/pdf',
            tags: JSON.stringify(['quote', 'pricing', 'wilson']),
            isPublic: false,
            projectId: project.id,
            clientId: client.id,
            uploadedById: salesUser.id,
            showroomId: showroom.id,
        },
        {
            name: 'Design Presentation - 3D Renders',
            description: '3D visualizations of the proposed bathroom design with material selections',
            type: 'DESIGN',
            category: 'Design',
            fileUrl: '/sample-documents/design-renders-wilson.pdf',
            fileName: 'design-renders-wilson.pdf',
            fileSize: 1024000, // 1MB
            mimeType: 'application/pdf',
            tags: JSON.stringify(['design', '3d-render', 'presentation']),
            isPublic: false,
            projectId: project.id,
            clientId: client.id,
            uploadedById: salesUser.id,
            showroomId: showroom.id,
        },
        {
            name: 'Before Photos - Current Bathroom',
            description: 'Photos of existing bathroom condition before renovation',
            type: 'PHOTO',
            category: 'Documentation',
            fileUrl: '/sample-documents/before-photos-wilson.jpg',
            fileName: 'before-photos-wilson.jpg',
            fileSize: 512000, // 500KB
            mimeType: 'image/jpeg',
            tags: JSON.stringify(['photos', 'before', 'documentation']),
            isPublic: false,
            projectId: project.id,
            clientId: client.id,
            uploadedById: salesUser.id,
            showroomId: showroom.id,
        },
        {
            name: 'Product Specifications',
            description: 'Technical specifications for all fixtures and materials',
            type: 'SPECIFICATION',
            category: 'Technical',
            fileUrl: '/sample-documents/specifications-wilson.pdf',
            fileName: 'specifications-wilson.pdf',
            fileSize: 184320, // 180KB
            mimeType: 'application/pdf',
            tags: JSON.stringify(['specifications', 'technical', 'materials']),
            isPublic: false,
            projectId: project.id,
            uploadedById: salesUser.id,
            showroomId: showroom.id,
        },
        {
            name: 'Building Permit Application',
            description: 'Local authority permit application for structural modifications',
            type: 'PERMIT',
            category: 'Legal',
            fileUrl: '/sample-documents/permit-application-wilson.pdf',
            fileName: 'permit-application-wilson.pdf',
            fileSize: 95240, // 93KB
            mimeType: 'application/pdf',
            tags: JSON.stringify(['permit', 'legal', 'council']),
            isPublic: false,
            projectId: project.id,
            uploadedById: adminUser.id,
            showroomId: showroom.id,
        }
    ]

    for (const docData of documents) {
        await prisma.document.create({ data: docData })
    }

    // Create activities for document uploads
    const activities = [
        {
            type: 'DOCUMENT_UPLOAD',
            description: 'Quote document uploaded for Wilson project',
            userId: salesUser.id,
            projectId: project.id,
            clientId: client.id,
            metadata: JSON.stringify({ documentType: 'QUOTE', fileName: 'quote-wilson-001.pdf' })
        },
        {
            type: 'DOCUMENT_UPLOAD',
            description: 'Design renders uploaded and shared with client',
            userId: salesUser.id,
            projectId: project.id,
            clientId: client.id,
            metadata: JSON.stringify({ documentType: 'DESIGN', fileName: 'design-renders-wilson.pdf' })
        },
        {
            type: 'STAGE_CHANGE',
            description: 'Project stage updated to Design Presented',
            userId: salesUser.id,
            projectId: project.id,
            metadata: JSON.stringify({ previousStage: 'SURVEY_COMPLETE', newStage: 'DESIGN_PRESENTED' })
        },
        {
            type: 'NOTE',
            description: 'Client very happy with the 3D visualizations. Ready to proceed with contract.',
            userId: salesUser.id,
            projectId: project.id,
            clientId: client.id,
            metadata: JSON.stringify({ noteType: 'client-feedback' })
        }
    ]

    for (const activityData of activities) {
        await prisma.activity.create({ data: activityData })
    }

    console.log('✅ Enhanced database seeded successfully!')
    console.log('📋 Demo Users Created:')
    console.log('   Admin: admin@bowmanbathrooms.com / password123')
    console.log('   Salesperson: james.smith@bowmanbathrooms.com / password123')
    console.log('📁 Demo Documents Created:')
    console.log(`   ${documents.length} sample documents with various types`)
    console.log('🏗️ Demo Project Created:')
    console.log('   Wilson Master Bathroom Renovation (PRJ-2025-001)')
    console.log('👤 Demo Client Created:')
    console.log('   Sarah Wilson with linked project and documents')
}

main()
    .catch((e) => {
        console.error('Error seeding database:', e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
