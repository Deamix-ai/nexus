const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function checkUser() {
  try {
    console.log('🔍 Checking database...')
    
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        isActive: true
      }
    })
    
    console.log('📋 All users in database:')
    users.forEach(user => {
      console.log(`  - ${user.email} (${user.firstName} ${user.lastName}, ${user.role}, active: ${user.isActive})`)
    })
    
    const targetUser = await prisma.user.findUnique({
      where: { email: 'james.smith@bowmanbathrooms.com' }
    })
    
    if (targetUser) {
      console.log('\n✅ Target user found:', {
        id: targetUser.id,
        email: targetUser.email,
        firstName: targetUser.firstName,
        role: targetUser.role,
        isActive: targetUser.isActive,
        hasPassword: !!targetUser.password,
        passwordLength: targetUser.password?.length
      })
    } else {
      console.log('\n❌ Target user NOT found!')
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

checkUser()
