import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Starting simplified database seed...')

  // Create demo showroom
  const retailShowroom = await prisma.showroom.create({
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

  // Hash password for all demo users
  const hashedPassword = await bcrypt.hash('password123', 12)

  // Create demo users
  const admin = await prisma.user.create({
    data: {
      email: 'admin@bowmanbathrooms.com',
      firstName: 'Admin',
      lastName: 'User',
      phone: '+44 161 123 4568',
      password: hashedPassword,
      role: 'ADMIN',
      isActive: true,
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
      role: 'SALESPERSON',
      isActive: true,
      emailVerified: new Date(),
      showroomId: retailShowroom.id
    }
  })

  console.log('✅ Database seeded successfully!')
  console.log('\n📋 Demo Users Created:')
  console.log('   Admin: admin@bowmanbathrooms.com / password123')
  console.log('   Salesperson: james.smith@bowmanbathrooms.com / password123')
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
