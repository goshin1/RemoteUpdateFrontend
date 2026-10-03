// Backend API 응답 타입 (Backend DTO 와 1:1 대응)

export type Role = 'STAFF' | 'DEVELOPER' | 'ADMIN'
export type UpdateStatus = 'ACTIVE' | 'DISABLED'
export type HistoryAction = 'CREATE' | 'UPDATE' | 'DISABLE' | 'ENABLE'

/** 서버 오류 응답 (예: { code: "UPDATE_DISABLED", message: "..." }) */
export interface ApiError {
  code: string
  message: string
}

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export interface Me {
  id: number
  email: string
  name: string
  role: Role
  mustChangePassword: boolean
}

export interface Project {
  id: number
  name: string
  description: string | null
  createdAt: string
  updatedAt: string
}

export interface Update {
  id: number
  projectId: number
  version: string
  title: string
  content: string | null
  status: UpdateStatus
  fileName: string
  fileSize: number
  checksum: string
  developerId: number
  developerName: string
  createdAt: string
  updatedAt: string
}

export interface Guide {
  id: number
  projectId: number
  title: string
  content: string | null
  hasAttachment: boolean
  fileName: string | null
  fileSize: number | null
  createdById: number
  createdByName: string
  createdAt: string
  updatedAt: string
}
