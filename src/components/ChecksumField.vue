<script setup lang="ts">
import { ref } from 'vue'

const props = defineProps<{ value: string }>()
const copied = ref(false)

async function copy() {
  try {
    await navigator.clipboard.writeText(props.value)
    copied.value = true
    setTimeout(() => (copied.value = false), 1500)
  } catch {
    // 클립보드 권한이 없는 환경(http 원격 접속 등): 직접 선택해서 복사
  }
}
</script>

<template>
  <div class="checksum">
    <code class="value">{{ value }}</code>
    <button type="button" class="btn btn-sm" @click="copy">{{ copied ? '복사됨' : '복사' }}</button>
  </div>
</template>

<style scoped>
.checksum {
  display: flex;
  align-items: center;
  gap: 8px;
}

.value {
  flex: 1;
  min-width: 0;
  padding: 6px 8px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  font-size: 13px;
  overflow-wrap: anywhere;
  user-select: all;
}
</style>
