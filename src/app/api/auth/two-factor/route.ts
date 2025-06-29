import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import speakeasy from 'speakeasy'
import QRCode from 'qrcode'

const setupTwoFactorSchema = z.object({
    action: z.enum(['setup', 'verify', 'disable', 'backup-codes'])
})

const verifyTwoFactorSchema = z.object({
    token: z.string().min(6).max(6),
    secret: z.string().optional()
})

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const body = await request.json()
        const url = new URL(request.url)
        const action = url.searchParams.get('action') || body.action

        switch (action) {
            case 'setup':
                return await setupTwoFactor(session.user.id, session.user.email || '')

            case 'verify':
                const verifyData = verifyTwoFactorSchema.parse(body)
                return await verifyTwoFactor(session.user.id, verifyData.token, verifyData.secret)

            case 'disable':
                return await disableTwoFactor(session.user.id)

            case 'backup-codes':
                return await generateBackupCodes(session.user.id)

            default:
                return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
        }

    } catch (error) {
        console.error('Two-factor authentication error:', error)

        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: 'Invalid request data', details: error.errors },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions)
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Get current 2FA status
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                twoFactorEnabled: true,
                twoFactorSecret: true,
                backupCodes: true
            }
        })

        return NextResponse.json({
            enabled: user?.twoFactorEnabled || false,
            hasBackupCodes: user?.backupCodes ? JSON.parse(user.backupCodes).length > 0 : false
        })

    } catch (error) {
        console.error('Error fetching 2FA status:', error)
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        )
    }
}

async function setupTwoFactor(userId: string, email: string) {
    // Generate a new secret
    const secret = speakeasy.generateSecret({
        name: `Nexus CRM (${email})`,
        issuer: 'Bowman Bathrooms CRM',
        length: 32
    })

    // Store temporary secret (not yet confirmed)
    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorSecret: secret.base32,
            twoFactorEnabled: false // Not enabled until verified
        }
    })

    // Generate QR code
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url!)

    return NextResponse.json({
        secret: secret.base32,
        qrCode: qrCodeUrl,
        manualEntryKey: secret.base32
    })
}

async function verifyTwoFactor(userId: string, token: string, secret?: string) {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { twoFactorSecret: true, twoFactorEnabled: true }
    })

    if (!user) {
        return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Use provided secret for initial setup, or existing secret for regular verification
    const verifySecret = secret || user.twoFactorSecret

    if (!verifySecret) {
        return NextResponse.json({ error: 'No 2FA secret found' }, { status: 400 })
    }

    // Verify the token
    const verified = speakeasy.totp.verify({
        secret: verifySecret,
        encoding: 'base32',
        token: token,
        window: 2 // Allow 2 time steps of variance
    })

    if (!verified) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 400 })
    }

    // If this is initial setup verification, enable 2FA
    if (!user.twoFactorEnabled) {
        await prisma.user.update({
            where: { id: userId },
            data: {
                twoFactorEnabled: true
            }
        })

        // Generate backup codes
        const backupCodes = generateBackupCodesList()
        await prisma.user.update({
            where: { id: userId },
            data: {
                backupCodes: JSON.stringify(backupCodes)
            }
        })

        return NextResponse.json({
            success: true,
            message: '2FA enabled successfully',
            backupCodes: backupCodes
        })
    }

    return NextResponse.json({
        success: true,
        message: 'Token verified successfully'
    })
}

async function disableTwoFactor(userId: string) {
    await prisma.user.update({
        where: { id: userId },
        data: {
            twoFactorEnabled: false,
            twoFactorSecret: null,
            backupCodes: "[]"
        }
    })

    return NextResponse.json({
        success: true,
        message: '2FA disabled successfully'
    })
}

async function generateBackupCodes(userId: string) {
    const backupCodes = generateBackupCodesList()

    await prisma.user.update({
        where: { id: userId },
        data: {
            backupCodes: JSON.stringify(backupCodes)
        }
    })

    return NextResponse.json({
        backupCodes: backupCodes
    })
}

function generateBackupCodesList(): string[] {
    const codes = []
    for (let i = 0; i < 10; i++) {
        const code = Math.random().toString(36).substr(2, 8).toUpperCase()
        codes.push(code)
    }
    return codes
}
