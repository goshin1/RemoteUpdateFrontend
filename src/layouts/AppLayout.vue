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
        </nav>
        <div v-if="auth.me" class="user">
          <span class="user-name">{{ auth.me.name }}</span>
          <span class="badge badge-neutral">{{ roleLabel }}</span>
          <RouterLink :to="{ name: 'password' }" class="link-muted">비밀번호 변경</RouterLink>
          <button type="button" class="btn btn-ghost btn-sm" @click="logout">로그아웃</button>
        </div>
      </div>
    </header>
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

.user-name {
  color: var(--text-h);
  font-weight: 600;
}
</style>
