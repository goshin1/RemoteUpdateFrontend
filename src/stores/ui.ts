import { defineStore } from 'pinia'
import { computed, ref, watch } from 'vue'

export type Theme = 'dark' | 'light'

/** index.html 의 초기 테마 스크립트와 같은 키를 써야 한다 */
const THEME_STORAGE_KEY = 'theme'
const DEFAULT_THEME: Theme = 'dark'

function isTheme(value: unknown): value is Theme {
  return value === 'dark' || value === 'light'
}

function loadTheme(): Theme {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (isTheme(saved)) return saved
  } catch {
    // 저장소 접근이 막힌 환경(사생활 보호 모드 등)에서는 기본값
  }
  return DEFAULT_THEME
}

/** 화면 표시 상태. 테마는 여기서만 바꾸고, body[data-theme] 와 localStorage 는 이 스토어가 맞춘다 */
export const useUiStore = defineStore('ui', () => {
  const theme = ref<Theme>(loadTheme())
  const isDark = computed(() => theme.value === 'dark')

  function toggleTheme() {
    theme.value = isDark.value ? 'light' : 'dark'
  }

  watch(
    theme,
    (value) => {
      document.body.dataset.theme = value
      try {
        localStorage.setItem(THEME_STORAGE_KEY, value)
      } catch {
        // 저장 실패 시에도 현재 화면에는 적용된다
      }
    },
    { immediate: true },
  )

  return { theme, isDark, toggleTheme }
})
