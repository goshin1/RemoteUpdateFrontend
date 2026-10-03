<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { useAuthStore } from '@/stores/auth'

/** Backend PasswordPolicy 와 같은 규칙 (최종 검사는 서버가 함) */
const PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d).{8,64}$/

const auth = useAuthStore()
const router = useRouter()
const forced = auth.mustChangePassword

const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const submitting = ref(false)
const error = ref('')
const done = ref(false)

const ruleOk = computed(() => PASSWORD_RULE.test(newPassword.value))
const matchOk = computed(() => confirmPassword.value.length > 0 && newPassword.value === confirmPassword.value)
const canSubmit = computed(() => currentPassword.value && ruleOk.value && matchOk.value && !submitting.value)

async function submit() {
  if (!canSubmit.value) return
  error.value = ''
  submitting.value = true
  try {
    await auth.changePassword(currentPassword.value, newPassword.value)
    done.value = true
    currentPassword.value = ''
    newPassword.value = ''
    confirmPassword.value = ''
    if (forced) {
      await router.replace({ name: 'projects' })
    }
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <div class="narrow">
    <h1>비밀번호 변경</h1>
    <div v-if="forced" class="alert alert-warning">
      관리자가 발급한 임시 비밀번호로 로그인했습니다. 새 비밀번호로 변경한 뒤 이용할 수 있습니다.
    </div>
    <div v-if="done" class="alert alert-info">비밀번호를 변경했습니다.</div>
    <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

    <form class="card" @submit.prevent="submit">
      <div class="field">
        <label for="current">현재 비밀번호</label>
        <input id="current" v-model="currentPassword" type="password" autocomplete="current-password" required />
      </div>
      <div class="field">
        <label for="new">새 비밀번호</label>
        <input id="new" v-model="newPassword" type="password" autocomplete="new-password" required />
        <span class="hint" :class="{ ok: ruleOk }">영문과 숫자를 포함해 8~64자</span>
      </div>
      <div class="field">
        <label for="confirm">새 비밀번호 확인</label>
        <input id="confirm" v-model="confirmPassword" type="password" autocomplete="new-password" required />
        <span v-if="confirmPassword && !matchOk" class="hint error">새 비밀번호와 일치하지 않습니다.</span>
      </div>
      <button type="submit" class="btn btn-primary" :disabled="!canSubmit">
        {{ submitting ? '변경 중...' : '변경' }}
      </button>
    </form>
  </div>
</template>

<style scoped>
.narrow {
  max-width: 440px;
}

.hint.ok {
  color: var(--success);
}

.hint.error {
  color: var(--danger);
}
</style>
