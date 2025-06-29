import { UserRole } from '@prisma/client'

// Permission system for role-based access control
export interface Permission {
  resource: string
  actions: string[]
  conditions?: Record<string, any>
}

export interface RoleConfig {
  permissions: Permission[]
  dashboardUrl: string
  canAccessMobile: boolean
  requiresTwoFactor: boolean
}

// Define permissions for each role
export const ROLE_PERMISSIONS: Record<UserRole, RoleConfig> = {
  SALESPERSON: {
    permissions: [
      {
        resource: 'projects',
        actions: ['read', 'create', 'update'],
        conditions: { assignedTo: 'self' }
      },
      {
        resource: 'customers',
        actions: ['read', 'create', 'update'],
        conditions: { projectAssignedTo: 'self' }
      },
      {
        resource: 'invoices',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'documents',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'activities',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'messages',
        actions: ['read', 'create']
      }
    ],
    dashboardUrl: '/dashboard/sales',
    canAccessMobile: false,
    requiresTwoFactor: false
  },
  
  SALES_MANAGER: {
    permissions: [
      {
        resource: 'projects',
        actions: ['read', 'create', 'update', 'delete'],
        conditions: { showroom: 'same' }
      },
      {
        resource: 'customers',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'users',
        actions: ['read', 'update'],
        conditions: { role: ['SALESPERSON'], showroom: 'same' }
      },
      {
        resource: 'reports',
        actions: ['read', 'export'],
        conditions: { showroom: 'same' }
      },
      {
        resource: 'targets',
        actions: ['read', 'create', 'update']
      }
    ],
    dashboardUrl: '/dashboard/sales-management',
    canAccessMobile: false,
    requiresTwoFactor: true
  },
  
  REGIONAL_MANAGER: {
    permissions: [
      {
        resource: 'projects',
        actions: ['read', 'create', 'update', 'delete'],
        conditions: { region: 'managed' }
      },
      {
        resource: 'showrooms',
        actions: ['read', 'update'],
        conditions: { region: 'managed' }
      },
      {
        resource: 'users',
        actions: ['read', 'create', 'update'],
        conditions: { region: 'managed' }
      },
      {
        resource: 'reports',
        actions: ['read', 'export'],
        conditions: { region: 'managed' }
      }
    ],
    dashboardUrl: '/dashboard/regional',
    canAccessMobile: false,
    requiresTwoFactor: true
  },
  
  PROJECT_MANAGER: {
    permissions: [
      {
        resource: 'projects',
        actions: ['read', 'update'],
        conditions: { assignedTo: 'self' }
      },
      {
        resource: 'schedules',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'checklists',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'communications',
        actions: ['read', 'create']
      },
      {
        resource: 'purchaseOrders',
        actions: ['read', 'create', 'update']
      }
    ],
    dashboardUrl: '/dashboard/projects',
    canAccessMobile: true,
    requiresTwoFactor: false
  },
  
  INSTALL_MANAGER: {
    permissions: [
      {
        resource: 'installations',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'installers',
        actions: ['read', 'assign']
      },
      {
        resource: 'schedules',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'checkIns',
        actions: ['read', 'approve']
      }
    ],
    dashboardUrl: '/dashboard/installations',
    canAccessMobile: true,
    requiresTwoFactor: false
  },
  
  INSTALLER: {
    permissions: [
      {
        resource: 'jobs',
        actions: ['read'],
        conditions: { assignedTo: 'self' }
      },
      {
        resource: 'checkIns',
        actions: ['create']
      },
      {
        resource: 'photos',
        actions: ['create']
      },
      {
        resource: 'reports',
        actions: ['create']
      }
    ],
    dashboardUrl: '/mobile/installer',
    canAccessMobile: true,
    requiresTwoFactor: false
  },
  
  SURVEYOR: {
    permissions: [
      {
        resource: 'surveys',
        actions: ['read', 'create', 'update'],
        conditions: { assignedTo: 'self' }
      },
      {
        resource: 'photos',
        actions: ['create']
      },
      {
        resource: 'measurements',
        actions: ['create', 'update']
      }
    ],
    dashboardUrl: '/mobile/surveyor',
    canAccessMobile: true,
    requiresTwoFactor: false
  },
  
  ADMIN: {
    permissions: [
      {
        resource: '*',
        actions: ['*']
      }
    ],
    dashboardUrl: '/dashboard/admin',
    canAccessMobile: false,
    requiresTwoFactor: true
  },
  
  DIRECTOR: {
    permissions: [
      {
        resource: 'reports',
        actions: ['read', 'export']
      },
      {
        resource: 'dashboards',
        actions: ['read']
      },
      {
        resource: 'analytics',
        actions: ['read']
      }
    ],
    dashboardUrl: '/dashboard/executive',
    canAccessMobile: false,
    requiresTwoFactor: true
  },
  
  BOOKKEEPER: {
    permissions: [
      {
        resource: 'invoices',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'payments',
        actions: ['read', 'create', 'update']
      },
      {
        resource: 'financial-reports',
        actions: ['read', 'export']
      }
    ],
    dashboardUrl: '/dashboard/finance',
    canAccessMobile: false,
    requiresTwoFactor: true
  },
  
  CUSTOMER: {
    permissions: [
      {
        resource: 'own-project',
        actions: ['read']
      },
      {
        resource: 'own-documents',
        actions: ['read', 'download']
      },
      {
        resource: 'own-invoices',
        actions: ['read', 'pay']
      },
      {
        resource: 'own-messages',
        actions: ['read', 'create']
      }
    ],
    dashboardUrl: '/portal/customer',
    canAccessMobile: false,
    requiresTwoFactor: false
  },
  
  AI_ASSISTANT: {
    permissions: [
      {
        resource: 'context-data',
        actions: ['read'],
        conditions: { roleContext: 'assigned' }
      }
    ],
    dashboardUrl: '/ai/assistant',
    canAccessMobile: false,
    requiresTwoFactor: false
  }
}

