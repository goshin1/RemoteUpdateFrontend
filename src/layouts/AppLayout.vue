<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { ROLE_LABEL } from '@/utils/format'

const auth = useAuthStore()
const router = useRouter()

const roleLabel = computed(() => (auth.me ? ROLE_LABEL[auth.me.role] : ''))

async function logout() {
  await auth.logout()
  await router.push({ name: 'login' })
}
</script>

<template>
  <div class="layout">
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
      </div>
    </header>
    <!-- 관리 기능을 쓸 수 없는 위치에서 접속한 개발자·관리자에게 미리 안내 (서버가 IP 제한으로 막기 전에) -->
    <div v-if="auth.me && auth.hasRole('DEVELOPER') && !auth.me.managementAllowed" class="ip-banner" role="status">
      현재 접속 위치(<code>{{ auth.me.clientIp }}</code>)에서는 등록·수정 같은 관리 기능을 쓸 수 없습니다. 조회와 다운로드는 가능합니다.
    </div>
    <main class="container">
      <slot />
    </main>
  </div>
</template>

<style scoped>
.header {
  background: var(--surface);
  border-bottom: 1px solid var(--border);
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
  color: var(--text-h);
  text-decoration: none;
}

.nav {
  display: flex;
  gap: 16px;
}

.nav a {
  color: var(--text);
  text-decoration: none;
  padding: 4px 0;
}

.nav a.router-link-active {
  color: var(--accent);
  font-weight: 600;
}

.user {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
}

.ip-banner {
  padding: 10px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--warning);
  background: var(--warning-bg);
  border-bottom: 1px solid var(--border);
}

.user-name {
  color: var(--text-h);
  font-weight: 600;
}
</style>
