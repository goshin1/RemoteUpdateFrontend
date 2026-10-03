<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { guideApi, projectApi, updateApi } from '@/api/projects'
import type { Guide, PageResponse, Project, Update, UpdateStatus } from '@/api/types'
import PaginationBar from '@/components/PaginationBar.vue'
import StatusBadge from '@/components/StatusBadge.vue'
import { useAuthStore } from '@/stores/auth'
import { formatBytes, formatDateTime } from '@/utils/format'

const props = defineProps<{ projectId: number }>()

const auth = useAuthStore()
const router = useRouter()
const isDeveloper = computed(() => auth.hasRole('DEVELOPER'))

const project = ref<Project | null>(null)
const guides = ref<Guide[]>([])
const updates = ref<PageResponse<Update> | null>(null)
const latest = ref<Update | null>(null)
const page = ref(0)
const statusFilter = ref<UpdateStatus | ''>('')
const error = ref('')
const updatesError = ref('')

async function loadProject() {
  try {
    const [p, g] = await Promise.all([projectApi.get(props.projectId), projectApi.guides(props.projectId)])
    project.value = p
    guides.value = g
    document.title = `${p.name} · RemoteUpdate`
    // 최신 배포 버전 (비활성 제외)
    const active = await projectApi.updates(props.projectId, { page: 0, size: 1, status: 'ACTIVE' })
    latest.value = active.content[0] ?? null
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function loadUpdates() {
  updatesError.value = ''
  try {
    updates.value = await projectApi.updates(props.projectId, {
      page: page.value,
      size: 20,
      status: statusFilter.value || undefined,
    })
  } catch (e) {
    updatesError.value = errorMessage(e)
  }
}

function changePage(p: number) {
  page.value = p
  void loadUpdates()
}

watch(statusFilter, () => {
  page.value = 0
  void loadUpdates()
})

function openUpdate(update: Update) {
  void router.push({ name: 'update', params: { updateId: update.id } })
}

onMounted(() => {
  void loadProject()
  void loadUpdates()
})
</script>

<template>
  <nav class="breadcrumb">
    <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
    <span>/</span>
    <span>{{ project?.name ?? '...' }}</span>
  </nav>

  <div v-if="error" class="alert alert-error">{{ error }}</div>

  <template v-else-if="project">
    <div class="page-header">
      <div>
        <h1>{{ project.name }}</h1>
        <p v-if="project.description" class="muted pre">{{ project.description }}</p>
      </div>
    </div>

    <!-- 최신 버전 -->
    <div v-if="latest" class="card latest">
      <div class="latest-info">
        <span class="muted label">최신 버전</span>
        <div class="latest-title">
          <strong class="version">{{ latest.version }}</strong>
          <span>{{ latest.title }}</span>
        </div>
        <span class="muted small">{{ formatDateTime(latest.createdAt) }} · {{ formatBytes(latest.fileSize) }}</span>
      </div>
      <div class="latest-actions">
        <RouterLink :to="{ name: 'update', params: { updateId: latest.id } }" class="btn">상세 보기</RouterLink>
        <a :href="updateApi.downloadUrl(latest.id)" class="btn btn-primary">다운로드</a>
      </div>
    </div>

    <!-- 초기 세팅 가이드 -->
    <section class="section">
      <div class="section-header">
        <h2>초기 세팅 가이드</h2>
      </div>
      <div v-if="guides.length === 0" class="empty">등록된 가이드가 없습니다.</div>
      <ul v-else class="guide-list">
        <li v-for="guide in guides" :key="guide.id" class="guide-item">
          <RouterLink :to="{ name: 'guide', params: { guideId: guide.id } }" class="guide-title">
            {{ guide.title }}
          </RouterLink>
          <a v-if="guide.hasAttachment" :href="guideApi.attachmentUrl(guide.id)" class="link-muted small">
            첨부: {{ guide.fileName }} ({{ formatBytes(guide.fileSize) }})
          </a>
        </li>
      </ul>
    </section>

    <!-- 업데이트 목록 -->
    <section class="section">
      <div class="section-header">
        <h2>업데이트</h2>
        <div v-if="isDeveloper" class="field inline">
          <label for="status" class="sr-only">상태</label>
          <select id="status" v-model="statusFilter">
            <option value="">전체 상태</option>
            <option value="ACTIVE">배포 중</option>
            <option value="DISABLED">중단됨</option>
          </select>
        </div>
      </div>

      <div v-if="updatesError" class="alert alert-error">{{ updatesError }}</div>
      <div v-else-if="updates && updates.content.length === 0" class="empty">등록된 업데이트가 없습니다.</div>
      <template v-else-if="updates">
        <div class="table-wrap">
          <table class="table">
            <thead>
              <tr>
                <th>버전</th>
                <th>제목</th>
                <th v-if="isDeveloper">상태</th>
                <th>파일 크기</th>
                <th>등록일</th>
                <th>담당 개발자</th>
                <th><span class="sr-only">다운로드</span></th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="u in updates.content" :key="u.id" class="clickable" @click="openUpdate(u)">
                <td><strong>{{ u.version }}</strong></td>
                <td class="wrap">{{ u.title }}</td>
                <td v-if="isDeveloper"><StatusBadge :status="u.status" /></td>
                <td>{{ formatBytes(u.fileSize) }}</td>
                <td>{{ formatDateTime(u.createdAt) }}</td>
                <td>{{ u.developerName }}</td>
                <td>
                  <a
                    v-if="u.status === 'ACTIVE'"
                    :href="updateApi.downloadUrl(u.id)"
                    class="btn btn-sm"
                    @click.stop
                  >다운로드</a>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
        <PaginationBar :page="updates.page" :total-pages="updates.totalPages" @change="changePage" />
      </template>
      <p v-else class="muted">불러오는 중...</p>
    </section>
  </template>

  <p v-else class="muted">불러오는 중...</p>
</template>

<style scoped>
.pre {
  white-space: pre-line;
}

.small {
  font-size: 13px;
}

.latest {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  border-color: var(--accent);
  background: var(--accent-bg);
}

.latest-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.label {
  font-size: 13px;
}

.latest-title {
  display: flex;
  gap: 10px;
  align-items: baseline;
  color: var(--text-h);
}

.version {
  font-size: 20px;
}

.latest-actions {
  display: flex;
  gap: 8px;
}

.guide-list {
  list-style: none;
  margin: 0;
  padding: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius);
}

.guide-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  flex-wrap: wrap;
}

.guide-item:last-child {
  border-bottom: none;
}

.guide-title {
  font-weight: 600;
  text-decoration: none;
}

.field.inline {
  margin: 0;
}

.field.inline select {
  padding: 6px 10px;
  font-size: 14px;
}
</style>
