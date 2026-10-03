<script setup lang="ts">
import { onMounted, reactive, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter, type LocationQuery } from 'vue-router'
import { downloadApi, type DownloadSearch } from '@/api/downloads'
import { errorMessage } from '@/api/http'
import { projectApi } from '@/api/projects'
import type { DownloadHistory, PageResponse, Project, UserOption } from '@/api/types'
import { userApi } from '@/api/users'
import PaginationBar from '@/components/PaginationBar.vue'
import { formatDateTime } from '@/utils/format'

/**
 * 다운로드 이력 (개발자 이상).
 * 검색 조건을 주소(query string)에 넣어 두므로, 새로고침하거나 주소를 공유해도 같은 결과가 나온다.
 * 예) /downloads?projectId=1&from=2026-10-01&to=2026-10-04
 */
const route = useRoute()
const router = useRouter()

const projects = ref<Project[]>([])
const users = ref<UserOption[]>([])
const result = ref<PageResponse<DownloadHistory> | null>(null)
const error = ref('')
const loading = ref(false)

/** 화면의 입력값 (검색 버튼을 눌러야 주소에 반영) */
const form = reactive({ projectId: '', userId: '', from: '', to: '' })

function toNumber(v: unknown): number | undefined {
  const n = Number(v)
  return typeof v === 'string' && v !== '' && Number.isFinite(n) ? n : undefined
}

function toText(v: unknown): string | undefined {
  return typeof v === 'string' && v !== '' ? v : undefined
}

/** 주소의 query → API 검색 조건 */
function searchFromQuery(q: LocationQuery): DownloadSearch {
  return {
    projectId: toNumber(q.projectId),
    updateId: toNumber(q.updateId),
    userId: toNumber(q.userId),
    from: toText(q.from),
    to: toText(q.to),
    page: toNumber(q.page) ?? 0,
    size: 20,
  }
}

async function load() {
  const search = searchFromQuery(route.query)
  form.projectId = search.projectId?.toString() ?? ''
  form.userId = search.userId?.toString() ?? ''
  form.from = search.from ?? ''
  form.to = search.to ?? ''
  loading.value = true
  error.value = ''
  try {
    result.value = await downloadApi.search(search)
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
}

function search() {
  const query: Record<string, string> = {}
  if (form.projectId) query.projectId = form.projectId
  if (form.userId) query.userId = form.userId
  if (form.from) query.from = form.from
  if (form.to) query.to = form.to
  if (route.query.updateId) query.updateId = String(route.query.updateId)
  void router.push({ query })
}

function reset() {
  void router.push({ query: {} })
}

function clearUpdateFilter() {
  const { updateId: _removed, page: _page, ...rest } = route.query
  void router.push({ query: rest })
}

function changePage(p: number) {
  void router.push({ query: { ...route.query, page: String(p) } })
}

// 주소가 바뀌면(검색·페이지 이동·뒤로 가기) 다시 조회
watch(() => route.query, load)

onMounted(async () => {
  void load()
  try {
    ;[projects.value, users.value] = await Promise.all([projectApi.list(), userApi.options()])
  } catch {
    // 선택 목록을 못 받아도 이력 조회는 가능
  }
})
</script>

<template>
  <div class="page-header">
    <div>
      <h1>다운로드 이력</h1>
      <p class="muted">누가, 언제, 어디서(IP) 어떤 업데이트를 받았는지 확인합니다.</p>
    </div>
  </div>

  <form class="card filters" @submit.prevent="search">
    <div class="field">
      <label for="projectId">프로젝트</label>
      <select id="projectId" v-model="form.projectId">
        <option value="">전체</option>
        <option v-for="p in projects" :key="p.id" :value="String(p.id)">{{ p.name }}</option>
      </select>
    </div>
    <div class="field">
      <label for="userId">다운로더</label>
      <select id="userId" v-model="form.userId">
        <option value="">전체</option>
        <option v-for="u in users" :key="u.id" :value="String(u.id)">{{ u.name }} ({{ u.email }})</option>
      </select>
    </div>
    <div class="field">
      <label for="from">시작일</label>
      <input id="from" v-model="form.from" type="date" />
    </div>
    <div class="field">
      <label for="to">종료일</label>
      <input id="to" v-model="form.to" type="date" />
    </div>
    <div class="filter-actions">
      <button type="button" class="btn" @click="reset">초기화</button>
      <button type="submit" class="btn btn-primary">검색</button>
    </div>
  </form>

  <div v-if="route.query.updateId" class="alert alert-info chip">
    업데이트 #{{ route.query.updateId }} 의 이력만 보는 중
    <button type="button" class="btn btn-sm" @click="clearUpdateFilter">전체 보기</button>
  </div>

  <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
  <template v-else-if="result">
    <p class="muted count">총 {{ result.totalElements.toLocaleString() }}건</p>
    <div v-if="result.content.length === 0" class="empty">조건에 맞는 다운로드 이력이 없습니다.</div>
    <template v-else>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>다운로드 시각</th>
              <th>프로젝트</th>
              <th>버전</th>
              <th>파일</th>
              <th>다운로더</th>
              <th>IP</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="h in result.content" :key="h.id">
              <td>{{ formatDateTime(h.downloadedAt) }}</td>
              <td>{{ h.projectName }}</td>
              <td>
                <RouterLink :to="{ name: 'update', params: { updateId: h.updateId } }">{{ h.version }}</RouterLink>
              </td>
              <td>{{ h.fileName }}</td>
              <td>{{ h.downloaderName }}</td>
              <td><code>{{ h.clientIp }}</code></td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar :page="result.page" :total-pages="result.totalPages" @change="changePage" />
    </template>
  </template>
  <p v-else-if="loading" class="muted">불러오는 중...</p>
</template>

<style scoped>
.filters {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 0 16px;
  align-items: end;
  margin-bottom: 16px;
}

.filter-actions {
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
}

.chip {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.count {
  margin: 0 0 8px;
  font-size: 14px;
}
</style>
