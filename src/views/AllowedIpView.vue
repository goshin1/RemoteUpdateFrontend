<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { allowedIpApi } from '@/api/allowedIps'
import { errorCode, errorMessage } from '@/api/http'
import type { AllowedIp, AllowedIpOverview } from '@/api/types'
import { formatDateTime } from '@/utils/format'

/**
 * 관리 기능 허용 IP (관리자).
 *
 * IP 제한이 켜져 있으면(서버 설정 IP_FILTER_ENABLED=true) 아래 요청은 여기 등록된 IP 에서만 됩니다.
 * - 데이터 변경: 업데이트·가이드·프로젝트 등록·수정·배포 중단, 사용자 관리
 * - 관리자 메뉴 전체 (이 화면 포함)
 * 로그인·조회·다운로드는 어디서나 됩니다.
 *
 * 스스로 잠기지 않도록, 지금 접속한 IP 를 막게 되는 끄기·삭제는 서버가 거부합니다.
 */
const overview = ref<AllowedIpOverview | null>(null)
const form = reactive({ ipOrCidr: '', description: '' })
const error = ref('')
const notice = ref('')
const saving = ref(false)

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
    const added = await allowedIpApi.add({ ipOrCidr: form.ipOrCidr.trim(), description: form.description.trim() })
    notice.value = `${added.ipOrCidr} 을(를) 등록했습니다.`
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

async function remove(item: AllowedIp) {
  if (!window.confirm(`${item.ipOrCidr} 을(를) 삭제할까요?`)) return
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
      <p class="muted">등록·수정 같은 관리 기능을 쓸 수 있는 접속 위치(사무실 등)를 관리합니다. 조회·다운로드는 어디서나 됩니다.</p>
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
        <span v-if="overview.clientAllowed" class="badge badge-success">관리 가능</span>
        <span v-else class="badge badge-danger">관리 불가</span>
      </div>
    </div>
    <div v-if="!overview.filterEnabled" class="alert alert-info">
      지금은 IP 제한이 꺼져 있어 모든 위치에서 관리 기능을 쓸 수 있습니다.
      사무실 IP 를 먼저 등록한 뒤, 서버를 <code>IP_FILTER_ENABLED=true</code> 로 다시 시작하면 적용됩니다.
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
        <input id="desc" v-model="form.description" placeholder="예: 본사 사무실" maxlength="200" />
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
              <th>등록</th>
              <th><span class="sr-only">관리</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in overview.items" :key="item.id">
              <td><code>{{ item.ipOrCidr }}</code></td>
              <td class="wrap">{{ item.description || '-' }}</td>
              <td>
                <span v-if="item.enabled" class="badge badge-success">사용</span>
                <span v-else class="badge badge-neutral">중지</span>
              </td>
              <td>{{ item.createdByName ?? '-' }} · {{ formatDateTime(item.createdAt) }}</td>
              <td>
                <div class="row-actions">
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
  color: var(--success);
}

.off {
  color: var(--text-muted);
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

.btn.danger {
  color: var(--danger);
}
</style>
