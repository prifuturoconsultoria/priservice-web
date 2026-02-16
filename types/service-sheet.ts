/**
 * TypeScript interfaces for Service Sheets
 * Matching Spring Boot REST API structure from API-SPRING-BOOT.md
 */

// Service Sheet Line (multiple days per sheet)
export interface ServiceSheetLine {
  id?: string
  lineNumber: number
  serviceDate: string // ISO date format: "YYYY-MM-DD"
  startTime: string // Time format: "HH:mm"
  endTime: string // Time format: "HH:mm"
  description?: string // Optional description for this day
  hours?: number // Calculated by backend
}

// Project information (populated by API)
export interface ProjectInfo {
  id: string
  name: string
  company: string
  clientResponsible?: string
  partnerResponsible?: string
  totalHours: number
  usedHours: number
  availableHours?: number // Calculated: totalHours - usedHours
}

// User/Profile information
export interface ProfileInfo {
  id: string
  fullName: string
  email: string
  role?: "admin" | "technician" | "observer"
}

// Complete Service Sheet (from API responses)
export interface ServiceSheet {
  id: string
  projectId: string
  project?: ProjectInfo // Populated by API with JOIN
  subject: string
  clientContactName: string
  clientContactEmail: string
  clientContactPhone?: string
  ccEmails?: string[] // NEW: Carbon copy recipients
  activityDescription: string
  lines: ServiceSheetLine[] // NEW: Multiple work days
  totalHours: number // Sum of all line hours
  status: "pending" | "approved" | "rejected"
  approvalToken: string
  clientFeedback?: string
  approvedAt?: string // ISO datetime
  createdBy?: ProfileInfo // Populated by API with JOIN
  createdAt: string // ISO datetime
  updatedAt: string // ISO datetime
}

// DTO for creating a new service sheet
export interface CreateServiceSheetDto {
  projectId: string
  subject: string
  clientContactName: string
  clientContactEmail: string
  clientContactPhone?: string
  ccEmails?: string[]
  activityDescription: string
  lines: Omit<ServiceSheetLine, "id" | "hours">[] // Include lineNumber, backend calculates hours
}

// DTO for updating a service sheet
export interface UpdateServiceSheetDto {
  projectId?: string
  subject?: string
  clientContactName?: string
  clientContactEmail?: string
  clientContactPhone?: string
  ccEmails?: string[]
  activityDescription?: string
  lines?: Omit<ServiceSheetLine, "id" | "hours">[] // Include lineNumber, backend calculates hours
}

// DTO for approval/rejection
export interface ApprovalDto {
  approverEmail: string // Required for email validation
  feedback?: string // Optional client feedback
  approved: boolean // true = approve, false = reject
}

// Filters for listing service sheets
export interface ServiceSheetFilters {
  page?: number
  size?: number
  status?: "pending" | "approved" | "rejected"
  projectId?: string
}

// Paginated response
export interface PaginatedResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

// API Error response
export interface ApiError {
  status: number
  message: string
  timestamp?: string
  path?: string
}

// API Success response
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Project hours info (for validation during creation)
export interface ProjectHoursInfo {
  projectId: string
  projectName: string
  totalHours: number
  usedHours: number
  availableHours: number
  percentageUsed: number
}
