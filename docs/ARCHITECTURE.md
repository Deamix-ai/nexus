# Nexus CRM - Technical Architecture & Deployment Guide

## 🏗️ System Architecture

### Overview
Nexus CRM is built as a modern, scalable web application with a companion mobile app for field operations. The system follows enterprise-grade security and performance patterns.

### Core Components

#### 1. Web Application (Next.js)
- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript for type safety
- **Styling**: Tailwind CSS with custom Bowman Bathrooms branding
- **UI Components**: Radix UI primitives for accessibility
- **Authentication**: NextAuth.js with role-based permissions

#### 2. Database Layer
- **Database**: PostgreSQL for robust ACID transactions
- **ORM**: Prisma for type-safe database operations
- **Schema**: Comprehensive entity relationships supporting multi-tenancy
- **Migrations**: Versioned schema changes with rollback support

#### 3. API Layer
- **API Routes**: Next.js API routes for backend functionality
- **Authentication**: JWT-based sessions with role validation
- **Rate Limiting**: Protection against abuse and DoS attacks
- **Validation**: Zod schemas for request/response validation

#### 4. Real-time Features
- **WebSockets**: Live updates for project status changes
- **Push Notifications**: Browser and mobile app notifications
- **Live Chat**: Real-time messaging between team members

#### 5. Mobile Application
- **Framework**: React Native with Expo for cross-platform deployment
- **Offline Support**: SQLite for local data caching
- **Sync**: Background synchronization with the main system
- **GPS Integration**: Location tracking for installer check-ins

## 🔐 Security Architecture

### Authentication & Authorization
```
User Request → NextAuth.js → Role Validation → Permission Check → API Access
```

### Data Protection
- **Encryption at Rest**: Database-level encryption for sensitive data
- **Encryption in Transit**: TLS 1.3 for all communications
- **API Security**: CORS, CSRF protection, input sanitization
- **File Uploads**: Virus scanning and type validation

### Audit & Compliance
- **Audit Logs**: All user actions logged with timestamps
- **GDPR Compliance**: Data retention policies and right-to-erasure
- **Backup Strategy**: Automated daily backups with point-in-time recovery

## 📊 Database Schema Highlights

### Core Entities
```sql
-- Users with role-based permissions
Users (id, email, role, showroomId, permissions, twoFactorEnabled)

-- Multi-tenant showroom support
Showrooms (id, name, type, address, settings, branding)

-- 13-stage project pipeline
Projects (id, projectNumber, stage, status, clientInfo, assignments)

-- Comprehensive audit trail
AuditLogs (id, action, entityType, entityId, userId, timestamp, metadata)
```

### Key Relationships
- **Users ← → Showrooms**: Multi-location support
- **Projects → Users**: Dynamic assignment by stage
- **Activities → Projects**: Complete interaction history
- **Documents → Projects**: Secure file management

## 🚀 Deployment Architecture

### Production Environment
```
Internet → Load Balancer → Next.js Instances → PostgreSQL Cluster
                      ↓
                   Redis Cache → File Storage (S3/OneDrive)
```

### Recommended Infrastructure

#### Application Servers
- **CPU**: 2+ cores per instance
- **RAM**: 4GB+ per instance
- **Storage**: SSD for application files
- **Network**: 1Gbps minimum

#### Database
- **PostgreSQL 13+**: Primary with read replicas
- **CPU**: 4+ cores
- **RAM**: 8GB+ (16GB recommended)
- **Storage**: SSD with IOPS 1000+

#### Caching Layer
- **Redis**: Session storage and application cache
- **CDN**: Static asset delivery (CloudFlare/AWS CloudFront)

### Scaling Strategy

#### Horizontal Scaling
```typescript
// Load balancer configuration
const instances = [
  { host: 'app1.nexus.bowman', weight: 1 },
  { host: 'app2.nexus.bowman', weight: 1 },
  { host: 'app3.nexus.bowman', weight: 1 }
];

// Database read replicas for reporting
const dbConfig = {
  write: 'postgres://master.db.nexus',
  read: [
    'postgres://replica1.db.nexus',
    'postgres://replica2.db.nexus'
  ]
};
```

## 📱 Mobile App Architecture

### Offline-First Design
```typescript
// Local SQLite schema mirrors server
interface LocalJob {
  id: string;
  projectId: string;
  status: 'pending' | 'in_progress' | 'completed';
  syncStatus: 'synced' | 'pending_sync' | 'conflict';
  photos: LocalPhoto[];
  checkIns: LocalCheckIn[];
}

// Sync strategy
class SyncManager {
  async syncToServer(): Promise<void> {
    const pendingChanges = await this.getUnsyncedChanges();
    
    for (const change of pendingChanges) {
      try {
        await this.uploadChange(change);
        await this.markAsSynced(change);
      } catch (error) {
        await this.handleSyncError(change, error);
      }
    }
  }
}
```

### Real-time Features
- **Background Sync**: Automatic data synchronization
- **Push Notifications**: Job updates and messages
- **GPS Tracking**: Accurate location logging
- **Photo Management**: Optimized image capture and upload

## 🔌 Integration Architecture

### Third-party Integrations
```typescript
// Integration factory pattern
abstract class IntegrationService {
  abstract authenticate(): Promise<void>;
  abstract syncData(data: any): Promise<void>;
  abstract handleWebhook(payload: any): Promise<void>;
}

class StripeIntegration extends IntegrationService {
  async createPaymentIntent(amount: number): Promise<string> {
    // Stripe API integration
  }
}

class TwilioIntegration extends IntegrationService {
  async sendSMS(to: string, message: string): Promise<void> {
    // Twilio API integration
  }
}
```

