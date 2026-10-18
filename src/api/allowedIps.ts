import { http } from './http'
import type { AllowedIp, AllowedIpOverview } from './types'

/** 사이트 접속 허용 IP (관리자) */
export const allowedIpApi = {
  overview: () => http.get<AllowedIpOverview>('/admin/allowed-ips').then((r) => r.data),
  /** expiresAt: "2026-10-17T18:00:00" 형식의 로컬 시각, null 이면 상시 */
  add: (form: { ipOrCidr: string; description: string; expiresAt: string | null }) =>
    http.post<AllowedIp>('/admin/allowed-ips', form).then((r) => r.data),
  changeExpiresAt: (id: number, expiresAt: string | null) =>
    http.put<AllowedIp>(`/admin/allowed-ips/${id}/expires-at`, { expiresAt }).then((r) => r.data),
  changeEnabled: (id: number, enabled: boolean) =>
    http.patch<AllowedIp>(`/admin/allowed-ips/${id}`, { enabled }).then((r) => r.data),
  remove: (id: number) => http.delete<void>(`/admin/allowed-ips/${id}`),
}
