<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  /** 0부터 시작 */
  page: number
  totalPages: number
}>()

const emit = defineEmits<{ change: [page: number] }>()

/** 현재 페이지 주변 최대 5개 */
const pages = computed(() => {
  const start = Math.max(0, Math.min(props.page - 2, props.totalPages - 5))
  const end = Math.min(props.totalPages, start + 5)
  return Array.from({ length: end - start }, (_, i) => start + i)
})
</script>

<template>
  <nav v-if="totalPages > 1" class="pagination" aria-label="페이지">
    <button type="button" class="btn btn-sm" :disabled="page === 0" @click="emit('change', page - 1)">이전</button>
    <button
      v-for="p in pages"
      :key="p"
      type="button"
      class="btn btn-sm"
      :class="{ 'btn-primary': p === page }"
      :aria-current="p === page ? 'page' : undefined"
      @click="emit('change', p)"
    >
      {{ p + 1 }}
    </button>
    <button
      type="button"
      class="btn btn-sm"
      :disabled="page >= totalPages - 1"
      @click="emit('change', page + 1)"
    >
      다음
    </button>
  </nav>
</template>

<style scoped>
.pagination {
  display: flex;
  justify-content: center;
  gap: 6px;
  margin-top: 16px;
}
</style>
