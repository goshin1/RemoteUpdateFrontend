<script setup lang="ts">
import type { HistoryAction, UpdateHistory, UpdateSnapshot } from '@/api/types'
import { formatBytes, formatDateTime } from '@/utils/format'

/** 업데이트 변경 이력. 변경 전/후 값 중 달라진 항목만 표로 보여준다 */
defineProps<{ items: UpdateHistory[] }>()

const ACTION_LABEL: Record<HistoryAction, string> = {
  CREATE: '등록',
  UPDATE: '수정',
  DISABLE: '배포 중단',
  ENABLE: '배포 재개',
}

const FIELD_LABEL: Record<keyof UpdateSnapshot, string> = {
  version: '버전',
  title: '제목',
  content: '내용',
  status: '상태',
  fileName: '파일',
  fileSize: '크기',
  checksum: 'SHA-256',
}

function display(field: keyof UpdateSnapshot, value: unknown): string {
  if (value == null || value === '') return '(없음)'
  if (field === 'fileSize') return formatBytes(value as number)
  if (field === 'status') return value === 'ACTIVE' ? '배포 중' : '중단됨'
  return String(value)
}

/** 등록은 모든 값, 그 외는 달라진 값만 */
function changes(item: UpdateHistory) {
  const fields = Object.keys(FIELD_LABEL) as (keyof UpdateSnapshot)[]
  return fields
    .filter((f) => !item.before || item.before[f] !== item.after?.[f])
    .map((f) => ({
      field: f,
      label: FIELD_LABEL[f],
      before: item.before ? display(f, item.before[f]) : null,
      after: display(f, item.after?.[f]),
    }))
}
</script>

<template>
  <div v-if="items.length === 0" class="empty">이력이 없습니다.</div>
  <ol v-else class="history">
    <li v-for="item in items" :key="item.id" class="entry">
      <div class="entry-head">
        <span class="badge" :class="item.action === 'DISABLE' ? 'badge-danger' : 'badge-neutral'">
          {{ ACTION_LABEL[item.action] }}
        </span>
        <strong>{{ item.changedByName }}</strong>
        <span class="muted">{{ formatDateTime(item.changedAt) }}</span>
      </div>
      <table class="diff">
        <tbody>
          <tr v-for="c in changes(item)" :key="c.field">
            <th>{{ c.label }}</th>
            <td v-if="c.before !== null" class="before">{{ c.before }}</td>
            <td :colspan="c.before === null ? 2 : 1" class="after">{{ c.after }}</td>
          </tr>
        </tbody>
      </table>
    </li>
  </ol>
</template>

<style scoped>
.history {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.entry {
  border: 1px solid var(--border);
  border-radius: var(--radius);
  padding: 12px 16px;
}

.entry-head {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.diff {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
  table-layout: fixed;
}

.diff th {
  width: 80px;
  text-align: left;
  color: var(--text-muted);
  font-weight: 500;
  padding: 4px 8px 4px 0;
  vertical-align: top;
}

.diff td {
  padding: 4px 8px;
  white-space: pre-line;
  overflow-wrap: anywhere;
  vertical-align: top;
}

.before {
  color: var(--danger);
  background: var(--danger-bg);
  text-decoration: line-through;
}

.after {
  color: var(--text-h);
}

.before + .after {
  color: var(--success);
  background: var(--success-bg);
}
</style>
