# Nexus CRM - Bowman Bathrooms

## 🛁 Overview

Nexus CRM is an enterprise-grade Customer Relationship Management platform specifically designed for Bowman Bathrooms, a premium bathroom renovation company. This comprehensive system manages the entire customer journey from initial enquiry to project completion, supporting multiple showrooms (retail and franchise) with role-based access control.

## ✨ Key Features

### 🎯 Core Business Capabilities
- **13-Stage Project Pipeline**: Complete workflow from enquiry to completion with automated gating
- **Multi-Location Support**: Retail and franchise showroom management
- **11 User Roles**: Granular permission system for different team members
- **Customer Portal**: Secure, branded portal for customers to track their projects
- **Mobile App Ready**: Dedicated mobile experience for installers and surveyors

### 🔐 Enterprise Security
- **Role-Based Access Control (RBAC)**: Granular permissions per user role
- **GDPR Compliance**: Full audit trails and data protection
- **Two-Factor Authentication**: Enhanced security for sensitive roles
- **Session Management**: Automatic timeouts and secure sessions

### 📱 Technology Stack
- **Frontend**: Next.js 15 with TypeScript, Tailwind CSS, Radix UI
- **Backend**: Next.js API Routes, NextAuth.js authentication
- **Database**: PostgreSQL with Prisma ORM
- **Real-time**: WebSocket support for live updates
- **Integrations**: Stripe, Twilio, DocuSign, and more

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- PostgreSQL database
- npm or yarn package manager

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd nexus
   npm install
   ```

2. **Environment Configuration**:
   Copy `.env` and configure your settings:
   ```bash
   cp .env.example .env
   ```
   
   Key environment variables:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/nexus_crm"
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="your-secret-key-here"
   ```

3. **Database Setup**:
   ```bash
   npm run db:push     # Push schema to database
   npm run db:seed     # Seed with demo data
   ```

4. **Start Development**:
   ```bash
   npm run dev
   ```
   
   Access the application at `http://localhost:3000`

## 👥 User Roles & Permissions

### Sales Team
- **Salesperson**: Manage own pipeline, process payments, upload documents
- **Sales Manager**: Team management, advanced reports, lead deletion
- **Regional Manager**: Multi-location oversight, regional reporting

### Operations Team  
- **Project Manager**: Project assignment, scheduling, purchase orders
- **Install Manager**: Installer scheduling, job approval, team management
- **Installer**: Mobile-only access, job viewing, photo uploads, check-ins
- **Surveyor**: Survey management, measurements, site photos

### Administrative
- **Admin**: Full system access, user management, settings
- **Director**: Executive dashboards, reports, analytics (no user management)
- **Bookkeeper**: Financial management, invoices, payments only

### External
- **Customer**: Portal access to own project, documents, payments
- **AI Assistant**: Contextual help and automation per role

## 📋 Project Pipeline Stages

1. **Enquiry** → Initial customer contact
2. **Engaged Enquiry** → Customer details captured
3. **Consultation Booked** → Appointment scheduled
4. **Qualified Lead** → Budget and requirements confirmed
5. **Survey Complete** → Site survey and measurements
6. **Design Presented** → Design proposal and quote
7. **Sale (Client Commits)** → Contract signed, deposit paid
8. **Design Sign-Off** → Final design approval
9. **75% Payment/Project Handover** → Progress payment, PM assigned
10. **Project Scheduled** → Installation dates confirmed
11. **Installation in Progress** → Active installation work
12. **Completion Sign-Off** → Final walkthrough and approval
13. **Completed** → Project closed, warranty issued

Each stage has specific gating requirements that must be completed before advancement.

## 🏢 Multi-Location Architecture

### Retail Showrooms
- Managed by head office
- Full reporting and oversight
- Centralized inventory and pricing

### Franchise Locations
- Independent data management
- Franchisee-only access to their data
- Shared branding and templates
- Head office reporting and benchmarking

## 🔌 Integrations

### Financial
- **Stripe**: Payment processing and invoicing
- **Xero**: Accounting system integration

### Communications
- **Twilio**: SMS, voice calls, call recording
- **WhatsApp**: Customer messaging
- **Mailchimp**: Email marketing campaigns
- **Outlook**: Calendar and email synchronization

