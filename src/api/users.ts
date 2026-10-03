import { http } from './http'
import type { AdminUser, PageResponse, Role, TemporaryPasswordResult, UploadPolicy, UserOption } from './types'

export interface UserSearch {
  keyword?: string
  role?: Role
  enabled?: boolean
  page?: number
  size?: number
}

/** 관리자 전용 사용자 관리 API */
export const userApi = {
  list: (params: UserSearch) => http.get<PageResponse<AdminUser>>('/admin/users', { params }).then((r) => r.data),
  create: (form: { email: string; name: string; role: Role }) =>
    http.post<TemporaryPasswordResult>('/admin/users', form).then((r) => r.data),
  update: (id: number, form: { name: string; role: Role }) =>
    http.put<AdminUser>(`/admin/users/${id}`, form).then((r) => r.data),
  changeEnabled: (id: number, enabled: boolean) =>
    http.patch<AdminUser>(`/admin/users/${id}/status`, { enabled }).then((r) => r.data),
  resetPassword: (id: number) =>
    http.post<TemporaryPasswordResult>(`/admin/users/${id}/reset-password`).then((r) => r.data),
  /** 다운로드 이력 필터용 (개발자 이상) */
  options: () => http.get<UserOption[]>('/users/options').then((r) => r.data),
}

export const configApi = {
  /** 업로드 허용 확장자·최대 크기 (서버 설정값) */
  uploadPolicy: () => http.get<UploadPolicy>('/config/upload').then((r) => r.data),
}
