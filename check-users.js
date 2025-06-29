import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function checkUsers() {
    console.log('🔍 Checking users in database...')

    const users = await prisma.user.findMany({
        select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: true,
            isActive: true,
            password: true
        }
    })

    console.log('📊 Found', users.length, 'users:')

    for (const user of users) {
        console.log(`
📧 Email: ${user.email}
👤 Name: ${user.firstName} ${user.lastName}
🎭 Role: ${user.role}
✅ Active: ${user.isActive}
🔐 Password Hash: ${user.password.substring(0, 20)}...
    `)

        // Test password
        const isValid = await bcrypt.compare('password123', user.password)
        console.log(`🔑 Password 'password123' valid: ${isValid}`)
        console.log('---')
    }

    await prisma.$disconnect()
}

checkUsers().catch(console.error)
