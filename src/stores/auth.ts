import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import axios from 'axios'
import { authApi } from '@/api/auth'
import type { Me, Role } from '@/api/types'

const ROLE_LEVEL: Record<Role, number> = { STAFF: 0, DEVELOPER: 1, ADMIN: 2 }

/** 로그인 사용자 상태. 세션은 서버(쿠키)에 있고, 여기는 화면 표시·권한 분기용 사본 */
export const useAuthStore = defineStore('auth', () => {
  const me = ref<Me | null>(null)
  /** 앱 시작 후 /auth/me 를 한 번이라도 확인했는지 */
  const checked = ref(false)

  const isLoggedIn = computed(() => me.value !== null)
  const mustChangePassword = computed(() => me.value?.mustChangePassword ?? false)

  /** ADMIN ⊃ DEVELOPER ⊃ STAFF */
  function hasRole(role: Role): boolean {
    return me.value !== null && ROLE_LEVEL[me.value.role] >= ROLE_LEVEL[role]
  }

  async function fetchMe(): Promise<Me | null> {
    try {
      me.value = await authApi.me()
    } catch (e) {
      if (axios.isAxiosError(e) && e.response?.status === 401) {
        me.value = null
      } else {
        throw e
      }
    } finally {
      checked.value = true
    }
    return me.value
  }

  async function login(email: string, password: string) {
    me.value = await authApi.login(email, password)
    checked.value = true
    return me.value
  }

  async function logout() {
    try {
      await authApi.logout()
    } finally {
      clear()
    }
  }

  async function changePassword(currentPassword: string, newPassword: string) {
    me.value = await authApi.changePassword(currentPassword, newPassword)
  }

  /** 세션 만료 등으로 로그인 정보를 지움 */
  function clear() {
    me.value = null
  }

  return { me, checked, isLoggedIn, mustChangePassword, hasRole, fetchMe, login, logout, changePassword, clear }
})