// Stage gating requirements
export const STAGE_REQUIREMENTS: Record<ProjectStage, string[]> = {
  ENQUIRY: [],
  
  ENGAGED_ENQUIRY: [
    'initial_contact_logged',
    'client_details_captured'
  ],
  
  CONSULTATION_BOOKED: [
    'consultation_scheduled',
    'client_confirmed'
  ],
  
  QUALIFIED_LEAD: [
    'consultation_completed',
    'budget_confirmed',
    'timeline_agreed'
  ],
  
  SURVEY_COMPLETE: [
    'survey_scheduled',
    'survey_completed',
    'measurements_captured',
    'photos_uploaded'
  ],
  
  DESIGN_PRESENTED: [
    'design_created',
    'design_presented_to_client',
    'quote_provided'
  ],
  
  SALE_CLIENT_COMMITS: [
    'contract_signed',
    'deposit_paid',
    'terms_agreed'
  ],
  
  DESIGN_SIGN_OFF: [
    'final_design_approved',
    'specifications_confirmed',
    'client_sign_off'
  ],
  
  PAYMENT_75_PROJECT_HANDOVER: [
    'progress_payment_received',
    'project_manager_assigned',
    'handover_completed'
  ],
  
  PROJECT_SCHEDULED: [
    'installation_scheduled',
    'materials_ordered',
    'team_assigned'
  ],
  
  INSTALLATION_IN_PROGRESS: [
    'installation_started',
    'daily_progress_logged'
  ],
  
  COMPLETION_SIGN_OFF: [
    'installation_completed',
    'quality_check_passed',
    'client_walkthrough',
    'client_sign_off'
  ],
  
  COMPLETED: [
    'final_payment_received',
    'warranty_issued',
    'project_closed'
  ],
  
  LOST_NOT_PROCEEDING: [
    'reason_documented'
  ]
}

export function hasPermission(
  userRole: Role,
  resource: string,
  action: string,
  context?: Record<string, any>
): boolean {
  const roleConfig = ROLE_PERMISSIONS[userRole]
  
  // Admin has all permissions
  if (userRole === 'ADMIN') return true
  
  // Check if role has permission for this resource and action
  for (const permission of roleConfig.permissions) {
    if (permission.resource === '*' || permission.resource === resource) {
      if (permission.actions.includes('*') || permission.actions.includes(action)) {
        // Check conditions if they exist
        if (permission.conditions && context) {
          return checkConditions(permission.conditions, context)
        }
        return true
      }
    }
  }
  
  return false
}

function checkConditions(
  conditions: Record<string, any>,
  context: Record<string, any>
): boolean {
  for (const [key, value] of Object.entries(conditions)) {
    if (Array.isArray(value)) {
      if (!value.includes(context[key])) return false
    } else if (value !== context[key]) {
      return false
    }
  }
  return true
}

export function canAdvanceStage(
  currentStage: ProjectStage,
  nextStage: ProjectStage,
  completedRequirements: string[]
): { canAdvance: boolean; missingRequirements: string[] } {
  const required = STAGE_REQUIREMENTS[nextStage] || []
  const missing = required.filter(req => !completedRequirements.includes(req))
  
  return {
    canAdvance: missing.length === 0,
    missingRequirements: missing
  }
}

export function getRequiredDocuments(stage: ProjectStage): string[] {
  const documentRequirements: Record<ProjectStage, string[]> = {
    ENQUIRY: [],
    ENGAGED_ENQUIRY: ['enquiry_form'],
    CONSULTATION_BOOKED: ['consultation_confirmation'],
    QUALIFIED_LEAD: ['consultation_notes', 'budget_form'],
    SURVEY_COMPLETE: ['survey_report', 'measurements', 'site_photos'],
    DESIGN_PRESENTED: ['design_presentation', 'quote'],
    SALE_CLIENT_COMMITS: ['signed_contract', 'deposit_receipt'],
    DESIGN_SIGN_OFF: ['final_design', 'specification_sheet', 'client_approval'],
    PAYMENT_75_PROJECT_HANDOVER: ['progress_payment_receipt', 'handover_document'],
    PROJECT_SCHEDULED: ['installation_schedule', 'purchase_orders'],
    INSTALLATION_IN_PROGRESS: ['daily_reports', 'progress_photos'],
    COMPLETION_SIGN_OFF: ['completion_certificate', 'client_sign_off'],
    COMPLETED: ['final_payment_receipt', 'warranty_certificate'],
    LOST_NOT_PROCEEDING: ['loss_reason_report']
  }
  
  return documentRequirements[stage] || []
}