### Webhook Management
```typescript
// Centralized webhook handler
app.post('/api/webhooks/:service', async (req, res) => {
  const service = req.params.service;
  const signature = req.headers['x-signature'];
  
  // Verify webhook signature
  if (!verifySignature(service, signature, req.body)) {
    return res.status(401).json({ error: 'Invalid signature' });
  }
  
  // Process webhook
  await webhookProcessor.process(service, req.body);
  res.status(200).json({ received: true });
});
```

## 📈 Performance Optimization

### Frontend Optimization
- **Code Splitting**: Dynamic imports for route-based splitting
- **Image Optimization**: Next.js Image component with WebP
- **Caching**: Aggressive caching of static assets
- **Lazy Loading**: Components loaded on demand

### Backend Optimization
- **Database Indexing**: Optimized queries with proper indexes
- **Connection Pooling**: Efficient database connection management
- **Background Jobs**: Heavy processing moved to queues
- **API Response Caching**: Redis caching for frequent queries

### Monitoring & Analytics
```typescript
// Performance monitoring
import { performance } from 'perf_hooks';

function withTiming<T extends (...args: any[]) => any>(fn: T): T {
  return ((...args: any[]) => {
    const start = performance.now();
    const result = fn(...args);
    const end = performance.now();
    
    // Log performance metrics
    logger.info('Performance', {
      function: fn.name,
      duration: end - start,
      args: args.length
    });
    
    return result;
  }) as T;
}
```

## 🛠️ Development Workflow

### Local Development Setup
```bash
# Database setup
docker run --name nexus-postgres -e POSTGRES_PASSWORD=password -p 5432:5432 -d postgres:13

# Application setup
npm install
npm run db:push
npm run db:seed
npm run dev
```

### Testing Strategy
```typescript
// Unit tests with Jest
describe('Project Pipeline', () => {
  test('should advance stage when requirements met', async () => {
    const project = await createTestProject();
    const canAdvance = await checkStageRequirements(project.id, 'DESIGN_PRESENTED');
    expect(canAdvance).toBe(true);
  });
});

// E2E tests with Playwright
test('Sales workflow', async ({ page }) => {
  await page.goto('/dashboard/sales');
  await page.click('[data-testid="new-project"]');
  await page.fill('[data-testid="client-name"]', 'Test Client');
  await page.click('[data-testid="save-project"]');
  
  await expect(page.locator('.project-card')).toContainText('Test Client');
});
```

### CI/CD Pipeline
```yaml
# .github/workflows/deploy.yml
name: Deploy to Production
on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
      - run: npm ci
      - run: npm run test
      - run: npm run type-check
      
  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - run: npm run build
      - run: docker build -t nexus-crm .
      - run: docker push ${{ secrets.REGISTRY_URL }}/nexus-crm
```

## 🔧 Configuration Management

### Environment Variables
```bash
# Core Application
DATABASE_URL="postgresql://user:pass@host:5432/nexus"
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://nexus.bowmanbathrooms.com"

# Integrations
STRIPE_SECRET_KEY="sk_live_..."
TWILIO_AUTH_TOKEN="..."
DOCUSIGN_INTEGRATION_KEY="..."

# Infrastructure
REDIS_URL="redis://cache.nexus.internal:6379"
S3_BUCKET="nexus-documents"
CDN_URL="https://cdn.nexus.bowmanbathrooms.com"
```

### Feature Flags
```typescript
// Feature flag system
class FeatureFlags {
  static isEnabled(flag: string, user?: User): boolean {
    const flags = {
      'new-dashboard': user?.role === 'ADMIN',
      'mobile-app': ['INSTALLER', 'SURVEYOR'].includes(user?.role),
      'advanced-reporting': user?.showroom?.type === 'RETAIL'
    };
    
    return flags[flag] || false;
  }
}
```

## 📋 Operational Procedures

### Backup & Recovery
```bash
# Daily automated backup
pg_dump $DATABASE_URL | gzip > backup-$(date +%Y%m%d).sql.gz

# Point-in-time recovery
pg_restore --clean --if-exists -d $DATABASE_URL backup-20250628.sql.gz
```

### Health Monitoring
```typescript
// Health check endpoint
app.get('/health', async (req, res) => {
  const checks = {
    database: await checkDatabase(),
    redis: await checkRedis(),
    integrations: await checkIntegrations()
  };
  
  const isHealthy = Object.values(checks).every(check => check.status === 'ok');
  const statusCode = isHealthy ? 200 : 503;
  
  res.status(statusCode).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    checks,
    timestamp: new Date().toISOString()
  });
});
```

### Log Management
```typescript
// Structured logging
const logger = winston.createLogger({
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

## 📞 Support & Maintenance

### User Support
- **Help Documentation**: In-app contextual help
- **Video Tutorials**: Role-specific training materials
- **Support Tickets**: Integrated support system
- **User Forums**: Community-driven assistance

### System Maintenance
- **Regular Updates**: Monthly security and feature updates
- **Database Maintenance**: Weekly optimization and cleanup
- **Performance Monitoring**: 24/7 system health monitoring
- **Capacity Planning**: Proactive scaling based on usage patterns

---

This technical architecture ensures Nexus CRM can scale with Bowman Bathrooms' growth while maintaining enterprise-grade security, performance, and reliability.
