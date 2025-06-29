# Copilot Instructions for Nexus CRM

<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

## Project Overview
This is the Nexus CRM platform for Bowman Bathrooms - a premium bathroom renovation company. This is an enterprise-grade, full-stack Next.js application with TypeScript.

## Key Requirements
- **User Roles**: Support 11 distinct user roles with specific permissions (Salesperson, Sales Manager, Regional Manager, Project Manager, Install Manager, Installer, Surveyor, Admin, Director, Bookkeeper, Customer, AI Assistant)
- **Pipeline Management**: 13-stage project pipeline with strict gating logic
- **Multi-location Support**: Handle retail and franchise showrooms
- **Mobile App**: Dedicated React Native app for installers and surveyors
- **Customer Portal**: Secure branded portal for customers
- **Integrations**: Stripe, Twilio, DocuSign, Zapier, Outlook, Xero, WhatsApp, Mailchimp, Google Maps, OneDrive, Trustpilot, AI/ChatGPT

## Architecture Guidelines
- Use Next.js App Router with TypeScript
- Implement role-based authentication with NextAuth.js
- Use Prisma ORM with PostgreSQL for database
- Follow enterprise security patterns (GDPR compliance, audit logs, 2FA)
- Implement real-time features with WebSockets
- Use Tailwind CSS for premium, branded styling
- Ensure mobile-first, responsive design

## Code Standards
- All components should be strongly typed with TypeScript
- Implement comprehensive error handling and validation
- Follow Next.js best practices for SSR/SSG
- Use server components where possible for performance
- Implement proper SEO and accessibility
- All user actions must be logged for audit purposes
- Follow GDPR compliance patterns

## Database Considerations
- Design for multi-tenancy (showrooms/franchises)
- Implement soft deletes for audit trail
- Use proper indexing for performance
- Store all file uploads securely
- Implement data retention policies

## Security Requirements
- Role-based access control (RBAC)
- Session management and timeouts
- Data encryption at rest and in transit
- Input validation and sanitization
- Rate limiting on APIs
- Secure file upload handling
