import { prisma } from '@/lib/prisma';

export interface TemplateVariable {
    name: string;
    value: string;
    description?: string;
}

export interface TemplateContext {
    user?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
    };
    client?: {
        id: string;
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address?: string;
    };
    project?: {
        id: string;
        name: string;
        projectNumber: string;
        stage: string;
        value?: number;
        description?: string;
    };
    showroom?: {
        id: string;
        name: string;
        address?: string;
        phone?: string;
        email?: string;
    };
    custom?: Record<string, any>;
}

export class TemplateService {
    // Common template variables that are always available
    private getSystemVariables(): TemplateVariable[] {
        const now = new Date();
        return [
            { name: 'current_date', value: now.toLocaleDateString(), description: 'Current date' },
            { name: 'current_time', value: now.toLocaleTimeString(), description: 'Current time' },
            { name: 'current_year', value: now.getFullYear().toString(), description: 'Current year' },
            { name: 'company_name', value: 'Bowman Bathrooms', description: 'Company name' },
            { name: 'company_website', value: 'www.bowmanbathrooms.com', description: 'Company website' },
            { name: 'company_phone', value: '01234 567890', description: 'Company phone number' },
        ];
    }

    // Extract variables from context
    private getContextVariables(context: TemplateContext): TemplateVariable[] {
        const variables: TemplateVariable[] = [];

        // User variables
        if (context.user) {
            variables.push(
                { name: 'user_first_name', value: context.user.firstName },
                { name: 'user_last_name', value: context.user.lastName },
                { name: 'user_full_name', value: `${context.user.firstName} ${context.user.lastName}` },
                { name: 'user_email', value: context.user.email }
            );
        }

        // Client variables
        if (context.client) {
            variables.push(
                { name: 'client_first_name', value: context.client.firstName },
                { name: 'client_last_name', value: context.client.lastName },
                { name: 'client_full_name', value: `${context.client.firstName} ${context.client.lastName}` },
                { name: 'client_email', value: context.client.email }
            );

            if (context.client.phone) {
                variables.push({ name: 'client_phone', value: context.client.phone });
            }

            if (context.client.address) {
                variables.push({ name: 'client_address', value: context.client.address });
            }
        }

        // Project variables
        if (context.project) {
            variables.push(
                { name: 'project_name', value: context.project.name },
                { name: 'project_number', value: context.project.projectNumber },
                { name: 'project_stage', value: context.project.stage }
            );

            if (context.project.value) {
                variables.push({
                    name: 'project_value',
                    value: new Intl.NumberFormat('en-GB', {
                        style: 'currency',
                        currency: 'GBP'
                    }).format(context.project.value)
                });
            }

            if (context.project.description) {
                variables.push({ name: 'project_description', value: context.project.description });
            }
        }

        // Showroom variables
        if (context.showroom) {
            variables.push(
                { name: 'showroom_name', value: context.showroom.name }
            );

            if (context.showroom.address) {
                variables.push({ name: 'showroom_address', value: context.showroom.address });
            }

            if (context.showroom.phone) {
                variables.push({ name: 'showroom_phone', value: context.showroom.phone });
            }

            if (context.showroom.email) {
                variables.push({ name: 'showroom_email', value: context.showroom.email });
            }
        }

        // Custom variables
        if (context.custom) {
            Object.entries(context.custom).forEach(([key, value]) => {
                variables.push({ name: key, value: String(value) });
            });
        }

        return variables;
    }

    // Process template content and replace variables
    public processTemplate(content: string, context: TemplateContext): string {
        const systemVars = this.getSystemVariables();
        const contextVars = this.getContextVariables(context);
        const allVariables = [...systemVars, ...contextVars];

        let processedContent = content;

        // Replace variables in format {{variable_name}}
        allVariables.forEach(variable => {
            const pattern = new RegExp(`{{\\s*${variable.name}\\s*}}`, 'gi');
            processedContent = processedContent.replace(pattern, variable.value);
        });

        // Clean up any remaining unreplaced variables
        processedContent = processedContent.replace(/{{[^}]+}}/g, '[Variable not found]');

        return processedContent;
    }

    // Get available variables for a given context
    public getAvailableVariables(context: TemplateContext): TemplateVariable[] {
        return [...this.getSystemVariables(), ...this.getContextVariables(context)];
    }

    // Validate that a template has all required variables
    public validateTemplate(content: string, context: TemplateContext): {
        isValid: boolean;
        missingVariables: string[];
        availableVariables: TemplateVariable[];
    } {
        const availableVariables = this.getAvailableVariables(context);
        const variableNames = availableVariables.map(v => v.name);

        // Extract all variables from content
        const usedVariables = [...content.matchAll(/{{([^}]+)}}/g)].map(match =>
            match[1].trim()
        );

        const missingVariables = usedVariables.filter(
            variable => !variableNames.includes(variable)
        );

        return {
            isValid: missingVariables.length === 0,
            missingVariables,
            availableVariables
        };
    }

    // Get template context from database entities
    public async buildContextFromIds(options: {
        userId?: string;
        clientId?: string;
        projectId?: string;
        showroomId?: string;
        custom?: Record<string, any>;
    }): Promise<TemplateContext> {
        const context: TemplateContext = {};

        // Load user data
        if (options.userId) {
            const user = await prisma.user.findUnique({
                where: { id: options.userId },
                select: { id: true, firstName: true, lastName: true, email: true }
            });
            if (user) context.user = user;
        }

        // Load client data
        if (options.clientId) {
            const client = await prisma.client.findUnique({
                where: { id: options.clientId },
                select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                    phone: true,
                    address: true
                }
            });
            if (client) context.client = client;
        }

        // Load project data
        if (options.projectId) {
            const project = await prisma.project.findUnique({
                where: { id: options.projectId },
                select: {
                    id: true,
                    name: true,
                    projectNumber: true,
                    stage: true,
                    value: true,
                    description: true
                }
            });
            if (project) context.project = project;
        }

        // Load showroom data
        if (options.showroomId) {
            const showroom = await prisma.showroom.findUnique({
                where: { id: options.showroomId },
                select: {
                    id: true,
                    name: true,
                    address: true,
                    phone: true,
                    email: true
                }
            });
            if (showroom) context.showroom = showroom;
        }

        // Add custom variables
        if (options.custom) {
            context.custom = options.custom;
        }

        return context;
    }

    // Process a template by ID with context
    public async processTemplateById(
        templateId: string,
        context: TemplateContext
    ): Promise<{
        subject?: string;
        body: string;
        htmlBody?: string;
        processedVariables: TemplateVariable[];
    }> {
        const template = await prisma.messageTemplate.findUnique({
            where: { id: templateId }
        });

        if (!template) {
            throw new Error('Template not found');
        }

        const processedVariables = this.getAvailableVariables(context);

        return {
            subject: template.subject ? this.processTemplate(template.subject, context) : undefined,
            body: this.processTemplate(template.body, context),
            htmlBody: template.htmlBody ? this.processTemplate(template.htmlBody, context) : undefined,
            processedVariables
        };
    }
}

// Singleton instance
export const templateService = new TemplateService();
