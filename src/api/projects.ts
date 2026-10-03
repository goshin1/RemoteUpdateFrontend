import { http } from './http'
import type { Guide, PageResponse, Project, Update, UpdateStatus } from './types'

export interface ProjectForm {
  name: string
  description: string
}

export const projectApi = {
  list: () => http.get<Project[]>('/projects').then((r) => r.data),
  get: (id: number) => http.get<Project>(`/projects/${id}`).then((r) => r.data),
  create: (form: ProjectForm) => http.post<Project>('/projects', form).then((r) => r.data),
  update: (id: number, form: ProjectForm) => http.put<Project>(`/projects/${id}`, form).then((r) => r.data),
  updates: (id: number, params: { page?: number; size?: number; status?: UpdateStatus }) =>
    http.get<PageResponse<Update>>(`/projects/${id}/updates`, { params }).then((r) => r.data),
  guides: (id: number) => http.get<Guide[]>(`/projects/${id}/guides`).then((r) => r.data),
}
