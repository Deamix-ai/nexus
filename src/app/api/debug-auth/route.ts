import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()
    
    console.log('🔍 Debug auth attempt:', { email, hasPassword: !!password })
    
    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
      include: { showroom: true }
    })
    
    if (!user) {
      console.log('❌ User not found:', email)
      return NextResponse.json({ 
        success: false, 
        error: 'User not found',
        debug: { email, userFound: false }
      })
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      role: user.role,
      isActive: user.isActive,
      hasPassword: !!user.password
    })
    
    // Check if user is active
    if (!user.isActive || user.deletedAt) {
      console.log('❌ User inactive or deleted')
      return NextResponse.json({ 
        success: false, 
        error: 'User inactive',
        debug: { isActive: user.isActive, deletedAt: user.deletedAt }
      })
    }
    
    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password)
    console.log('🔐 Password validation:', isPasswordValid ? '✅ Valid' : '❌ Invalid')
    
    if (!isPasswordValid) {
      return NextResponse.json({ 
        success: false, 
        error: 'Invalid password',
        debug: { passwordProvided: !!password, passwordValid: false }
      })
    }
    
    return NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    })
    
  } catch (error) {
    console.error('❌ Auth debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Server error',
      debug: { error: error instanceof Error ? error.message : 'Unknown error' }
    }, { status: 500 })
  }
}
