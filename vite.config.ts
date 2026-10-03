import { fileURLToPath, URL } from 'node:url'
import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    // 개발 중 /api 요청을 Spring Boot로 전달.
    // 브라우저 입장에서는 같은 출처이므로 세션 쿠키·CSRF 쿠키가 그대로 동작하고 CORS 설정이 필요 없음.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
      },
    },
  },
})
