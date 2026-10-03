import { http } from './http'
import type { Update, UpdateHistory, UpdateStatus } from './types'

export interface UpdateCreateForm {
  version: string
  title: string
  content: string
  file: File
}

/** 업로드 진행률 콜백 (0~100) */
export type ProgressHandler = (percent: number) => void

export const updateApi = {
  get: (id: number) => http.get<Update>(`/updates/${id}`).then((r) => r.data),

  /**
   * 업데이트 등록 (multipart/form-data).
   * FormData 를 넘기면 axios 가 Content-Type 과 경계(boundary)를 자동으로 붙인다.
   * onUploadProgress 로 대용량 파일 업로드 진행률을 받는다.
   */
  create: (projectId: number, form: UpdateCreateForm, onProgress?: ProgressHandler) => {
    const data = new FormData()
    data.append('version', form.version)
    data.append('title', form.title)
    data.append('content', form.content)
    data.append('file', form.file)
    return http
      .post<Update>(`/projects/${projectId}/updates`, data, {
        onUploadProgress: (e) => {
          if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
        },
      })
      .then((r) => r.data)
  },

  /** 제목·내용만 수정 (버전·파일은 바꿀 수 없음) */
  updateMeta: (id: number, form: { title: string; content: string }) =>
    http.put<Update>(`/updates/${id}`, form).then((r) => r.data),

  changeStatus: (id: number, status: UpdateStatus) =>
    http.patch<Update>(`/updates/${id}/status`, { status }).then((r) => r.data),

  history: (id: number) => http.get<UpdateHistory[]>(`/updates/${id}/history`).then((r) => r.data),

  /** 다운로드는 axios 가 아니라 <a href> 로 (대용량 파일을 브라우저 메모리에 올리지 않기 위해) */
  downloadUrl: (id: number) => `/api/v1/updates/${id}/download`,
}
