<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

const auth = useAuthStore()
const route = useRoute()
const router = useRouter()

const email = ref('')
const password = ref('')
const submitting = ref(false)
const error = ref('')
const expired = route.query.expired === '1'

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    const me = await auth.login(email.value.trim(), password.value)
    if (me.mustChangePassword) {
      await router.replace({ name: 'password' })
      return
    }
    const redirect = typeof route.query.redirect === 'string' && route.query.redirect.startsWith('/')
      ? route.query.redirect
      : '/projects'
    await router.replace(redirect)
  } catch (e) {
    error.value = errorMessage(e)
    password.value = ''
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <form class="card login-card" @submit.prevent="submit">
      <h1>RemoteUpdate</h1>
      <p class="muted intro">프로젝트별 초기 세팅 가이드와 업데이트 파일 배포</p>

      <div v-if="expired && !error" class="alert alert-info">로그인 시간이 만료되었습니다. 다시 로그인하세요.</div>
      <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

      <div class="field">
        <label for="email">이메일</label>
        <input id="email" v-model="email" type="email" autocomplete="username" required autofocus />
      </div>
      <div class="field">
        <label for="password">비밀번호</label>
        <input id="password" v-model="password" type="password" autocomplete="current-password" required />
      </div>
      <button type="submit" class="btn btn-primary btn-lg submit" :disabled="submitting">
        {{ submitting ? '로그인 중...' : '로그인' }}
      </button>
      <p class="muted help">계정이 없거나 비밀번호를 잊었다면 시스템 관리자에게 문의하세요.</p>
    </form>
  </div>
</template>

<style scoped>
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  background: var(--surface);
}

.login-card {
  width: 100%;
  max-width: 380px;
  padding: 32px 28px;
}

.intro {
  margin: 0 0 24px;
  font-size: 14px;
}

.submit {
  width: 100%;
  margin-top: 4px;
}

.help {
  margin: 16px 0 0;
  font-size: 13px;
  text-align: center;
}
</style>
