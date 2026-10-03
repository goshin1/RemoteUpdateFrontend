<script setup lang="ts">
import type { TemporaryPasswordResult } from '@/api/types'
import ChecksumField from './ChecksumField.vue'
import ModalDialog from './ModalDialog.vue'

/**
 * 임시 비밀번호 안내. 서버는 해시만 저장하므로 이 창을 닫으면 다시 볼 수 없다.
 * (다시 필요하면 비밀번호 초기화로 새로 발급)
 */
defineProps<{ result: TemporaryPasswordResult; title: string }>()
const emit = defineEmits<{ close: [] }>()
</script>

<template>
  <ModalDialog :title="title" @close="emit('close')">
    <p>
      <strong>{{ result.user.name }}</strong> ({{ result.user.email }}) 계정의 임시 비밀번호입니다.
    </p>
    <ChecksumField :value="result.temporaryPassword" />
    <div class="alert alert-warning notice">
      이 창을 닫으면 다시 볼 수 없습니다. 사용자에게 전달하세요. 사용자는 첫 로그인 때 새 비밀번호로 바꿔야 합니다.
    </div>
    <div class="actions">
      <button type="button" class="btn btn-primary" @click="emit('close')">확인</button>
    </div>
  </ModalDialog>
</template>

<style scoped>
.notice {
  margin: 16px 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
