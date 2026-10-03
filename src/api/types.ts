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

/** 변경 이력. before/after 는 그 시점의 업데이트 값 (CREATE 는 before 가 null) */
export interface UpdateSnapshot {
  version: string
  title: string
  content: string | null
  status: UpdateStatus
  fileName: string
  fileSize: number
  checksum: string
}

export interface UpdateHistory {
  id: number
  action: HistoryAction
  changedById: number
  changedByName: string
  before: UpdateSnapshot | null
  after: UpdateSnapshot | null
  changedAt: string
}

export interface DownloadHistory {
  id: number
  projectId: number
  projectName: string
  updateId: number
  version: string
  fileName: string
  userId: number
  downloaderName: string
  clientIp: string
  downloadedAt: string
}

/** 관리자 화면의 사용자 정보 */
export interface AdminUser {
  id: number
  email: string
  name: string
  role: Role
  enabled: boolean
  mustChangePassword: boolean
  locked: boolean
  lockedUntil: string | null
  createdAt: string
  updatedAt: string
}

/** 사용자 등록·비밀번호 초기화 결과. temporaryPassword 는 이 응답에서만 볼 수 있음 */
export interface TemporaryPasswordResult {
  user: AdminUser
  temporaryPassword: string
}

export interface UserOption {
  id: number
  name: string
  email: string
}

export interface UploadPolicy {
  allowedExtensions: string[]
  maxFileSizeBytes: number
}
