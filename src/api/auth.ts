import { http } from './http'
import type { Me } from './types'

export const authApi = {
  me: () => http.get<Me>('/auth/me').then((r) => r.data),
  login: (email: string, password: string) =>
    http.post<Me>('/auth/login', { email, password }).then((r) => r.data),
  logout: () => http.post<void>('/auth/logout'),
  changePassword: (currentPassword: string, newPassword: string) =>
    http.put<Me>('/auth/password', { currentPassword, newPassword }).then((r) => r.data),
}
