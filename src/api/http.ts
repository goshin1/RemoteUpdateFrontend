import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import type { ApiError } from './types'

/**
 * 공통 API 클라이언트.
 * - 세션 쿠키 기반 인증이므로 withCredentials 사용
 * - CSRF: 서버가 내려준 XSRF-TOKEN 쿠키를 상태 변경 요청(POST/PUT/PATCH/DELETE)에 X-XSRF-TOKEN 헤더로 자동 첨부
 *   쿠키가 아직 없으면 요청 전에 GET /auth/csrf 로 먼저 받아온다
 */
export const http = axios.create({
  baseURL: '/api/v1',
  withCredentials: true,
  withXSRFToken: true,
  xsrfCookieName: 'XSRF-TOKEN',
  xsrfHeaderName: 'X-XSRF-TOKEN',
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
})

const SAFE_METHODS = ['get', 'head', 'options']

function hasCsrfCookie(): boolean {
  return document.cookie.split(';').some((c) => c.trim().startsWith('XSRF-TOKEN='))
}

let csrfRequest: Promise<unknown> | null = null

/** CSRF 쿠키 확보 (동시에 여러 요청이 와도 한 번만 호출) */
export function ensureCsrfCookie(): Promise<unknown> {
  if (hasCsrfCookie()) {
    return Promise.resolve()
  }
  csrfRequest ??= axios.get('/api/v1/auth/csrf', { withCredentials: true }).finally(() => {
    csrfRequest = null
  })
  return csrfRequest
}

http.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  const method = (config.method ?? 'get').toLowerCase()
  if (!SAFE_METHODS.includes(method)) {
    await ensureCsrfCookie()
  }
  return config
})

/** 인증 관련 응답을 받았을 때 처리할 함수 (router 에서 등록 — 순환 참조 방지) */
type AuthFailureHandler = (error: ApiError, status: number) => void
let onAuthFailure: AuthFailureHandler | null = null

export function setAuthFailureHandler(handler: AuthFailureHandler) {
  onAuthFailure = handler
}

http.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const status = error.response?.status
    const body = error.response?.data
    if (status && body?.code && onAuthFailure) {
      // 세션 만료(401) 또는 비밀번호 변경 필요(403 PASSWORD_CHANGE_REQUIRED)
      if ((status === 401 && body.code === 'UNAUTHORIZED') || body.code === 'PASSWORD_CHANGE_REQUIRED') {
        onAuthFailure(body, status)
      }
    }
    return Promise.reject(error)
  },
)

/** 오류 객체에서 사용자에게 보여줄 메시지를 꺼낸다 */
export function errorMessage(error: unknown, fallback = '요청을 처리하지 못했습니다. 잠시 후 다시 시도하세요.'): string {
  if (axios.isAxiosError<ApiError>(error)) {
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    // 응답이 없거나, 서버 형식({ code, message })이 아닌 5xx (예: 개발 중 Backend 가 꺼져 있어 Vite 프록시가 대신 응답)
    if (!error.response || (error.response.status >= 500 && !error.response.data?.code)) {
      return '서버에 연결할 수 없습니다. 잠시 후 다시 시도하세요.'
    }
  }
  return fallback
}

/** 오류 코드 (예: 'DUPLICATE_VERSION') */
export function errorCode(error: unknown): string | undefined {
  return axios.isAxiosError<ApiError>(error) ? error.response?.data?.code : undefined
}
