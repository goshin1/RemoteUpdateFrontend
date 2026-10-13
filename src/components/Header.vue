<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useUiStore } from '@/stores/ui'
import { ROLE_LABEL } from '@/utils/format'

const auth = useAuthStore()
const ui = useUiStore()
const router = useRouter()

const roleLabel = computed(() => (auth.me ? ROLE_LABEL[auth.me.role] : ''))

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <header class="header">
    <div class="header-inner">
      <RouterLink :to="{ name: 'projects' }" class="brand">RemoteUpdate</RouterLink>
      <nav v-if="!auth.mustChangePassword" class="nav">
        <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
        <!-- 메뉴 숨김은 "편의"일 뿐, 실제 권한 검사는 서버가 한다 -->
        <RouterLink v-if="auth.hasRole('DEVELOPER')" :to="{ name: 'downloads' }">다운로드 이력</RouterLink>
        <RouterLink v-if="auth.hasRole('ADMIN')" :to="{ name: 'users' }">사용자 관리</RouterLink>
        <RouterLink v-if="auth.hasRole('ADMIN')" :to="{ name: 'allowed-ips' }">허용 IP</RouterLink>
      </nav>
      <div v-if="auth.me" class="user">
        <span class="user-name">{{ auth.me.name }}</span>
        <span class="badge badge-neutral">{{ roleLabel }}</span>
        <RouterLink :to="{ name: 'password' }" class="link-muted">비밀번호 변경</RouterLink>
        <button type="button" class="btn btn-ghost btn-sm" @click="logout">로그아웃</button>
      </div>
      <!-- 아이콘은 "전환할 테마"를 보여준다: 다크일 때 해, 라이트일 때 달 -->
      <button
          type="button"
          class="btn btn-ghost btn-sm theme-toggle"
          :title="ui.isDark ? '라이트 테마로 전환' : '다크 테마로 전환'"
          :aria-label="ui.isDark ? '라이트 테마로 전환' : '다크 테마로 전환'"
          @click="ui.toggleTheme()"
      >
        <svg v-if="ui.isDark" viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
        <svg v-else viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
        <span class="theme-label">{{ ui.isDark ? '라이트' : '다크' }}</span>
      </button>
    </div>
  </header>
</template>

<style scoped>
.header {
  background: var(--glass-header-bg);
  border-bottom: 1px solid var(--glass-border);
  -webkit-backdrop-filter: blur(var(--glass-blur));
  backdrop-filter: blur(var(--glass-blur));
}

.header-inner {
  max-width: 1120px;
  margin: 0 auto;
  padding: 12px 16px;
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.brand {
  font-weight: 700;
  font-size: 17px;
  color: var(--color-text-primary);
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 16px;
}

.nav a {
  color: var(--color-text-secondary);
  text-decoration: none;
  padding: 4px 0;
  transition: color 0.15s;
}

.nav a:hover {
  color: var(--color-text-primary);
}

.nav a.router-link-active {
  color: var(--color-primary);
  font-weight: 600;
}

.user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.theme-toggle {
  margin-left: auto;
  color: var(--color-text-secondary);
}

/* 사용자 영역이 있으면 그쪽이 오른쪽 정렬을 맡는다 */
.user + .theme-toggle {
  margin-left: 0;
}

.theme-toggle svg {
  fill: none;
  stroke: currentcolor;
  stroke-width: 2;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.theme-toggle .theme-label {
  font-size: 12px;
}

.ip-banner {
  padding: 10px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--color-warning);
  background: var(--color-warning-soft);
  border-bottom: 1px solid var(--color-border);
}

.user-name {
  color: var(--color-text-primary);
  font-weight: 600;
}
</style>