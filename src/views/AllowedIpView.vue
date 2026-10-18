<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { allowedIpApi } from '@/api/allowedIps'
import { errorCode, errorMessage } from '@/api/http'
import type { AllowedIp, AllowedIpOverview } from '@/api/types'
import { formatDateTime } from '@/utils/format'

/**
 * 사이트 접속 허용 IP (관리자).
 *
 * IP 제한이 켜져 있으면(서버 설정 IP_FILTER_ENABLED=true) 여기 등록된 IP 에서만 사이트에 접속할 수 있습니다.
 * 그 외 IP 는 로그인 화면 대신 "허용되지 않은 IP입니다." + 현재 접속 IP 만 보입니다.
 * - 사무실: 상시 등록
 * - 현장 지원: 현장 직원이 전화로 알려 준 IP 를 만료 시간을 정해 임시 등록 → 지원이 끝나면 삭제
 *
 * 스스로 잠기지 않도록, 지금 접속한 IP 를 막게 되는 끄기·삭제는 서버가 거부합니다.
 */
type ExpiryOption = '2h' | 'today' | 'always'

const EXPIRY_LABEL: Record<ExpiryOption, string> = {
  '2h': '2시간',
  today: '오늘까지',
  always: '상시',
}

const overview = ref<AllowedIpOverview | null>(null)
const form = reactive<{ ipOrCidr: string; description: string; expiry: ExpiryOption }>({
  ipOrCidr: '',
  description: '',
  expiry: 'today',
})
const error = ref('')
const notice = ref('')
const saving = ref(false)

