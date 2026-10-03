import { createRouter, createWebHistory } from 'vue-router'

// 역할 검사·비밀번호 변경 강제 가드는 Phase 4에서 추가
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('@/views/HomeView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      redirect: '/',
    },
  ],
})

export default router
