import { http } from './http'
import type { Guide, PageResponse, Project, Update, UpdateStatus } from './types'

export const projectApi = {
  list: () => http.get<Project[]>('/projects').then((r) => r.data),
  get: (id: number) => http.get<Project>(`/projects/${id}`).then((r) => r.data),
  updates: (id: number, params: { page?: number; size?: number; status?: UpdateStatus }) =>
    http.get<PageResponse<Update>>(`/projects/${id}/updates`, { params }).then((r) => r.data),
  guides: (id: number) => http.get<Guide[]>(`/projects/${id}/guides`).then((r) => r.data),
}

export const updateApi = {
  get: (id: number) => http.get<Update>(`/updates/${id}`).then((r) => r.data),
  /** 다운로드는 axios 가 아니라 <a href> 로 (대용량 파일을 브라우저 메모리에 올리지 않기 위해) */
  downloadUrl: (id: number) => `/api/v1/updates/${id}/download`,
}

export const guideApi = {
  get: (id: number) => http.get<Guide>(`/guides/${id}`).then((r) => r.data),
  attachmentUrl: (id: number) => `/api/v1/guides/${id}/attachment`,
}
