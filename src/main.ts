import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/dark.css'
import './assets/styles/light.css'
import './assets/styles/style.css'
import App from './App.vue'
import router from './router'
import { useUiStore } from './stores/ui'
import { useAccessStore } from './stores/access'
import { setIpBlockedHandler } from './api/http'

const pinia = createPinia()
const app = createApp(App).use(pinia)
// 헤더가 없는 화면(로그인 등)에서도 테마 상태와 body[data-theme] 가 맞도록 먼저 만들어 둔다
useUiStore(pinia)
// 허용되지 않은 IP 로 접속하면 어떤 화면이든 차단 화면으로 바꾼다
const access = useAccessStore(pinia)
setIpBlockedHandler((clientIp) => access.block(clientIp))
app.use(router).mount('#app')
