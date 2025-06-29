import { ApiClient, EnvelopesApi, EnvelopeDefinition, Document, Signer, SignHere, Tabs, Recipients } from 'docusign-esign'

// DocuSign configuration
const DOCUSIGN_CONFIG = {
    enabled: !!process.env.DOCUSIGN_CLIENT_ID,
    clientId: process.env.DOCUSIGN_CLIENT_ID || '',
    clientSecret: process.env.DOCUSIGN_CLIENT_SECRET || '',
    redirectUri: process.env.DOCUSIGN_REDIRECT_URI || '',
    accountId: process.env.DOCUSIGN_ACCOUNT_ID || '',
    baseUrl: process.env.DOCUSIGN_BASE_URL || 'https://demo.docusign.net/restapi',
    authorizationEndpoint: 'https://account-d.docusign.com/oauth/auth',
    tokenEndpoint: 'https://account-d.docusign.com/oauth/token'
}

// Initialize DocuSign client
let dsApiClient: ApiClient | null = null

export function initializeDocuSignClient() {
    if (!DOCUSIGN_CONFIG.enabled) {
        console.warn('DocuSign credentials not configured. Document signing functionality will be disabled.')
        return null
    }

    dsApiClient = new ApiClient()
    dsApiClient.setBasePath(DOCUSIGN_CONFIG.baseUrl)

    return dsApiClient
}

export const docusignConfig = DOCUSIGN_CONFIG

// Set access token for authenticated requests
export function setDocuSignAccessToken(accessToken: string) {
    if (dsApiClient) {
        dsApiClient.addDefaultHeader('Authorization', `Bearer ${accessToken}`)
    }
}

// Create envelope for document signing
export async function createEnvelope(
    accessToken: string,
    documents: Array<{
        name: string
        content: Buffer
        fileExtension: string
    }>,
    signers: Array<{
        email: string
        name: string
        recipientId: string
        clientUserId?: string
    }>,
    options: {
        emailSubject?: string
        emailMessage?: string
        status?: 'sent' | 'created'
    } = {}
) {
    if (!dsApiClient) {
        throw new Error('DocuSign client not initialized')
    }

    // Set access token
    setDocuSignAccessToken(accessToken)

    // Prepare documents
    const docuSignDocuments: Document[] = documents.map((doc, index) => ({
        documentBase64: doc.content.toString('base64'),
        name: doc.name,
        fileExtension: doc.fileExtension,
        documentId: (index + 1).toString()
    }))

    // Prepare signers with signing tabs
    const envelopeSigners: Signer[] = signers.map((signer, index) => {
        const signHere = new SignHere({
            documentId: '1',
            pageNumber: '1',
            recipientId: signer.recipientId,
            tabLabel: 'SignHereTab',
            xPosition: '195',
            yPosition: '147'
        })

        const tabs = new Tabs({
            signHereTabs: [signHere]
        })

        return new Signer({
            email: signer.email,
            name: signer.name,
            recipientId: signer.recipientId,
            clientUserId: signer.clientUserId,
            tabs: tabs
        })
    })

    // Create recipients
    const recipients = new Recipients({
        signers: envelopeSigners
    })

    // Create envelope definition
    const envelopeDefinition = new EnvelopeDefinition({
        emailSubject: options.emailSubject || 'Please sign this document',
        emailMessage: options.emailMessage || 'Please review and sign the attached document.',
        documents: docuSignDocuments,
        recipients: recipients,
        status: options.status || 'sent'
    })

    // Send envelope
    const envelopesApi = new EnvelopesApi(dsApiClient)
    const results = await envelopesApi.createEnvelope(DOCUSIGN_CONFIG.accountId, {
        envelopeDefinition: envelopeDefinition
    })

    return results
}

// Get envelope status
export async function getEnvelopeStatus(accessToken: string, envelopeId: string) {
    if (!dsApiClient) {
        throw new Error('DocuSign client not initialized')
    }

    setDocuSignAccessToken(accessToken)

    const envelopesApi = new EnvelopesApi(dsApiClient)
    const envelope = await envelopesApi.getEnvelope(DOCUSIGN_CONFIG.accountId, envelopeId)

    return envelope
}