/** 서버는 시간대 없는 로컬 시각(LocalDateTime)을 받으므로 "2026-10-17T18:00:00" 형식으로 만든다 (toISOString 은 UTC 라 쓰지 않음) */
function toLocalDateTime(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

function expiresAtOf(option: ExpiryOption): string | null {
  const now = new Date()
  if (option === '2h') return toLocalDateTime(new Date(now.getTime() + 2 * 60 * 60 * 1000))
  if (option === 'today') {
    const end = new Date(now)
    end.setHours(23, 59, 59, 0)
    return toLocalDateTime(end)
  }
  return null
}

/** 남은 시간 표시 (예: "1시간 20분 남음") */
function remaining(item: AllowedIp): string {
  if (!item.expiresAt || item.expired) return ''
  const minutes = Math.max(0, Math.round((new Date(item.expiresAt).getTime() - Date.now()) / 60000))
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return h > 0 ? `${h}시간 ${m}분 남음` : `${m}분 남음`
}

async function load() {
  try {
    overview.value = await allowedIpApi.overview()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function add() {
  error.value = ''
  notice.value = ''
  saving.value = true
  try {
    const added = await allowedIpApi.add({
      ipOrCidr: form.ipOrCidr.trim(),
      description: form.description.trim(),
      expiresAt: expiresAtOf(form.expiry),
    })
    notice.value = `${added.ipOrCidr} 을(를) ${EXPIRY_LABEL[form.expiry]} 허용으로 등록했습니다.`
    form.ipOrCidr = ''
    form.description = ''
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

function fillMyIp() {
  if (overview.value) form.ipOrCidr = overview.value.clientIp
}

async function toggle(item: AllowedIp) {
  error.value = ''
  try {
    await allowedIpApi.changeEnabled(item.id, !item.enabled)
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

/** 기간 변경 (연장·상시 전환). select 에서 고르면 바로 적용하고 선택을 되돌린다 */
async function changeExpiry(item: AllowedIp, event: Event) {
  const select = event.target as HTMLSelectElement
  const option = select.value as ExpiryOption | ''
  select.value = ''
  if (!option) return
  error.value = ''
  notice.value = ''
  try {
    await allowedIpApi.changeExpiresAt(item.id, expiresAtOf(option))
    notice.value = `${item.ipOrCidr} 을(를) ${EXPIRY_LABEL[option]} 허용으로 바꿨습니다.`
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function remove(item: AllowedIp) {
  if (!window.confirm(`${item.ipOrCidr} 을(를) 삭제할까요? 이 IP 는 바로 접속할 수 없게 됩니다.`)) return
  error.value = ''
  try {
    await allowedIpApi.remove(item.id)
    notice.value = `${item.ipOrCidr} 을(를) 삭제했습니다.`
    await load()
  } catch (e) {
    error.value = errorMessage(e)
    if (errorCode(e) === 'CANNOT_LOCK_OUT_SELF') {
      error.value += ' (서버 PC 에서 접속하면 항상 허용됩니다.)'
    }
  }
}

onMounted(load)
</script>

<template>
  <div class="page-header">
    <div>
      <h1>허용 IP</h1>
      <p class="muted">이 사이트에 접속할 수 있는 위치를 관리합니다. 사무실은 상시, 현장 지원은 기간을 정해 등록하고 지원이 끝나면 삭제하세요.</p>
    </div>
  </div>

  <template v-if="overview">
    <!-- 현재 상태 -->
    <div class="card status">
      <div>
        <span class="muted label">IP 제한</span>
        <strong v-if="overview.filterEnabled" class="on">사용 중</strong>
        <strong v-else class="off">꺼져 있음</strong>
      </div>
      <div>
        <span class="muted label">내 접속 IP</span>
        <code>{{ overview.clientIp }}</code>
        <span v-if="overview.clientAllowed" class="badge badge-success">허용</span>
        <span v-else class="badge badge-danger">차단 대상</span>
      </div>
    </div>
    <div v-if="!overview.filterEnabled" class="alert alert-info">
      지금은 IP 제한이 꺼져 있어 모든 위치에서 접속할 수 있습니다.
      사무실 IP 를 먼저 <strong>상시</strong>로 등록한 뒤, 서버를 <code>IP_FILTER_ENABLED=true</code> 로 다시 시작하면 적용됩니다.
    </div>
    <div v-if="overview.alwaysAllowLocalhost" class="hint muted">
      서버 PC 자신(127.0.0.1)에서 접속하면 항상 허용됩니다 — 허용 IP 를 잘못 지웠을 때 복구용.
    </div>

    <div v-if="notice" class="alert alert-info">{{ notice }}</div>
    <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

    <!-- 추가 -->
    <form class="card add-form" @submit.prevent="add">
      <div class="field">
        <label for="ip">IP 또는 CIDR</label>
        <div class="ip-row">
          <input id="ip" v-model="form.ipOrCidr" placeholder="예: 203.0.113.10 또는 192.168.0.0/24" maxlength="50" required />
          <button type="button" class="btn" @click="fillMyIp">내 IP 넣기</button>
        </div>
        <span class="hint">CIDR: 192.168.0.0/24 는 192.168.0.0 ~ 192.168.0.255 (256개)</span>
      </div>
      <div class="field">
        <label for="desc">설명</label>
        <input id="desc" v-model="form.description" placeholder="예: 본사 사무실, OO병원 현장 지원" maxlength="200" />
      </div>
      <div class="field">
        <span class="label-text">허용 기간</span>
        <div class="expiry-options" role="radiogroup" aria-label="허용 기간">
          <label v-for="(label, key) in EXPIRY_LABEL" :key="key" class="expiry-option">
            <input v-model="form.expiry" type="radio" name="expiry" :value="key" />
            {{ label }}
          </label>
        </div>
        <span class="hint">현장 지원은 "2시간" 또는 "오늘까지", 사무실은 "상시". 기간이 지나면 자동으로 막힙니다.</span>
      </div>
      <div class="actions">
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '등록 중...' : '등록' }}</button>
      </div>
    </form>

    <!-- 목록 -->
    <section class="section">
      <h2>등록된 IP</h2>
      <div v-if="overview.items.length === 0" class="empty">등록된 IP 가 없습니다.</div>
      <div v-else class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>IP / CIDR</th>
              <th>설명</th>
              <th>상태</th>
              <th>허용 기간</th>
              <th>등록</th>
              <th><span class="sr-only">관리</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in overview.items" :key="item.id">
              <td><code>{{ item.ipOrCidr }}</code></td>
              <td class="wrap">{{ item.description || '-' }}</td>
              <td>
                <span v-if="!item.enabled" class="badge badge-neutral">중지</span>
                <span v-else-if="item.expired" class="badge badge-danger">만료</span>
                <span v-else class="badge badge-success">사용</span>
              </td>
              <td>
                <template v-if="item.expiresAt">
                  {{ formatDateTime(item.expiresAt) }}까지
                  <span v-if="!item.expired" class="muted remain">{{ remaining(item) }}</span>
                </template>
                <span v-else>상시</span>
              </td>
              <td>{{ item.createdByName ?? '-' }} · {{ formatDateTime(item.createdAt) }}</td>
              <td>
                <div class="row-actions">
                  <select class="expiry-select" aria-label="허용 기간 변경" @change="changeExpiry(item, $event)">
                    <option value="">기간 변경</option>
                    <option value="2h">지금부터 2시간</option>
                    <option value="today">오늘까지</option>
                    <option value="always">상시</option>
                  </select>
                  <button type="button" class="btn btn-sm" @click="toggle(item)">{{ item.enabled ? '중지' : '사용' }}</button>
                  <button type="button" class="btn btn-sm danger" @click="remove(item)">삭제</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </template>
  <div v-else-if="error" class="alert alert-error" role="alert">{{ error }}</div>
  <p v-else class="muted">불러오는 중...</p>
</template>

<style scoped>
.status {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 40px;
  margin-bottom: 16px;
}

.status > div {
  display: flex;
  align-items: center;
  gap: 8px;
}

.label {
  font-size: 13px;
}

.on {
  color: var(--color-success);
}

.off {
  color: var(--color-text-muted);
}

.hint {
  font-size: 13px;
  margin-bottom: 16px;
}

.add-form {
  margin-bottom: 8px;
}

.ip-row {
  display: flex;
  gap: 8px;
}

.ip-row input {
  flex: 1;
  min-width: 0;
}

.actions {
  display: flex;
  justify-content: flex-end;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

.label-text {
  font-size: 14px;
  font-weight: 500;
}

.expiry-options {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 20px;
}

.expiry-option {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-weight: normal;
  cursor: pointer;
}

.remain {
  display: block;
  font-size: 12px;
}

/* "기간 변경" 선택: 옆의 .btn-sm 버튼과 같은 모양 (전역 select 스타일은 .field 안에만 적용되므로 따로 지정) */
.expiry-select {
  appearance: none;
  width: auto;
  padding: 4px 28px 4px 10px;
  font: inherit;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-primary);
  background-color: var(--color-bg-panel);
  /* 화살표(▼)를 두 개의 삼각형 그라데이션으로 그림 → 테마 색 변수를 그대로 쓸 수 있음 */
  background-image:
    linear-gradient(45deg, transparent 50%, var(--color-text-muted) 50%),
    linear-gradient(135deg, var(--color-text-muted) 50%, transparent 50%);
  background-position:
    calc(100% - 14px) 50%,
    calc(100% - 9px) 50%;
  background-size: 5px 5px;
  background-repeat: no-repeat;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius);
  cursor: pointer;
  transition:
    border-color var(--transition),
    box-shadow var(--transition);
}

.expiry-select:hover {
  border-color: var(--color-text-muted);
}

.expiry-select:focus-visible {
  outline: none;
  border-color: var(--color-primary);
  box-shadow: 0 0 0 3px var(--color-focus-ring);
}

/* 펼친 목록도 테마 색으로 (브라우저 기본은 흰 배경) */
.expiry-select option {
  color: var(--color-text-primary);
  background-color: var(--color-bg-panel);
}

.btn.danger:not(:disabled) {
  color: var(--color-error);
}
</style>
