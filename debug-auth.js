const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function testAuth() {
  try {
    console.log('🔍 Testing authentication...')
    
    // Find the user
    const user = await prisma.user.findUnique({
      where: {
        email: 'james.smith@bowmanbathrooms.com'
      }
    })
    
    if (!user) {
      console.log('❌ User not found!')
      return
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password
    })
    
    // Test password comparison
    const testPassword = 'password123'
    const isValid = await bcrypt.compare(testPassword, user.password)
    
    console.log('🔐 Password test result:', isValid ? '✅ Valid' : '❌ Invalid')
    
    // Test hash generation
    const newHash = await bcrypt.hash(testPassword, 12)
    console.log('🔑 Generated new hash for comparison')
    const isNewHashValid = await bcrypt.compare(testPassword, newHash)
    console.log('🔐 New hash test result:', isNewHashValid ? '✅ Valid' : '❌ Invalid')
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testAuth()
