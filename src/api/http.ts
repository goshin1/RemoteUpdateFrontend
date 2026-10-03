import axios from 'axios'

/**
 * 공통 API 클라이언트.
 * - 세션 쿠키 기반 인증이므로 withCredentials 사용
 * - Spring Security CookieCsrfTokenRepository 가 내려주는 XSRF-TOKEN 쿠키를
 *   상태 변경 요청(POST/PUT/PATCH/DELETE)에 X-XSRF-TOKEN 헤더로 자동 첨부
 * - 401 처리(로그인 화면 이동)는 Phase 4에서 인터셉터로 추가
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

/** 서버 오류 응답 형식 (예: { code: "UPDATE_DISABLED", message: "..." }) */
export interface ApiError {
  code: string
  message: string
}
