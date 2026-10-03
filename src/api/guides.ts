import { http } from './http'
import type { ProgressHandler } from './updates'
import type { Guide } from './types'

export interface GuideForm {
  title: string
  content: string
}

function progressConfig(onProgress?: ProgressHandler) {
  return {
    onUploadProgress: (e: { loaded: number; total?: number }) => {
      if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100))
    },
  }
}

export const guideApi = {
  get: (id: number) => http.get<Guide>(`/guides/${id}`).then((r) => r.data),

  /** 등록 (multipart: title, content, file 선택) */
  create: (projectId: number, form: GuideForm, file: File | null, onProgress?: ProgressHandler) => {
    const data = new FormData()
    data.append('title', form.title)
    data.append('content', form.content)
    if (file) data.append('file', file)
    return http.post<Guide>(`/projects/${projectId}/guides`, data, progressConfig(onProgress)).then((r) => r.data)
  },

  /** 제목·본문 수정 (JSON) */
  update: (id: number, form: GuideForm) => http.put<Guide>(`/guides/${id}`, form).then((r) => r.data),

  /** 첨부 파일 추가·교체 */
  replaceAttachment: (id: number, file: File, onProgress?: ProgressHandler) => {
    const data = new FormData()
    data.append('file', file)
    return http.post<Guide>(`/guides/${id}/attachment`, data, progressConfig(onProgress)).then((r) => r.data)
  },

  attachmentUrl: (id: number) => `/api/v1/guides/${id}/attachment`,
}
