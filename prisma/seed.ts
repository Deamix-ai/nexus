import { PrismaClient, UserRole, ShowroomType, ProjectStage, ProjectStatus } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting database seed...')

  // Create demo showrooms
  const retailShowroom = await prisma.showroom.create({
    data: {
      name: 'Bowman Bathrooms - Manchester',
      type: ShowroomType.RETAIL,
      address: {
        street: '123 Design Quarter',
        city: 'Manchester',
        state: 'Greater Manchester',
        postcode: 'M1 7DA',
        country: 'United Kingdom'
      },
      phone: '+44 161 123 4567',
      email: 'manchester@bowmanbathrooms.com',
      manager: 'Sarah Johnson',
      isActive: true,
      settings: {
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
      },
      branding: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#f59e0b',
        logo: '/logos/manchester.png'
      }
    }
  })

  const franchiseShowroom = await prisma.showroom.create({
    data: {
      name: 'Bowman Bathrooms - Leeds Franchise',
      type: ShowroomType.FRANCHISE,
      address: {
        street: '456 Bathroom Street',
        city: 'Leeds',
        state: 'West Yorkshire',
        postcode: 'LS1 4AB',
        country: 'United Kingdom'
      },
      phone: '+44 113 987 6543',
      email: 'leeds@bowmanbathrooms.com',
      manager: 'Michael Thompson',
      isActive: true,
      settings: {
        businessHours: {
          monday: '9:00-17:00',
          tuesday: '9:00-17:00',
          wednesday: '9:00-17:00',
          thursday: '9:00-17:00',
          friday: '9:00-17:00',
          saturday: '9:00-15:00',
          sunday: 'Closed'
        },
        currency: 'GBP',
        timezone: 'Europe/London'
      },
      branding: {
        primaryColor: '#1e3a8a',
        secondaryColor: '#f59e0b',
        logo: '/logos/leeds.png'
      }
    }
  })

  // Create demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  const adminUser = await prisma.user.create({
    data: {
      email: 'admin@bowmanbathrooms.com',
      firstName: 'System',
      lastName: 'Administrator',
      phone: '+44 161 123 4567',
      password: hashedPassword,
      role: UserRole.ADMIN,
      isActive: true,
      twoFactorEnabled: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const salesManager = await prisma.user.create({
    data: {
      email: 'sarah.johnson@bowmanbathrooms.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      phone: '+44 161 123 4568',
      password: hashedPassword,
      role: UserRole.SALES_MANAGER,
      isActive: true,
      twoFactorEnabled: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const salesperson = await prisma.user.create({
    data: {
      email: 'james.smith@bowmanbathrooms.com',
      firstName: 'James',
      lastName: 'Smith',
      phone: '+44 161 123 4569',
      password: hashedPassword,
      role: UserRole.SALESPERSON,
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const projectManager = await prisma.user.create({
    data: {
      email: 'emma.wilson@bowmanbathrooms.com',
      firstName: 'Emma',
      lastName: 'Wilson',
      phone: '+44 161 123 4570',
      password: hashedPassword,
      role: UserRole.PROJECT_MANAGER,
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const installManager = await prisma.user.create({
    data: {
      email: 'david.brown@bowmanbathrooms.com',
      firstName: 'David',
      lastName: 'Brown',
      phone: '+44 161 123 4571',
      password: hashedPassword,
      role: UserRole.INSTALL_MANAGER,
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const installer = await prisma.user.create({
    data: {
      email: 'tom.davis@bowmanbathrooms.com',
      firstName: 'Tom',
      lastName: 'Davis',
      phone: '+44 161 123 4572',
      password: hashedPassword,
      role: UserRole.INSTALLER,
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const surveyor = await prisma.user.create({
    data: {
      email: 'lisa.taylor@bowmanbathrooms.com',
      firstName: 'Lisa',
      lastName: 'Taylor',
      phone: '+44 161 123 4573',
      password: hashedPassword,
      role: UserRole.SURVEYOR,
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const director = await prisma.user.create({
    data: {
      email: 'robert.bowman@bowmanbathrooms.com',
      firstName: 'Robert',
      lastName: 'Bowman',
      phone: '+44 161 123 4574',
      password: hashedPassword,
      role: UserRole.DIRECTOR,
      isActive: true,
      twoFactorEnabled: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  const bookkeeper = await prisma.user.create({
    data: {
      email: 'jennifer.clark@bowmanbathrooms.com',
      firstName: 'Jennifer',
      lastName: 'Clark',
      phone: '+44 161 123 4575',
      password: hashedPassword,
      role: UserRole.BOOKKEEPER,
      isActive: true,
      twoFactorEnabled: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  // Create some demo projects
  const demoProject1 = await prisma.project.create({
    data: {
      projectNumber: 'BWN-2025-001',
      name: 'Johnson Family Bathroom Renovation',
      status: ProjectStatus.ACTIVE,
      stage: ProjectStage.DESIGN_PRESENTED,
      clientName: 'Mr. & Mrs. Johnson',
      clientEmail: 'johnson@email.com',
      clientPhone: '+44 161 555 0101',
      clientAddress: {
        street: '15 Oak Avenue',
        city: 'Manchester',
        postcode: 'M14 6HQ',
        country: 'United Kingdom'
      },
      leadSource: 'Website Enquiry',
      description: 'Complete bathroom renovation including walk-in shower, modern suite, and luxury finishes',
      estimatedValue: 12500.00,
      enquiryDate: new Date('2025-06-15'),
      consultationDate: new Date('2025-06-18'),
      surveyDate: new Date('2025-06-22'),
      designPresentedDate: new Date('2025-06-25'),
      showroomId: retailShowroom.id,
      assignedUserId: salesperson.id,
      createdById: salesperson.id,
      tags: ['premium', 'walk-in-shower', 'modern'],
      customFields: {
        propertyType: 'Detached House',
        propertyAge: '1960s',
        accessNotes: 'Narrow entrance, consider material delivery'
      }
    }
  })

  const demoProject2 = await prisma.project.create({
    data: {
      projectNumber: 'BWN-2025-002',
      name: 'Smith Ensuite Installation',
      status: ProjectStatus.ACTIVE,
      stage: ProjectStage.INSTALLATION_IN_PROGRESS,
      clientName: 'Ms. Smith',
      clientEmail: 'smith@email.com',
      clientPhone: '+44 161 555 0102',
      clientAddress: {
        street: '42 Rose Street',
        city: 'Manchester',
        postcode: 'M20 3AB',
        country: 'United Kingdom'
      },
      leadSource: 'Referral',
      description: 'New ensuite bathroom installation in loft conversion',
      estimatedValue: 8750.00,
      actualValue: 8950.00,
      enquiryDate: new Date('2025-05-20'),
      consultationDate: new Date('2025-05-23'),
      surveyDate: new Date('2025-05-27'),
      designPresentedDate: new Date('2025-06-02'),
      saleDate: new Date('2025-06-05'),
      designSignOffDate: new Date('2025-06-10'),
      handoverDate: new Date('2025-06-15'),
      scheduledStartDate: new Date('2025-06-20'),
      actualStartDate: new Date('2025-06-22'),
      showroomId: retailShowroom.id,
      assignedUserId: projectManager.id,
      createdById: salesperson.id,
      tags: ['ensuite', 'loft', 'compact'],
      customFields: {
        propertyType: 'Terraced House',
        propertyAge: '1920s',
        accessNotes: 'Loft access via narrow stairs'
      }
    }
  })

  // Create some demo products
  await prisma.product.createMany({
    data: [
      {
        sku: 'SUITE-001',
        name: 'Premium Modern Suite - White',
        description: 'Complete bathroom suite including toilet, basin, and bath',
        category: 'Bathroom Suites',
        subcategory: 'Modern',
        brand: 'Bowman Collection',
        supplier: 'Premium Bathrooms Ltd',
        cost: 450.00,
        price: 899.00,
        margin: 49.94,
        stockLevel: 15,
        minStockLevel: 5,
        unit: 'set',
        specifications: {
          color: 'White',
          material: 'Ceramic',
          warranty: '25 years',
          dimensions: {
            toilet: '660x360x780mm',
            basin: '550x460x850mm',
            bath: '1700x750x580mm'
          }
        },
        images: ['/products/suite-001-1.jpg', '/products/suite-001-2.jpg'],
        showroomId: retailShowroom.id
      },
      {
        sku: 'SHOWER-001',
        name: 'Walk-In Shower Enclosure 1200x800',
        description: 'Frameless glass walk-in shower enclosure with rainfall shower head',
        category: 'Shower Enclosures',
        subcategory: 'Walk-In',
        brand: 'AquaSpace',
        supplier: 'Glass & Chrome Ltd',
        cost: 650.00,
        price: 1299.00,
        margin: 49.96,
        stockLevel: 8,
        minStockLevel: 3,
        unit: 'each',
        specifications: {
          dimensions: '1200x800mm',
          glassThickness: '8mm',
          glassType: 'Toughened Safety Glass',
          finish: 'Chrome',
          showerHead: 'Rainfall 250mm'
        },
        images: ['/products/shower-001-1.jpg', '/products/shower-001-2.jpg'],
        showroomId: retailShowroom.id
      },
      {
        sku: 'TILE-001',
        name: 'Porcelain Wall Tiles - Grey 300x600',
        description: 'High-quality porcelain wall tiles with modern grey finish',
        category: 'Tiles',
        subcategory: 'Wall Tiles',
        brand: 'TileWorld',
        supplier: 'National Tile Supplies',
        cost: 18.50,
        price: 35.99,
        margin: 48.61,
        stockLevel: 500,
        minStockLevel: 100,
        unit: 'm²',
        specifications: {
          size: '300x600mm',
          material: 'Porcelain',
          finish: 'Matt',
          color: 'Grey',
          thickness: '9mm',
          slipRating: 'R9'
        },
        images: ['/products/tile-001-1.jpg'],
        showroomId: retailShowroom.id
      }
    ]
  })

  // Create system settings
  await prisma.systemSetting.createMany({
    data: [
      {
        key: 'company_name',
        value: 'Bowman Bathrooms',
        category: 'General',
        description: 'Company name displayed throughout the system',
        isPublic: true
      },
      {
        key: 'default_currency',
        value: 'GBP',
        category: 'Financial',
        description: 'Default currency for pricing and invoicing',
        isPublic: true
      },
      {
        key: 'vat_rate',
        value: 20,
        category: 'Financial',
        description: 'Standard VAT rate percentage',
        isPublic: false
      },
      {
        key: 'email_notifications',
        value: true,
        category: 'Notifications',
        description: 'Enable email notifications system-wide',
        isPublic: false
      },
      {
        key: 'sms_notifications',
        value: true,
        category: 'Notifications',
        description: 'Enable SMS notifications system-wide',
        isPublic: false
      }
    ]
  })

  console.log('✅ Database seeded successfully!')
  console.log('📧 Demo user credentials:')
  console.log('   Admin: admin@bowmanbathrooms.com / password123')
  console.log('   Sales Manager: sarah.johnson@bowmanbathrooms.com / password123')
  console.log('   Salesperson: james.smith@bowmanbathrooms.com / password123')
  console.log('   Project Manager: emma.wilson@bowmanbathrooms.com / password123')
  console.log('   Install Manager: david.brown@bowmanbathrooms.com / password123')
  console.log('   Installer: tom.davis@bowmanbathrooms.com / password123')
  console.log('   Surveyor: lisa.taylor@bowmanbathrooms.com / password123')
  console.log('   Director: robert.bowman@bowmanbathrooms.com / password123')
  console.log('   Bookkeeper: jennifer.clark@bowmanbathrooms.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
