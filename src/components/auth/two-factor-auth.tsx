'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Shield,
    ShieldCheck,
    ShieldOff,
    Smartphone,
    Key,
    Download,
    Copy,
    QrCode,
    AlertTriangle
} from 'lucide-react'

interface TwoFactorStatus {
    enabled: boolean
    hasBackupCodes: boolean
}

interface SetupData {
    secret: string
    qrCode: string
    manualEntryKey: string
}

export function TwoFactorAuth() {
    const [status, setStatus] = useState<TwoFactorStatus | null>(null)
    const [loading, setLoading] = useState(false)
    const [step, setStep] = useState<'status' | 'setup' | 'verify' | 'backup-codes'>('status')
    const [setupData, setSetupData] = useState<SetupData | null>(null)
    const [verificationCode, setVerificationCode] = useState('')
    const [backupCodes, setBackupCodes] = useState<string[]>([])

    useEffect(() => {
        fetchStatus()
    }, [])

    const fetchStatus = async () => {
        try {
            const response = await fetch('/api/auth/two-factor')
            if (response.ok) {
                const data = await response.json()
                setStatus(data)
            }
        } catch (error) {
            console.error('Error fetching 2FA status:', error)
        }
    }

    const handleSetup = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/two-factor?action=setup', {
                method: 'POST'
            })

            if (response.ok) {
                const data = await response.json()
                setSetupData(data)
                setStep('setup')
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert('Failed to setup 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleVerify = async () => {
        if (!verificationCode || verificationCode.length !== 6) {
            alert('Please enter a 6-digit verification code')
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/two-factor?action=verify', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: verificationCode,
                    secret: setupData?.secret
                })
            })

            if (response.ok) {
                const data = await response.json()
                if (data.backupCodes) {
                    setBackupCodes(data.backupCodes)
                    setStep('backup-codes')
                } else {
                    alert('2FA verified successfully!')
                    setStep('status')
                    fetchStatus()
                }
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert('Failed to verify 2FA code')
        } finally {
            setLoading(false)
        }
    }

    const handleDisable = async () => {
        if (!confirm('Are you sure you want to disable two-factor authentication? This will make your account less secure.')) {
            return
        }

        setLoading(true)
        try {
            const response = await fetch('/api/auth/two-factor?action=disable', {
                method: 'POST'
            })

            if (response.ok) {
                alert('2FA disabled successfully')
                setStep('status')
                fetchStatus()
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert('Failed to disable 2FA')
        } finally {
            setLoading(false)
        }
    }

    const handleGenerateNewBackupCodes = async () => {
        setLoading(true)
        try {
            const response = await fetch('/api/auth/two-factor?action=backup-codes', {
                method: 'POST'
            })

            if (response.ok) {
                const data = await response.json()
                setBackupCodes(data.backupCodes)
                setStep('backup-codes')
            } else {
                const error = await response.json()
                alert(`Error: ${error.error}`)
            }
        } catch (error) {
            alert('Failed to generate backup codes')
        } finally {
            setLoading(false)
        }
    }

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text)
        alert('Copied to clipboard!')
    }

    const downloadBackupCodes = () => {
        const content = backupCodes.join('\n')
        const blob = new Blob([content], { type: 'text/plain' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'nexus-crm-backup-codes.txt'
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
    }

    if (!status) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <Shield className="mx-auto h-8 w-8 text-muted-foreground animate-spin" />
                    <p className="mt-2 text-muted-foreground">Loading...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Two-Factor Authentication</h1>
                    <p className="text-muted-foreground">
                        Secure your account with an additional layer of protection
                    </p>
                </div>
            </div>

            {/* Status Overview */}
            {step === 'status' && (
                <div className="grid gap-6 md:grid-cols-2">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                {status.enabled ? (
                                    <ShieldCheck className="h-5 w-5 text-green-500" />
                                ) : (
                                    <ShieldOff className="h-5 w-5 text-red-500" />
                                )}
                                <span>Authentication Status</span>
                            </CardTitle>
                            <CardDescription>
                                {status.enabled
                                    ? 'Two-factor authentication is enabled and protecting your account'
                                    : 'Two-factor authentication is disabled'
                                }
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                <div className={`p-4 rounded-lg ${status.enabled ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                                    <div className="flex items-center space-x-2">
                                        {status.enabled ? (
                                            <ShieldCheck className="h-4 w-4" />
                                        ) : (
                                            <AlertTriangle className="h-4 w-4" />
                                        )}
                                        <span className="font-medium">
                                            {status.enabled ? 'Protected' : 'Vulnerable'}
                                        </span>
                                    </div>
                                    <p className="text-sm mt-1">
                                        {status.enabled
                                            ? 'Your account is secured with 2FA'
                                            : 'Enable 2FA to secure your account'
                                        }
                                    </p>
                                </div>

                                {status.enabled ? (
                                    <div className="space-y-2">
                                        <Button
                                            onClick={handleGenerateNewBackupCodes}
                                            variant="outline"
                                            className="w-full"
                                            disabled={loading}
                                        >
                                            <Key className="mr-2 h-4 w-4" />
                                            {loading ? 'Generating...' : 'Generate New Backup Codes'}
                                        </Button>
                                        <Button
                                            onClick={handleDisable}
                                            variant="destructive"
                                            className="w-full"
                                            disabled={loading}
                                        >
                                            <ShieldOff className="mr-2 h-4 w-4" />
                                            {loading ? 'Disabling...' : 'Disable 2FA'}
                                        </Button>
                                    </div>
                                ) : (
                                    <Button
                                        onClick={handleSetup}
                                        className="w-full"
                                        disabled={loading}
                                    >
                                        <Shield className="mr-2 h-4 w-4" />
                                        {loading ? 'Setting up...' : 'Enable Two-Factor Authentication'}
                                    </Button>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Smartphone className="h-5 w-5" />
                                <span>Authenticator Apps</span>
                            </CardTitle>
                            <CardDescription>
                                Recommended apps for generating verification codes
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Google Authenticator</div>
                                        <div className="text-sm text-muted-foreground">Free • iOS, Android</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Authy</div>
                                        <div className="text-sm text-muted-foreground">Free • iOS, Android, Desktop</div>
                                    </div>
                                </div>
                                <div className="flex items-center justify-between p-3 border rounded-lg">
                                    <div>
                                        <div className="font-medium">Microsoft Authenticator</div>
                                        <div className="text-sm text-muted-foreground">Free • iOS, Android</div>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Setup Step */}
            {step === 'setup' && setupData && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <QrCode className="h-5 w-5" />
                            <span>Setup Two-Factor Authentication</span>
                        </CardTitle>
                        <CardDescription>
                            Scan the QR code with your authenticator app
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="text-center">
                            <img
                                src={setupData.qrCode}
                                alt="QR Code for 2FA setup"
                                className="mx-auto border rounded-lg"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Manual Entry Key</Label>
                            <div className="flex space-x-2">
                                <Input
                                    value={setupData.manualEntryKey}
                                    readOnly
                                    className="font-mono text-sm"
                                />
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(setupData.manualEntryKey)}
                                >
                                    <Copy className="h-4 w-4" />
                                </Button>
                            </div>
                            <p className="text-xs text-muted-foreground">
                                If you can't scan the QR code, enter this key manually
                            </p>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="verification-code">Verification Code</Label>
                            <Input
                                id="verification-code"
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={verificationCode}
                                onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                maxLength={6}
                                className="text-center text-lg tracking-widest"
                            />
                        </div>

                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setStep('status')}
                                className="flex-1"
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleVerify}
                                disabled={loading || verificationCode.length !== 6}
                                className="flex-1"
                            >
                                {loading ? 'Verifying...' : 'Verify & Enable'}
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Backup Codes Step */}
            {step === 'backup-codes' && (
                <Card className="max-w-md mx-auto">
                    <CardHeader>
                        <CardTitle className="flex items-center space-x-2">
                            <Key className="h-5 w-5" />
                            <span>Backup Codes</span>
                        </CardTitle>
                        <CardDescription>
                            Save these backup codes in a safe place. You can use them to access your account if you lose your phone.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="bg-gray-50 p-4 rounded-lg">
                            <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                {backupCodes.map((code, index) => (
                                    <div key={index} className="text-center py-1">
                                        {code}
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="flex space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => copyToClipboard(backupCodes.join('\n'))}
                                className="flex-1"
                            >
                                <Copy className="mr-2 h-4 w-4" />
                                Copy
                            </Button>
                            <Button
                                variant="outline"
                                onClick={downloadBackupCodes}
                                className="flex-1"
                            >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                            </Button>
                        </div>

                        <div className="bg-yellow-50 p-4 rounded-lg">
                            <div className="flex items-start space-x-2">
                                <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                                <div className="text-sm text-yellow-800">
                                    <div className="font-medium">Important:</div>
                                    <ul className="mt-1 list-disc list-inside space-y-1">
                                        <li>Each code can only be used once</li>
                                        <li>Store them in a secure location</li>
                                        <li>Don't share them with anyone</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={() => {
                                setStep('status')
                                fetchStatus()
                            }}
                            className="w-full"
                        >
                            I've Saved My Backup Codes
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
