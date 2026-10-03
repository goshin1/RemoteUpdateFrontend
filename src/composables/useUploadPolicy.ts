import { ref } from 'vue'
import { configApi } from '@/api/users'
import type { UploadPolicy } from '@/api/types'

/**
 * 업로드 정책(허용 확장자·최대 크기)을 서버에서 한 번만 받아 여러 화면이 같이 쓴다.
 * "composable" = Vue 의 상태+로직 재사용 함수. 이름은 관례상 useXxx.
 */
const policy = ref<UploadPolicy | null>(null)
let loading: Promise<void> | null = null

export function useUploadPolicy() {
  if (!policy.value && !loading) {
    // 이 Promise 를 저장해 두고 ready() 에서 기다린다 → 정책을 받기 전에 파일을 골라도 검사가 빠지지 않음
    loading = configApi
      .uploadPolicy()
      .then((p) => {
        policy.value = p
      })
      .catch(() => {
        // 정책을 못 받아도 업로드는 가능 (최종 검사는 서버)
      })
  }

  /** 정책 조회가 끝날 때까지 기다림 (이미 받았으면 바로 끝남) */
  const ready = () => loading ?? Promise.resolve()

  /** 파일 선택 창 필터 (예: ".zip,.exe") */
  const accept = () => policy.value?.allowedExtensions.map((e) => `.${e}`).join(',') ?? ''

  /** 올리기 전에 미리 확인. 문제가 없으면 빈 문자열 */
  function check(file: File): string {
    const p = policy.value
    if (!p) return ''
    const ext = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase() : ''
    if (!p.allowedExtensions.includes(ext)) {
      return `허용되지 않은 파일 형식입니다. 허용: ${p.allowedExtensions.join(', ')}`
    }
    if (file.size > p.maxFileSizeBytes) {
      return `파일이 너무 큽니다. 최대 ${Math.round(p.maxFileSizeBytes / 1024 / 1024)}MB`
    }
    if (file.size === 0) return '빈 파일은 올릴 수 없습니다.'
    return ''
  }

  return { policy, accept, check, ready }
}