// Get recipient view URL (for embedded signing)
export async function getRecipientView(
    accessToken: string,
    envelopeId: string,
    recipientInfo: {
        userName: string
        email: string
        clientUserId: string
        returnUrl: string
    }
) {
    if (!dsApiClient) {
        throw new Error('DocuSign client not initialized')
    }

    setDocuSignAccessToken(accessToken)

    const envelopesApi = new EnvelopesApi(dsApiClient)
    const viewRequest = {
        authenticationMethod: 'none',
        clientUserId: recipientInfo.clientUserId,
        recipientId: '1',
        returnUrl: recipientInfo.returnUrl,
        userName: recipientInfo.userName,
        email: recipientInfo.email
    }

    const recipientView = await envelopesApi.createRecipientView(
        DOCUSIGN_CONFIG.accountId,
        envelopeId,
        { recipientViewRequest: viewRequest }
    )

    return recipientView
}

// List envelopes
export async function listEnvelopes(
    accessToken: string,
    options: {
        status?: string
        fromDate?: string
        toDate?: string
        count?: number
    } = {}
) {
    if (!dsApiClient) {
        throw new Error('DocuSign client not initialized')
    }

    setDocuSignAccessToken(accessToken)

    const envelopesApi = new EnvelopesApi(dsApiClient)
    const envelopes = await envelopesApi.listStatusChanges(DOCUSIGN_CONFIG.accountId, {
        status: options.status || 'sent,delivered,completed,declined,voided',
        fromDate: options.fromDate,
        toDate: options.toDate,
        count: options.count || 50
    })

    return envelopes
}

// Download completed document
export async function downloadDocument(
    accessToken: string,
    envelopeId: string,
    documentId: string = 'combined'
) {
    if (!dsApiClient) {
        throw new Error('DocuSign client not initialized')
    }

    setDocuSignAccessToken(accessToken)

    const envelopesApi = new EnvelopesApi(dsApiClient)
    const document = await envelopesApi.getDocument(
        DOCUSIGN_CONFIG.accountId,
        envelopeId,
        documentId
    )

    return document
}

// Webhook event validation
export function validateWebhookSignature(
    payload: string,
    signature: string,
    webhookSecret: string
): boolean {
    const crypto = require('crypto')
    const expectedSignature = crypto
        .createHmac('sha256', webhookSecret)
        .update(payload)
        .digest('hex')

    return signature === expectedSignature
}

// DocuSign template management
export interface DocuSignTemplate {
    id: string
    name: string
    description: string
    type: 'contract' | 'quote' | 'agreement' | 'receipt' | 'other'
    documentContent: Buffer
    signerRoles: Array<{
        name: string
        email?: string
        roleName: string
        routingOrder: number
    }>
    customFields?: Array<{
        name: string
        value: string
        required: boolean
    }>
}

// Contract templates for Bowman Bathrooms
export const CONTRACT_TEMPLATES: Record<string, Omit<DocuSignTemplate, 'id'>> = {
    BATHROOM_RENOVATION_CONTRACT: {
        name: 'Bathroom Renovation Contract',
        description: 'Standard contract for bathroom renovation projects',
        type: 'contract',
        documentContent: Buffer.from(''), // Would load from file
        signerRoles: [
            {
                name: 'Customer',
                roleName: 'Customer',
                routingOrder: 1
            },
            {
                name: 'Sales Representative',
                roleName: 'Sales Rep',
                routingOrder: 2
            },
            {
                name: 'Project Manager',
                roleName: 'Project Manager',
                routingOrder: 3
            }
        ],
        customFields: [
            { name: 'project_id', value: '', required: true },
            { name: 'total_amount', value: '', required: true },
            { name: 'start_date', value: '', required: true },
            { name: 'completion_date', value: '', required: true }
        ]
    },
    QUOTE_ACCEPTANCE: {
        name: 'Quote Acceptance Form',
        description: 'Customer acceptance of project quote',
        type: 'quote',
        documentContent: Buffer.from(''), // Would load from file
        signerRoles: [
            {
                name: 'Customer',
                roleName: 'Customer',
                routingOrder: 1
            }
        ],
        customFields: [
            { name: 'quote_id', value: '', required: true },
            { name: 'quote_amount', value: '', required: true },
            { name: 'valid_until', value: '', required: true }
        ]
    },
    COMPLETION_CERTIFICATE: {
        name: 'Project Completion Certificate',
        description: 'Certificate of project completion and customer satisfaction',
        type: 'receipt',
        documentContent: Buffer.from(''), // Would load from file
        signerRoles: [
            {
                name: 'Customer',
                roleName: 'Customer',
                routingOrder: 1
            },
            {
                name: 'Project Manager',
                roleName: 'Project Manager',
                routingOrder: 2
            }
        ],
        customFields: [
            { name: 'project_id', value: '', required: true },
            { name: 'completion_date', value: '', required: true },
            { name: 'final_amount', value: '', required: true }
        ]
    }
}

// Initialize DocuSign on module load
initializeDocuSignClient()
