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
    host: true,
    // 개발 중 /api 요청을 Spring Boot로 전달.
    // 브라우저 입장에서는 같은 출처이므로 세션 쿠키·CSRF 쿠키가 그대로 동작하고 CORS 설정이 필요 없음.
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: false,
        // 실제 접속 IP 를 X-Forwarded-For 로 전달 → 휴대폰 등 다른 PC 에서 5173 으로 접속해도 서버가 그 IP 로 IP 제한을 판단
        // (Backend 의 trusted-proxies 기본값에 루프백이 들어 있어야 이 헤더를 믿음)
        xfwd: true,
      },
    },
  },
})
