import twilio from 'twilio'

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID
const authToken = process.env.TWILIO_AUTH_TOKEN
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER

if (!accountSid || !authToken || !twilioPhoneNumber) {
    console.warn('Twilio credentials not configured. SMS functionality will be disabled.')
}

export const twilioClient = accountSid && authToken ? twilio(accountSid, authToken) : null

export const TWILIO_CONFIG = {
    enabled: !!twilioClient,
    phoneNumber: twilioPhoneNumber || '',
    maxMessageLength: 1600, // Twilio SMS limit
    retryAttempts: 3,
    retryDelay: 1000, // 1 second
}

// SMS sending function
export async function sendSMS(
    to: string,
    message: string,
    options: {
        from?: string
        mediaUrl?: string[]
        metadata?: Record<string, string>
    } = {}
) {
    if (!twilioClient) {
        throw new Error('Twilio is not configured. Please set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, and TWILIO_PHONE_NUMBER environment variables.')
    }

    // Format phone number (ensure it starts with + for international format)
    const formattedTo = to.startsWith('+') ? to : `+44${to.replace(/^0/, '')}`
    const fromNumber = options.from || TWILIO_CONFIG.phoneNumber

    try {
        const messageData: any = {
            body: message,
            from: fromNumber,
            to: formattedTo,
        }

        // Add media URLs if provided (for MMS)
        if (options.mediaUrl && options.mediaUrl.length > 0) {
            messageData.mediaUrl = options.mediaUrl
        }

        const result = await twilioClient.messages.create(messageData)

        return {
            success: true,
            messageId: result.sid,
            status: result.status,
            to: result.to,
            from: result.from,
            cost: result.price,
            direction: result.direction,
            errorCode: result.errorCode,
            errorMessage: result.errorMessage,
            metadata: options.metadata
        }
    } catch (error) {
        console.error('Twilio SMS Error:', error)
        throw new Error(`Failed to send SMS: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Bulk SMS sending function
export async function sendBulkSMS(
    recipients: Array<{
        to: string
        message: string
        mediaUrl?: string[]
        metadata?: Record<string, string>
    }>,
    options: {
        from?: string
        batchSize?: number
        delayBetweenBatches?: number
    } = {}
) {
    if (!twilioClient) {
        throw new Error('Twilio is not configured')
    }

    const { batchSize = 10, delayBetweenBatches = 1000 } = options
    const results: Array<{
        recipient: string
        success: boolean
        messageId?: string
        error?: string
    }> = []

    // Process recipients in batches to avoid rate limiting
    for (let i = 0; i < recipients.length; i += batchSize) {
        const batch = recipients.slice(i, i + batchSize)

        const batchPromises = batch.map(async (recipient) => {
            try {
                const result = await sendSMS(recipient.to, recipient.message, {
                    from: options.from,
                    mediaUrl: recipient.mediaUrl,
                    metadata: recipient.metadata
                })

                return {
                    recipient: recipient.to,
                    success: true,
                    messageId: result.messageId
                }
            } catch (error) {
                return {
                    recipient: recipient.to,
                    success: false,
                    error: error instanceof Error ? error.message : 'Unknown error'
                }
            }
        })

        const batchResults = await Promise.all(batchPromises)
        results.push(...batchResults)

        // Add delay between batches if not the last batch
        if (i + batchSize < recipients.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches))
        }
    }

    return results
}

// Get SMS delivery status
export async function getSMSStatus(messageId: string) {
    if (!twilioClient) {
        throw new Error('Twilio is not configured')
    }

    try {
        const message = await twilioClient.messages(messageId).fetch()

        return {
            messageId: message.sid,
            status: message.status,
            direction: message.direction,
            to: message.to,
            from: message.from,
            body: message.body,
            numSegments: message.numSegments,
            price: message.price,
            priceUnit: message.priceUnit,
            errorCode: message.errorCode,
            errorMessage: message.errorMessage,
            dateCreated: message.dateCreated,
            dateUpdated: message.dateUpdated,
            dateSent: message.dateSent
        }
    } catch (error) {
        console.error('Error fetching SMS status:', error)
        throw new Error(`Failed to fetch SMS status: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Get account information and balance
export async function getTwilioAccountInfo() {
    if (!twilioClient || !accountSid) {
        throw new Error('Twilio is not configured')
    }

    try {
        const account = await twilioClient.api.accounts(accountSid).fetch()
        const balance = await twilioClient.api.accounts(accountSid).balance.fetch()

        return {
            accountSid: account.sid,
            friendlyName: account.friendlyName,
            status: account.status,
            type: account.type,
            balance: balance.balance,
            currency: balance.currency,
            dateCreated: account.dateCreated,
            dateUpdated: account.dateUpdated
        }
    } catch (error) {
        console.error('Error fetching Twilio account info:', error)
        throw new Error(`Failed to fetch account info: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
}

// Validate phone number format
export function validatePhoneNumber(phoneNumber: string): {
    isValid: boolean
    formatted?: string
    error?: string
} {
    // Remove all non-digit characters
    const digits = phoneNumber.replace(/\D/g, '')

    // UK mobile numbers validation
    if (digits.length === 11 && digits.startsWith('07')) {
        return {
            isValid: true,
            formatted: `+44${digits.substring(1)}`
        }
    }

    // UK landline numbers validation
    if (digits.length === 11 && (digits.startsWith('01') || digits.startsWith('02'))) {
        return {
            isValid: true,
            formatted: `+44${digits.substring(1)}`
        }
    }

    // International format validation
    if (digits.length >= 10 && phoneNumber.startsWith('+')) {
        return {
            isValid: true,
            formatted: phoneNumber
        }
    }

    return {
        isValid: false,
        error: 'Invalid phone number format. Please use UK format (07XXXXXXXXX) or international format (+44XXXXXXXXXX)'
    }
}

// Format message with templates
export function formatSMSMessage(
    template: string,
    variables: Record<string, string | number>
): string {
    let message = template

    // Replace variables in the format {{variableName}}
    Object.entries(variables).forEach(([key, value]) => {
        const regex = new RegExp(`{{${key}}}`, 'g')
        message = message.replace(regex, String(value))
    })

    // Truncate if too long
    if (message.length > TWILIO_CONFIG.maxMessageLength) {
        message = message.substring(0, TWILIO_CONFIG.maxMessageLength - 3) + '...'
    }

    return message
}

// SMS templates for common scenarios
export const SMS_TEMPLATES = {
    APPOINTMENT_REMINDER: {
        id: 'appointment_reminder',
        name: 'Appointment Reminder',
        template: 'Hi {{clientName}}, this is a reminder about your {{appointmentType}} appointment tomorrow at {{appointmentTime}}. If you need to reschedule, please call us at {{companyPhone}}. - {{companyName}}',
        variables: ['clientName', 'appointmentType', 'appointmentTime', 'companyPhone', 'companyName']
    },
    QUOTE_READY: {
        id: 'quote_ready',
        name: 'Quote Ready',
        template: 'Hi {{clientName}}, your bathroom renovation quote is ready! You can view it at {{quoteLink}} or we can email it to you. Any questions? Call us at {{companyPhone}}. - {{companyName}}',
        variables: ['clientName', 'quoteLink', 'companyPhone', 'companyName']
    },
    PROJECT_UPDATE: {
        id: 'project_update',
        name: 'Project Update',
        template: 'Hi {{clientName}}, quick update on your bathroom project: {{updateMessage}}. Next step: {{nextStep}}. Questions? Call {{companyPhone}}. - {{companyName}}',
        variables: ['clientName', 'updateMessage', 'nextStep', 'companyPhone', 'companyName']
    },
    PAYMENT_REMINDER: {
        id: 'payment_reminder',
        name: 'Payment Reminder',
        template: 'Hi {{clientName}}, friendly reminder that payment of {{amount}} is due for your bathroom project. You can pay online at {{paymentLink}} or call us at {{companyPhone}}. - {{companyName}}',
        variables: ['clientName', 'amount', 'paymentLink', 'companyPhone', 'companyName']
    },
    INSTALLATION_COMPLETE: {
        id: 'installation_complete',
        name: 'Installation Complete',
        template: 'Hi {{clientName}}, your bathroom installation is complete! We hope you love your new space. Please let us know if you have any questions. Review us at {{reviewLink}}. - {{companyName}}',
        variables: ['clientName', 'reviewLink', 'companyName']
    }
}

export default {
    sendSMS,
    sendBulkSMS,
    getSMSStatus,
    getTwilioAccountInfo,
    validatePhoneNumber,
    formatSMSMessage,
    SMS_TEMPLATES,
    TWILIO_CONFIG
}
