import { createRouter, createWebHistory } from 'vue-router'
import { setAuthFailureHandler } from '@/api/http'
import type { Role } from '@/api/types'
import { useAuthStore } from '@/stores/auth'

declare module 'vue-router' {
  interface RouteMeta {
    /** 로그인 없이 접근 (로그인 화면) */
    public?: boolean
    /** 최소 역할 (없으면 로그인만 필요) */
    role?: Role
    /** 브라우저 탭 제목 */
    title?: string
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    { path: '/', redirect: { name: 'projects' } },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { public: true, title: '로그인' },
    },
    {
      path: '/password',
      name: 'password',
      component: () => import('@/views/PasswordChangeView.vue'),
      meta: { title: '비밀번호 변경' },
    },
    {
      path: '/projects',
      name: 'projects',
      component: () => import('@/views/ProjectListView.vue'),
      meta: { title: '프로젝트' },
    },
    {
      path: '/projects/:projectId(\\d+)',
      name: 'project',
      component: () => import('@/views/ProjectDetailView.vue'),
      props: (route) => ({ projectId: Number(route.params.projectId) }),
      meta: { title: '프로젝트' },
    },
    {
      path: '/projects/new',
      name: 'project-new',
      component: () => import('@/views/ProjectFormView.vue'),
      meta: { title: '프로젝트 등록', role: 'ADMIN' },
    },
    {
      path: '/projects/:projectId(\\d+)/edit',
      name: 'project-edit',
      component: () => import('@/views/ProjectFormView.vue'),
      props: (route) => ({ projectId: Number(route.params.projectId) }),
      meta: { title: '프로젝트 수정', role: 'ADMIN' },
    },
    {
      path: '/projects/:projectId(\\d+)/updates/new',
      name: 'update-new',
      component: () => import('@/views/UpdateFormView.vue'),
      props: (route) => ({ projectId: Number(route.params.projectId) }),
      meta: { title: '업데이트 등록', role: 'DEVELOPER' },
    },
    {
      path: '/updates/:updateId(\\d+)/edit',
      name: 'update-edit',
      component: () => import('@/views/UpdateFormView.vue'),
      props: (route) => ({ updateId: Number(route.params.updateId) }),
      meta: { title: '업데이트 수정', role: 'DEVELOPER' },
    },
    {
      path: '/projects/:projectId(\\d+)/guides/new',
      name: 'guide-new',
      component: () => import('@/views/GuideFormView.vue'),
      props: (route) => ({ projectId: Number(route.params.projectId) }),
      meta: { title: '가이드 등록', role: 'DEVELOPER' },
    },
    {
      path: '/guides/:guideId(\\d+)/edit',
      name: 'guide-edit',
      component: () => import('@/views/GuideFormView.vue'),
      props: (route) => ({ guideId: Number(route.params.guideId) }),
      meta: { title: '가이드 수정', role: 'DEVELOPER' },
    },
    {
      path: '/downloads',
      name: 'downloads',
      component: () => import('@/views/DownloadHistoryView.vue'),
      meta: { title: '다운로드 이력', role: 'DEVELOPER' },
    },
    {
      path: '/admin/users',
      name: 'users',
      component: () => import('@/views/UserManagementView.vue'),
      meta: { title: '사용자 관리', role: 'ADMIN' },
    },
    {
      path: '/admin/allowed-ips',
      name: 'allowed-ips',
      component: () => import('@/views/AllowedIpView.vue'),
      meta: { title: '허용 IP', role: 'ADMIN' },
    },
    {
      path: '/updates/:updateId(\\d+)',
      name: 'update',
      component: () => import('@/views/UpdateDetailView.vue'),
      props: (route) => ({ updateId: Number(route.params.updateId) }),
      meta: { title: '업데이트' },
    },
    {
      path: '/guides/:guideId(\\d+)',
      name: 'guide',
      component: () => import('@/views/GuideView.vue'),
      props: (route) => ({ guideId: Number(route.params.guideId) }),
      meta: { title: '가이드' },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { title: '페이지 없음' },
    },
  ],
})

/**
 * 화면 이동 전 검사 (서버 권한 검사의 "화면용 사본". 실제 보안은 서버가 담당)
 * 1. 처음 진입하면 /auth/me 로 로그인 상태 확인
 * 2. 로그인 안 했으면 로그인 화면으로 (돌아올 주소 기억)
 * 3. 임시 비밀번호 상태면 비밀번호 변경 화면으로
 * 4. 역할이 부족하면 프로젝트 목록으로
 */
router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.checked) {
    try {
      await auth.fetchMe()
    } catch {
      // 서버 연결 실패 등: 로그인 화면에서 다시 시도하게 함
    }
  }

  if (to.meta.public) {
    if (!auth.isLoggedIn) return true
    return auth.mustChangePassword ? { name: 'password' } : { name: 'projects' }
  }
  if (!auth.isLoggedIn) {
    return { name: 'login', query: to.fullPath !== '/' ? { redirect: to.fullPath } : {} }
  }
  if (auth.mustChangePassword && to.name !== 'password') {
    return { name: 'password' }
  }
  if (to.meta.role && !auth.hasRole(to.meta.role)) {
    return { name: 'projects' }
  }
  return true
})

router.afterEach((to) => {
  document.title = to.meta.title ? `${to.meta.title} · RemoteUpdate` : 'RemoteUpdate'
})

/** 사용 중 세션이 만료(401)되거나 비밀번호 변경이 필요(403)해진 경우 */
setAuthFailureHandler((error) => {
  const auth = useAuthStore()
  if (!auth.isLoggedIn) return
  if (error.code === 'PASSWORD_CHANGE_REQUIRED') {
    void router.push({ name: 'password' })
    return
  }
  auth.clear()
  const current = router.currentRoute.value
  void router.push({ name: 'login', query: { redirect: current.fullPath, expired: '1' } })
})

export default router
