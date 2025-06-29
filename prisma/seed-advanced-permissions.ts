import { PrismaClient } from '@prisma/client'
import { PERMISSION_TEMPLATES } from '../src/lib/advanced-permissions'

const prisma = new PrismaClient()

async function seedAdvancedPermissions() {
    console.log('🔐 Seeding advanced permissions...')

    // Get the admin user and showroom
    const adminUser = await prisma.user.findFirst({ where: { role: 'ADMIN' } })
    const showroom = await prisma.showroom.findFirst()

    if (!adminUser || !showroom) {
        console.log('❌ No admin user or showroom found')
        return
    }

    // Create permission templates
    console.log('📝 Creating permission templates...')

    const templateData = Object.entries(PERMISSION_TEMPLATES).map(([key, template]) => ({
        name: template.name,
        description: template.description,
        category: key.split('_')[0].toLowerCase(),
        permissions: JSON.stringify(template.permissions),
        isActive: true
    }))

    for (const template of templateData) {
        await prisma.permissionTemplate.upsert({
            where: { name: template.name },
            update: template,
            create: template
        })
    }

    // Create custom roles based on templates
    console.log('👑 Creating sample custom roles...')

    const customRoles = [
        {
            name: 'Senior Sales Consultant',
            description: 'Advanced sales role with enhanced permissions for experienced team members',
            baseRole: 'SALESPERSON',
            permissions: JSON.stringify(PERMISSION_TEMPLATES.SALES_ADVANCED.permissions),
            isActive: true,
            createdById: adminUser.id,
            showroomId: showroom.id
        },
        {
            name: 'Regional Operations Manager',
            description: 'Operations management role with cross-showroom access',
            baseRole: 'PROJECT_MANAGER',
            permissions: JSON.stringify(PERMISSION_TEMPLATES.MANAGEMENT.permissions),
            isActive: true,
            createdById: adminUser.id,
            showroomId: null // Global role
        },
        {
            name: 'Field Technician',
            description: 'Mobile-focused role for field workers with project access',
            baseRole: 'INSTALLER',
            permissions: JSON.stringify(PERMISSION_TEMPLATES.OPERATIONS.permissions),
            isActive: true,
            createdById: adminUser.id,
            showroomId: showroom.id
        },
        {
            name: 'Customer Service Lead',
            description: 'Enhanced customer service role with client management permissions',
            baseRole: 'SALESPERSON',
            permissions: JSON.stringify({
                resources: [
                    {
                        resource: 'clients',
                        actions: { read: true, create: true, update: true },
                        conditions: { showroomOnly: true }
                    },
                    {
                        resource: 'projects',
                        actions: { read: true, update: true },
                        conditions: { showroomOnly: true },
                        scope: ['view_status', 'update_customer_notes']
                    },
                    {
                        resource: 'messages',
                        actions: { read: true, create: true, update: true },
                        conditions: { showroomOnly: true }
                    },
                    {
                        resource: 'activities',
                        actions: { read: true, create: true },
                        conditions: { showroomOnly: true }
                    }
                ],
                systemAccess: {
                    reports: false,
                    settings: false,
                    userManagement: false
                },
                dashboard: {
                    url: '/dashboard/customer-service',
                    widgets: ['client-inquiries', 'recent-activities', 'follow-ups']
                },
                mobile: { canAccess: true, features: ['clients', 'messages'] },
                security: { requiresTwoFactor: false }
            }),
            isActive: true,
            createdById: adminUser.id,
            showroomId: showroom.id
        }
    ]

    for (const role of customRoles) {
        await prisma.customRole.upsert({
            where: { name: role.name },
            update: role,
            create: role
        })
    }

    // Get some sample users to assign roles to
    const sampleUsers = await prisma.user.findMany({
        where: {
            role: { in: ['SALESPERSON', 'PROJECT_MANAGER', 'INSTALLER'] },
            showroomId: showroom.id
        },
        take: 3
    })

    // Create sample role assignments
    console.log('🎭 Creating sample role assignments...')

    if (sampleUsers.length > 0) {
        const createdRoles = await prisma.customRole.findMany({
            where: { createdById: adminUser.id }
        })

        // Assign roles to users (one role per user for demo)
        for (let i = 0; i < Math.min(sampleUsers.length, createdRoles.length); i++) {
            const user = sampleUsers[i]
            const role = createdRoles[i]

            // Check if assignment already exists
            const existingAssignment = await prisma.roleAssignment.findFirst({
                where: {
                    userId: user.id,
                    customRoleId: role.id,
                    isActive: true
                }
            })

            if (!existingAssignment) {
                await prisma.roleAssignment.create({
                    data: {
                        userId: user.id,
                        customRoleId: role.id,
                        assignedById: adminUser.id,
                        isActive: true
                    }
                })

                console.log(`   Assigned "${role.name}" to ${user.firstName} ${user.lastName}`)
            }
        }
    }

    console.log('✅ Advanced permissions seeding complete!')
    console.log(`   Created ${templateData.length} permission templates`)
    console.log(`   Created ${customRoles.length} custom roles`)
    console.log(`   Created role assignments for ${Math.min(sampleUsers.length, customRoles.length)} users`)
}

// Run if called directly
if (require.main === module) {
    seedAdvancedPermissions()
        .catch((e) => {
            console.error(e)
            process.exit(1)
        })
        .finally(async () => {
            await prisma.$disconnect()
        })
}

export default seedAdvancedPermissions
