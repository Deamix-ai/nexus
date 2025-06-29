import { XeroClient, XeroAccessToken, TokenSet, Invoice, Contact, LineItem } from 'xero-node'

// Xero configuration
const XERO_CONFIG = {
    enabled: !!process.env.XERO_CLIENT_ID,
    clientId: process.env.XERO_CLIENT_ID || '',
    clientSecret: process.env.XERO_CLIENT_SECRET || '',
    redirectUri: process.env.XERO_REDIRECT_URI || '',
    scopes: 'openid profile email accounting.transactions accounting.contacts accounting.settings',
    state: 'returnPage=my-state',
    baseUrl: 'https://api.xero.com'
}

// Initialize Xero client
let xeroClient: XeroClient | null = null

export function initializeXeroClient() {
    if (!XERO_CONFIG.enabled) {
        console.warn('Xero credentials not configured. Accounting integration will be disabled.')
        return null
    }

    xeroClient = new XeroClient({
        clientId: XERO_CONFIG.clientId,
        clientSecret: XERO_CONFIG.clientSecret,
        redirectUris: [XERO_CONFIG.redirectUri],
        scopes: XERO_CONFIG.scopes.split(' '),
        state: XERO_CONFIG.state,
        httpTimeout: 3000
    })

    return xeroClient
}

export const xeroConfig = XERO_CONFIG

// Set access token for authenticated requests
export function setXeroTokenSet(tokenSet: TokenSet) {
    if (xeroClient) {
        xeroClient.setTokenSet(tokenSet)
    }
}

// Create invoice in Xero
export async function createXeroInvoice(
    tokenSet: TokenSet,
    invoiceData: {
        contactName: string
        contactEmail: string
        reference: string
        description: string
        lineItems: Array<{
            description: string
            quantity: number
            unitAmount: number
            accountCode?: string
            taxType?: string
        }>
        dueDate?: Date
        invoiceNumber?: string
    }
) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        // First, create or get the contact
        const contact: Contact = {
            name: invoiceData.contactName,
            emailAddress: invoiceData.contactEmail
        }

        const contactsResponse = await xeroClient.accountingApi.createContacts(
            'tenant-id', // This would be the actual tenant ID
            { contacts: [contact] }
        )

        const contactId = contactsResponse.body.contacts?.[0]?.contactID

        // Create line items
        const lineItems: LineItem[] = invoiceData.lineItems.map(item => ({
            description: item.description,
            quantity: item.quantity,
            unitAmount: item.unitAmount,
            accountCode: item.accountCode || '200', // Default revenue account
            taxType: item.taxType || 'OUTPUT2' // Default tax type
        }))

        // Create the invoice
        const invoice: Invoice = {
            type: Invoice.TypeEnum.ACCREC, // Accounts receivable
            contact: { contactID: contactId },
            lineItems: lineItems,
            date: new Date().toISOString().split('T')[0],
            dueDate: invoiceData.dueDate?.toISOString().split('T')[0] ||
                new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days from now
            invoiceNumber: invoiceData.invoiceNumber,
            reference: invoiceData.reference,
            status: Invoice.StatusEnum.AUTHORISED
        }

        const invoicesResponse = await xeroClient.accountingApi.createInvoices(
            'tenant-id',
            { invoices: [invoice] }
        )

        return invoicesResponse.body.invoices?.[0]

    } catch (error) {
        console.error('Error creating Xero invoice:', error)
        throw error
    }
}

// Sync contact to Xero
export async function syncContactToXero(
    tokenSet: TokenSet,
    contactData: {
        name: string
        firstName?: string
        lastName?: string
        email?: string
        phone?: string
        address?: {
            addressLine1?: string
            addressLine2?: string
            city?: string
            region?: string
            postalCode?: string
            country?: string
        }
    }
) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        const contact: Contact = {
            name: contactData.name,
            firstName: contactData.firstName,
            lastName: contactData.lastName,
            emailAddress: contactData.email,
            phone: contactData.phone
        }

        if (contactData.address) {
            contact.addresses = [{
                addressType: Contact.AddressesEnum.STREET,
                addressLine1: contactData.address.addressLine1,
                addressLine2: contactData.address.addressLine2,
                city: contactData.address.city,
                region: contactData.address.region,
                postalCode: contactData.address.postalCode,
                country: contactData.address.country
            }]
        }

        const contactsResponse = await xeroClient.accountingApi.createContacts(
            'tenant-id',
            { contacts: [contact] }
        )

        return contactsResponse.body.contacts?.[0]

    } catch (error) {
        console.error('Error syncing contact to Xero:', error)
        throw error
    }
}

