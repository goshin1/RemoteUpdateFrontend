import { http } from './http'
import type { DownloadHistory, PageResponse } from './types'

export interface DownloadSearch {
  projectId?: number
  updateId?: number
  userId?: number
  /** yyyy-MM-dd */
  from?: string
  /** yyyy-MM-dd (포함) */
  to?: string
  page?: number
  size?: number
}

export const downloadApi = {
  search: (params: DownloadSearch) =>
    http.get<PageResponse<DownloadHistory>>('/downloads', { params }).then((r) => r.data),
}
