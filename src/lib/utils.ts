import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(
  amount: number,
  currency: string = "GBP",
  locale: string = "en-GB"
): string {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount)
}

export function formatDate(
  date: Date | string,
  format: "short" | "long" | "relative" = "short"
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date
  
  if (format === "relative") {
    const now = new Date()
    const diffTime = Math.abs(now.getTime() - dateObj.getTime())
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Yesterday"
    if (diffDays < 7) return `${diffDays} days ago`
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)} weeks ago`
    return `${Math.ceil(diffDays / 30)} months ago`
  }
  
  return dateObj.toLocaleDateString("en-GB", {
    year: "numeric",
    month: format === "long" ? "long" : "short",
    day: "numeric",
  })
}

export function generateProjectNumber(): string {
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Math.random().toString(36).substring(2, 5).toUpperCase()
  return `BWN-${timestamp}-${random}`
}

export function calculateMargin(cost: number, price: number): number {
  if (price === 0) return 0
  return ((price - cost) / price) * 100
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

export function validatePhone(phone: string): boolean {
  const phoneRegex = /^(\+44|0)[1-9]\d{8,9}$/
  return phoneRegex.test(phone.replace(/\s/g, ""))
}

export function formatPhoneNumber(phone: string): string {
  const cleaned = phone.replace(/\D/g, "")
  
  if (cleaned.startsWith("44")) {
    return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 6)} ${cleaned.slice(6)}`
  }
  
  if (cleaned.startsWith("0")) {
    return `${cleaned.slice(0, 4)} ${cleaned.slice(4, 7)} ${cleaned.slice(7)}`
  }
  
  return phone
}

export function truncateText(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.slice(0, maxLength) + "..."
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

export function generatePassword(length: number = 12): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*"
  let password = ""
  
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  
  return password
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

export const ROLES = {
  SALESPERSON: "SALESPERSON",
  SALES_MANAGER: "SALES_MANAGER",
  REGIONAL_MANAGER: "REGIONAL_MANAGER",
  PROJECT_MANAGER: "PROJECT_MANAGER",
  INSTALL_MANAGER: "INSTALL_MANAGER",
  INSTALLER: "INSTALLER",
  SURVEYOR: "SURVEYOR",
  ADMIN: "ADMIN",
  DIRECTOR: "DIRECTOR",
  BOOKKEEPER: "BOOKKEEPER",
  CUSTOMER: "CUSTOMER",
  AI_ASSISTANT: "AI_ASSISTANT",
} as const

export const PROJECT_STAGES = {
  ENQUIRY: "ENQUIRY",
  ENGAGED_ENQUIRY: "ENGAGED_ENQUIRY",
  CONSULTATION_BOOKED: "CONSULTATION_BOOKED",
  QUALIFIED_LEAD: "QUALIFIED_LEAD",
  SURVEY_COMPLETE: "SURVEY_COMPLETE",
  DESIGN_PRESENTED: "DESIGN_PRESENTED",
  SALE_CLIENT_COMMITS: "SALE_CLIENT_COMMITS",
  DESIGN_SIGN_OFF: "DESIGN_SIGN_OFF",
  PAYMENT_75_PROJECT_HANDOVER: "PAYMENT_75_PROJECT_HANDOVER",
  PROJECT_SCHEDULED: "PROJECT_SCHEDULED",
  INSTALLATION_IN_PROGRESS: "INSTALLATION_IN_PROGRESS",
  COMPLETION_SIGN_OFF: "COMPLETION_SIGN_OFF",
  COMPLETED: "COMPLETED",
  LOST_NOT_PROCEEDING: "LOST_NOT_PROCEEDING",
} as const

export const PRIORITIES = {
  LOW: "LOW",
  MEDIUM: "MEDIUM",
  HIGH: "HIGH",
  URGENT: "URGENT",
} as const

export type Role = keyof typeof ROLES
export type ProjectStage = keyof typeof PROJECT_STAGES
export type Priority = keyof typeof PRIORITIES