### Documentation
- **DocuSign**: Electronic signatures
- **OneDrive**: Document storage and sharing

### Workflow
- **Zapier**: Process automation
- **Google Maps**: Navigation and location services
- **Trustpilot**: Review management
- **OpenAI**: AI-powered assistance

## 📱 Mobile Application

### Installer App Features
- Daily job schedules with navigation
- GPS check-in/check-out tracking
- Photo uploads and progress reporting
- Digital checklists and sign-offs
- Real-time communication with office
- Offline-first data capture

### Surveyor App Features
- Survey scheduling and management
- Measurement capture tools
- Site photography with annotations
- Customer interaction logging
- Specification requirements entry

## 🛠️ Development

### Project Structure
```
nexus/
├── src/
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable UI components
│   ├── lib/                # Utilities and configurations
│   ├── types/              # TypeScript type definitions
│   └── styles/             # Global styles and themes
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── seed.ts            # Demo data seeding
├── public/                 # Static assets
└── docs/                  # Additional documentation
```

### Available Scripts
```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint
npm run type-check   # TypeScript type checking
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:migrate   # Run database migrations
npm run db:seed      # Seed database with demo data
npm run db:studio    # Open Prisma Studio
```

### Demo Accounts
After seeding the database, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@bowmanbathrooms.com | password123 |
| Sales Manager | sarah.johnson@bowmanbathrooms.com | password123 |
| Salesperson | james.smith@bowmanbathrooms.com | password123 |
| Project Manager | emma.wilson@bowmanbathrooms.com | password123 |
| Install Manager | david.brown@bowmanbathrooms.com | password123 |
| Installer | tom.davis@bowmanbathrooms.com | password123 |
| Surveyor | lisa.taylor@bowmanbathrooms.com | password123 |
| Director | robert.bowman@bowmanbathrooms.com | password123 |
| Bookkeeper | jennifer.clark@bowmanbathrooms.com | password123 |

## 🔒 Security Considerations

### Data Protection
- All user actions are logged for audit purposes
- Sensitive data encrypted at rest and in transit
- GDPR-compliant data handling and retention
- Regular automated backups

### Access Control
- Role-based permissions with principle of least privilege
- Session timeouts for inactive users
- Two-factor authentication for administrative roles
- IP-based access restrictions available

### Compliance
- Full audit trail of all system activities
- Data retention policies configurable per region
- GDPR right-to-be-forgotten implementation
- Secure file upload with virus scanning

## 📊 Reporting & Analytics

### Dashboard Features
- Role-specific KPI dashboards
- Real-time pipeline visualization
- Performance metrics by user/location
- Financial reporting and forecasting

### Key Metrics
- **Conversion Rates**: By stage, source, and timeframe
- **Customer Lifetime Value (LTV)**
- **Customer Acquisition Cost (CAC)**
- **LTV/CAC Ratios**: Profitability analysis
- **Pipeline Velocity**: Time between stages
- **Team Performance**: Individual and group metrics

### Export Options
- CSV, XLSX, PDF formats
- Scheduled automated reports
- Email delivery to stakeholders
- API access for external systems

## 🚢 Deployment

### Production Requirements
- Node.js 18+ runtime environment
- PostgreSQL 13+ database
- Redis for session storage (recommended)
- SSL certificate for HTTPS
- CDN for static asset delivery

### Environment Variables
Ensure all required environment variables are configured:
- Database connections
- Authentication secrets
- Integration API keys
- Email/SMS service credentials
- File storage configuration

### Scaling Considerations
- Horizontal scaling supported via load balancers
- Database read replicas for reporting
- CDN integration for global performance
- Background job processing with queues

## 📞 Support

### Technical Support
- System administrators have full audit access
- Comprehensive error logging and monitoring
- Health check endpoints for monitoring
- Performance metrics collection

### Business Support
- User training materials included
- Role-specific help documentation
- Video tutorials for common tasks
- In-app contextual help system

## 📝 License

Proprietary software developed for Bowman Bathrooms. All rights reserved.

## 🤝 Contributing

This is a private enterprise system. For feature requests or bug reports, please contact the development team through official channels.

---

**Nexus CRM** - Transforming bathroom renovations through technology
© 2025 Bowman Bathrooms. All rights reserved.
