import { defineStore } from 'pinia'
import { ref } from 'vue'

/**
 * 접속 IP 차단 상태.
 * 서버가 IP_NOT_ALLOWED 로 응답하면 이 값이 채워지고, App.vue 가 모든 화면 대신 차단 화면을 보여 준다.
 * (운영 방식에서는 서버가 화면 파일부터 막아 HTML 차단 화면을 주지만, 개발 중에는 화면을 Vite 가 주므로 여기서 그린다)
 */
export const useAccessStore = defineStore('access', () => {
  /** 서버가 본 접속 IP. null 이면 차단되지 않음 */
  const blockedIp = ref<string | null>(null)
  const blocked = ref(false)

  function block(clientIp: string | undefined) {
    blocked.value = true
    blockedIp.value = clientIp ?? null
  }

  return { blocked, blockedIp, block }
})
