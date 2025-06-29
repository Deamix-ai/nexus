import sgMail from '@sendgrid/mail'
import twilio from 'twilio'
import nodemailer from 'nodemailer'

// Types for provider configuration
export interface EmailProvider {
    name: string
    send: (emailData: EmailMessage) => Promise<SendResult>
}

export interface SMSProvider {
    name: string
    send: (smsData: SMSMessage) => Promise<SendResult>
}

export interface EmailMessage {
    to: string
    cc?: string[]
    bcc?: string[]
    subject: string
    body: string
    htmlBody?: string
    attachments?: EmailAttachment[]
    from?: string
    replyTo?: string
}

export interface SMSMessage {
    to: string
    body: string
    from?: string
}

export interface EmailAttachment {
    filename: string
    content: Buffer | string
    contentType?: string
}

export interface SendResult {
    success: boolean
    messageId?: string
    externalId?: string
    error?: string
    provider: string
}

// SendGrid Email Provider
class SendGridEmailProvider implements EmailProvider {
    name = 'sendgrid'

    constructor() {
        const apiKey = process.env.SENDGRID_API_KEY
        if (apiKey) {
            sgMail.setApiKey(apiKey)
        }
    }

    async send(emailData: EmailMessage): Promise<SendResult> {
        try {
            if (!process.env.SENDGRID_API_KEY) {
                throw new Error('SendGrid API key not configured')
            }

            const msg: any = {
                to: emailData.to,
                from: emailData.from || process.env.SENDGRID_FROM_EMAIL || 'noreply@bowmanbathrooms.com',
                subject: emailData.subject,
                text: emailData.body,
                html: emailData.htmlBody || emailData.body.replace(/\n/g, '<br>'),
            }

            if (emailData.cc && emailData.cc.length > 0) {
                msg.cc = emailData.cc
            }

            if (emailData.bcc && emailData.bcc.length > 0) {
                msg.bcc = emailData.bcc
            }

            if (emailData.replyTo) {
                msg.replyTo = emailData.replyTo
            }

            if (emailData.attachments && emailData.attachments.length > 0) {
                msg.attachments = emailData.attachments.map(att => ({
                    filename: att.filename,
                    content: att.content,
                    type: att.contentType,
                }))
            }

            const [response] = await sgMail.send(msg)

            return {
                success: true,
                messageId: response.headers['x-message-id'],
                externalId: response.headers['x-message-id'],
                provider: this.name
            }
        } catch (error: any) {
            console.error('SendGrid send error:', error)
            return {
                success: false,
                error: error.message || 'Failed to send email',
                provider: this.name
            }
        }
    }
}

// Nodemailer SMTP Provider (fallback)
class SMTPEmailProvider implements EmailProvider {
    name = 'smtp'
    private transporter: any

    constructor() {
        if (process.env.SMTP_HOST) {
            this.transporter = nodemailer.createTransporter({
                host: process.env.SMTP_HOST,
                port: parseInt(process.env.SMTP_PORT || '587'),
                secure: process.env.SMTP_SECURE === 'true',
                auth: {
                    user: process.env.SMTP_USER,
                    pass: process.env.SMTP_PASS,
                },
            })
        }
    }

    async send(emailData: EmailMessage): Promise<SendResult> {
        try {
            if (!this.transporter) {
                throw new Error('SMTP configuration not available')
            }

            const mailOptions = {
                from: emailData.from || process.env.SMTP_FROM || 'noreply@bowmanbathrooms.com',
                to: emailData.to,
                cc: emailData.cc,
                bcc: emailData.bcc,
                subject: emailData.subject,
                text: emailData.body,
                html: emailData.htmlBody || emailData.body.replace(/\n/g, '<br>'),
                replyTo: emailData.replyTo,
                attachments: emailData.attachments?.map(att => ({
                    filename: att.filename,
                    content: att.content,
                    contentType: att.contentType,
                })),
            }

            const info = await this.transporter.sendMail(mailOptions)

            return {
                success: true,
                messageId: info.messageId,
                externalId: info.messageId,
                provider: this.name
            }
        } catch (error: any) {
            console.error('SMTP send error:', error)
            return {
                success: false,
                error: error.message || 'Failed to send email',
                provider: this.name
            }
        }
    }
}

// Twilio SMS Provider
class TwilioSMSProvider implements SMSProvider {
    name = 'twilio'
    private client: any

    constructor() {
        const accountSid = process.env.TWILIO_ACCOUNT_SID
        const authToken = process.env.TWILIO_AUTH_TOKEN

        if (accountSid && authToken) {
            this.client = twilio(accountSid, authToken)
        }
    }

    async send(smsData: SMSMessage): Promise<SendResult> {
        try {
            if (!this.client) {
                throw new Error('Twilio configuration not available')
            }

            const message = await this.client.messages.create({
                body: smsData.body,
                from: smsData.from || process.env.TWILIO_PHONE_NUMBER,
                to: smsData.to,
            })

            return {
                success: true,
                messageId: message.sid,
                externalId: message.sid,
                provider: this.name
            }
        } catch (error: any) {
            console.error('Twilio send error:', error)
            return {
                success: false,
                error: error.message || 'Failed to send SMS',
                provider: this.name
            }
        }
    }
}

// Communication Service - Main service class
export class CommunicationService {
    private emailProviders: EmailProvider[] = []
    private smsProviders: SMSProvider[] = []

    constructor() {
        // Initialize email providers
        this.emailProviders.push(new SendGridEmailProvider())
        this.emailProviders.push(new SMTPEmailProvider())

        // Initialize SMS providers
        this.smsProviders.push(new TwilioSMSProvider())
    }

    async sendEmail(emailData: EmailMessage): Promise<SendResult> {
        // Try providers in order until one succeeds
        for (const provider of this.emailProviders) {
            try {
                const result = await provider.send(emailData)
                if (result.success) {
                    return result
                }
                console.warn(`Email provider ${provider.name} failed:`, result.error)
            } catch (error) {
                console.error(`Email provider ${provider.name} error:`, error)
            }
        }

        return {
            success: false,
            error: 'All email providers failed',
            provider: 'none'
        }
    }

    async sendSMS(smsData: SMSMessage): Promise<SendResult> {
        // Try providers in order until one succeeds
        for (const provider of this.smsProviders) {
            try {
                const result = await provider.send(smsData)
                if (result.success) {
                    return result
                }
                console.warn(`SMS provider ${provider.name} failed:`, result.error)
            } catch (error) {
                console.error(`SMS provider ${provider.name} error:`, error)
            }
        }

        return {
            success: false,
            error: 'All SMS providers failed',
            provider: 'none'
        }
    }

    // Test connectivity to providers
    async testProviders(): Promise<{ email: boolean, sms: boolean }> {
        const emailTest = {
            to: 'test@example.com',
            subject: 'Test Email',
            body: 'This is a test email'
        }

        const smsTest = {
            to: '+1234567890',
            body: 'This is a test SMS'
        }

        const emailAvailable = this.emailProviders.some(provider => {
            if (provider.name === 'sendgrid') {
                return !!process.env.SENDGRID_API_KEY
            }
            if (provider.name === 'smtp') {
                return !!process.env.SMTP_HOST
            }
            return false
        })

        const smsAvailable = this.smsProviders.some(provider => {
            if (provider.name === 'twilio') {
                return !!(process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN)
            }
            return false
        })

        return {
            email: emailAvailable,
            sms: smsAvailable
        }
    }
}

// Singleton instance
export const communicationService = new CommunicationService()
