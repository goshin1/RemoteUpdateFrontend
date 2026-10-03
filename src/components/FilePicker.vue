<script setup lang="ts">
import { ref } from 'vue'
import { useUploadPolicy } from '@/composables/useUploadPolicy'
import { formatBytes } from '@/utils/format'

/**
 * 파일 선택 + 미리 검사(확장자·크기).
 * v-model 로 선택한 File(또는 null)을 부모에게 전달한다.
 */
const model = defineModel<File | null>({ default: null })
defineProps<{ id: string; required?: boolean }>()

const { policy, accept, check, ready } = useUploadPolicy()
const error = ref('')
const input = ref<HTMLInputElement | null>(null)

async function onChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0] ?? null
  await ready() // 화면을 열자마자 파일을 고른 경우, 서버의 업로드 정책을 받은 뒤에 검사
  error.value = file ? check(file) : ''
  model.value = file && !error.value ? file : null
  if (error.value && input.value) input.value.value = ''
}
</script>

<template>
  <div class="picker">
    <input :id="id" ref="input" type="file" :accept="accept()" :required="required" @change="onChange" />
    <span v-if="model" class="hint">{{ model.name }} · {{ formatBytes(model.size) }}</span>
    <span v-else-if="policy" class="hint">
      허용: {{ policy.allowedExtensions.join(', ') }} · 최대 {{ formatBytes(policy.maxFileSizeBytes) }}
    </span>
    <span v-if="error" class="hint error" role="alert">{{ error }}</span>
  </div>
</template>

<style scoped>
.picker {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.error {
  color: var(--danger) !important;
}
</style>
