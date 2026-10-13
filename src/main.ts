import { createApp } from 'vue'
import { createPinia } from 'pinia'
import './assets/styles/dark.css'
import './assets/styles/light.css'
import './assets/styles/style.css'
import App from './App.vue'
import router from './router'
import { useUiStore } from './stores/ui'

const pinia = createPinia()
const app = createApp(App).use(pinia)
// 헤더가 없는 화면(로그인 등)에서도 테마 상태와 body[data-theme] 가 맞도록 먼저 만들어 둔다
useUiStore(pinia)
app.use(router).mount('#app')
