<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { errorMessage } from '@/api/http'
import { projectApi } from '@/api/projects'
import type { Project, Update, UpdateHistory } from '@/api/types'
import { updateApi } from '@/api/updates'
import ChecksumField from '@/components/ChecksumField.vue'
import HistoryList from '@/components/HistoryList.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { formatBytes, formatDateTime } from '@/utils/format'

/**
 * 업데이트 상세.
 * - 모두: 정보, 다운로드, 체크섬 확인 안내
 * - 개발자 이상: 수정, 배포 중단/재개, 변경 이력, 이 업데이트의 다운로드 이력 바로가기
 */
const props = defineProps<{ updateId: number }>()
const auth = useAuthStore()
const isDeveloper = computed(() => auth.hasRole('DEVELOPER'))

const update = ref<Update | null>(null)
const project = ref<Project | null>(null)
const history = ref<UpdateHistory[]>([])
const error = ref('')
const actionError = ref('')
const changing = ref(false)

async function loadHistory() {
  if (isDeveloper.value) {
    history.value = await updateApi.history(props.updateId)
  }
}

onMounted(async () => {
  try {
    update.value = await updateApi.get(props.updateId)
    project.value = await projectApi.get(update.value.projectId)
    document.title = `${project.value.name} ${update.value.version} · RemoteUpdate`
    await loadHistory()
  } catch (e) {
    error.value = errorMessage(e)
  }
})

/** 배포 중단(다운로드 차단) / 재개 */
async function toggleStatus() {
  if (!update.value) return
  const disabling = update.value.status === 'ACTIVE'
  const message = disabling
    ? `${update.value.version} 배포를 중단할까요?\n중단하면 아무도 이 파일을 받을 수 없고, 직원 화면에서 사라집니다.`
    : `${update.value.version} 배포를 다시 시작할까요?`
  if (!window.confirm(message)) return
  changing.value = true
  actionError.value = ''
  try {
    update.value = await updateApi.changeStatus(update.value.id, disabling ? 'DISABLED' : 'ACTIVE')
    await loadHistory()
  } catch (e) {
    actionError.value = errorMessage(e)
  } finally {
    changing.value = false
  }
}
</script>

<template>
  <nav class="breadcrumb">
    <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
    <span>/</span>
    <RouterLink v-if="project" :to="{ name: 'project', params: { projectId: project.id } }">
      {{ project.name }}
    </RouterLink>
    <span>/</span>
    <span>{{ update?.version ?? '...' }}</span>
  </nav>

  <div v-if="error" class="alert alert-error">{{ error }}</div>

  <template v-else-if="update">
    <div class="page-header">
      <div>
        <div class="title-row">
          <h1>{{ update.version }}</h1>
          <StatusBadge :status="update.status" />
        </div>
        <p class="subtitle">{{ update.title }}</p>
      </div>
      <a v-if="update.status === 'ACTIVE'" :href="updateApi.downloadUrl(update.id)" class="btn btn-primary btn-lg">
        다운로드 ({{ formatBytes(update.fileSize) }})
      </a>
    </div>

    <!-- 개발자 도구 -->
    <div v-if="isDeveloper" class="dev-bar">
      <RouterLink :to="{ name: 'update-edit', params: { updateId: update.id } }" class="btn btn-sm">수정</RouterLink>
      <button type="button" class="btn btn-sm" :class="{ danger: update.status === 'ACTIVE' }" :disabled="changing"
        @click="toggleStatus">
        {{ update.status === 'ACTIVE' ? '배포 중단' : '배포 재개' }}
      </button>
      <RouterLink :to="{ name: 'downloads', query: { updateId: update.id } }" class="btn btn-sm">다운로드 이력</RouterLink>
    </div>
    <div v-if="actionError" class="alert alert-error" role="alert">{{ actionError }}</div>

    <div v-if="update.status === 'DISABLED'" class="alert alert-warning">
      배포가 중단된 업데이트라 다운로드할 수 없습니다.
    </div>

    <div class="card">
      <dl class="info">
        <dt>파일</dt>
        <dd>{{ update.fileName }}</dd>
        <dt>크기</dt>
        <dd>{{ formatBytes(update.fileSize) }} ({{ update.fileSize.toLocaleString() }} bytes)</dd>
        <dt>등록일</dt>
        <dd>{{ formatDateTime(update.createdAt) }}</dd>
        <dt>담당 개발자</dt>
        <dd>{{ update.developerName }}</dd>
      </dl>
    </div>

    <section class="section">
      <h2>업데이트 내용</h2>
      <div class="card content">{{ update.content || '내용 없음' }}</div>
    </section>

    <section class="section">
      <h2>파일 확인 (SHA-256)</h2>
      <ChecksumField :value="update.checksum" />
      <p class="muted verify">
        받은 파일이 손상되지 않았는지 확인하려면, 파일이 있는 폴더에서 PowerShell로 아래 명령을 실행해 결과가 위 값과 같은지 비교하세요.
      </p>
      <pre class="command"><code>Get-FileHash "{{ update.fileName }}" -Algorithm SHA256</code></pre>
    </section>

    <section v-if="isDeveloper" class="section">
      <h2>변경 이력</h2>
      <HistoryList :items="history" />
    </section>
  </template>

  <p v-else class="muted">불러오는 중...</p>
</template>

<style scoped>
.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-row h1 {
  margin: 0;
}

.subtitle {
  margin-top: 6px !important;
  font-size: 17px;
  color: var(--text-h);
}

.dev-bar {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  padding: 10px 12px;
  margin-bottom: 16px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.btn.danger {
  color: var(--danger);
}

.info {
  display: grid;
  grid-template-columns: max-content 1fr;
  gap: 10px 24px;
  margin: 0;
}

.info dt {
  color: var(--text-muted);
}

.info dd {
  margin: 0;
  color: var(--text-h);
  overflow-wrap: anywhere;
}

.content {
  white-space: pre-line;
}

.verify {
  font-size: 14px;
  margin: 12px 0 8px;
}

.command {
  margin: 0;
  padding: 10px 12px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow-x: auto;
  font-size: 13px;
}
</style>
