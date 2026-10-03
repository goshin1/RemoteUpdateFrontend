import { http } from './http'
import type { AllowedIp, AllowedIpOverview } from './types'

/** 관리 기능 허용 IP (관리자) */
export const allowedIpApi = {
  overview: () => http.get<AllowedIpOverview>('/admin/allowed-ips').then((r) => r.data),
  add: (form: { ipOrCidr: string; description: string }) =>
    http.post<AllowedIp>('/admin/allowed-ips', form).then((r) => r.data),
  changeEnabled: (id: number, enabled: boolean) =>
    http.patch<AllowedIp>(`/admin/allowed-ips/${id}`, { enabled }).then((r) => r.data),
  remove: (id: number) => http.delete<void>(`/admin/allowed-ips/${id}`),
}
