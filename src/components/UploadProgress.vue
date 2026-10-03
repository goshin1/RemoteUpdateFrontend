<script setup lang="ts">
/** 업로드 진행 막대 (percent: 0~100) */
defineProps<{ percent: number }>()
</script>

<template>
  <div class="progress" role="progressbar" :aria-valuenow="percent" aria-valuemin="0" aria-valuemax="100">
    <div class="bar" :style="{ width: `${percent}%` }" />
    <span class="label">{{ percent < 100 ? `업로드 중 ${percent}%` : '서버에서 저장·체크섬 계산 중...' }}</span>
  </div>
</template>

<style scoped>
.progress {
  position: relative;
  height: 28px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
  overflow: hidden;
  margin-bottom: 16px;
}

.bar {
  height: 100%;
  background: var(--accent-bg);
  border-right: 2px solid var(--accent);
  transition: width 0.2s;
}

.label {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  color: var(--text-h);
}
</style>