// Get invoices from Xero
export async function getXeroInvoices(
    tokenSet: TokenSet,
    options: {
        where?: string
        order?: string
        page?: number
        includeArchived?: boolean
    } = {}
) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        const invoicesResponse = await xeroClient.accountingApi.getInvoices(
            'tenant-id',
            undefined, // ifModifiedSince
            options.where,
            options.order,
            undefined, // ids
            undefined, // invoiceNumbers
            undefined, // contactIDs
            undefined, // statuses
            options.page,
            options.includeArchived,
            undefined, // createdByMyApp
            undefined, // unitdp
            undefined  // summaryOnly
        )

        return invoicesResponse.body.invoices || []

    } catch (error) {
        console.error('Error fetching Xero invoices:', error)
        throw error
    }
}

// Get contacts from Xero
export async function getXeroContacts(
    tokenSet: TokenSet,
    options: {
        where?: string
        order?: string
        page?: number
        includeArchived?: boolean
    } = {}
) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        const contactsResponse = await xeroClient.accountingApi.getContacts(
            'tenant-id',
            undefined, // ifModifiedSince
            options.where,
            options.order,
            undefined, // ids
            options.page,
            options.includeArchived,
            undefined, // summaryOnly
            undefined  // searchTerm
        )

        return contactsResponse.body.contacts || []

    } catch (error) {
        console.error('Error fetching Xero contacts:', error)
        throw error
    }
}

// Get account codes from Xero
export async function getXeroAccounts(tokenSet: TokenSet) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        const accountsResponse = await xeroClient.accountingApi.getAccounts('tenant-id')
        return accountsResponse.body.accounts || []

    } catch (error) {
        console.error('Error fetching Xero accounts:', error)
        throw error
    }
}

// Sync payment to Xero
export async function syncPaymentToXero(
    tokenSet: TokenSet,
    paymentData: {
        invoiceId: string
        amount: number
        date: Date
        reference?: string
        accountCode?: string
    }
) {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    setXeroTokenSet(tokenSet)

    try {
        const payment = {
            invoice: { invoiceID: paymentData.invoiceId },
            account: { code: paymentData.accountCode || '090' }, // Default bank account
            amount: paymentData.amount,
            date: paymentData.date.toISOString().split('T')[0],
            reference: paymentData.reference
        }

        const paymentsResponse = await xeroClient.accountingApi.createPayments(
            'tenant-id',
            { payments: [payment] }
        )

        return paymentsResponse.body.payments?.[0]

    } catch (error) {
        console.error('Error syncing payment to Xero:', error)
        throw error
    }
}

// Xero OAuth2 authorization URL
export function getXeroAuthUrl(): string {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    return xeroClient.buildConsentUrl()
}

// Exchange authorization code for tokens
export async function exchangeCodeForTokens(code: string): Promise<TokenSet> {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    const tokenSet = await xeroClient.apiCallback(XERO_CONFIG.redirectUri + `?code=${code}`)
    return tokenSet
}

// Refresh access token
export async function refreshXeroTokens(refreshToken: string): Promise<TokenSet> {
    if (!xeroClient) {
        throw new Error('Xero client not initialized')
    }

    const tokenSet = await xeroClient.refreshToken()
    return tokenSet
}

// Xero webhook signature validation
export function validateXeroWebhook(payload: string, signature: string, webhookKey: string): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
        .createHmac('sha256', webhookKey)
        .update(payload)
        .digest('base64')

    return signature === expectedSignature
}

// Pre-configured account mappings for Bowman Bathrooms
export const XERO_ACCOUNT_MAPPINGS = {
    REVENUE: {
        BATHROOM_INSTALLATION: '200', // Sales - Bathroom Installations
        CONSULTATION_FEES: '210', // Sales - Consultation Fees
        DESIGN_SERVICES: '220', // Sales - Design Services
        ADDITIONAL_WORK: '230', // Sales - Additional Work
    },
    EXPENSES: {
        MATERIALS: '300', // Cost of Goods Sold - Materials
        SUBCONTRACTORS: '310', // Cost of Goods Sold - Subcontractors
        EQUIPMENT_RENTAL: '320', // Operating Expenses - Equipment Rental
        TRAVEL_EXPENSES: '420', // Operating Expenses - Travel
    },
    ASSETS: {
        BANK_ACCOUNT: '090', // Bank Account
        ACCOUNTS_RECEIVABLE: '610', // Accounts Receivable
        INVENTORY: '140', // Inventory
    },
    LIABILITIES: {
        ACCOUNTS_PAYABLE: '800', // Accounts Payable
        ACCRUED_EXPENSES: '820', // Accrued Expenses
    }
}

// Initialize Xero on module load
initializeXeroClient()
