<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'
import { errorMessage } from '@/api/http'
import type { AdminUser, PageResponse, Role, TemporaryPasswordResult } from '@/api/types'
import { userApi } from '@/api/users'
import ModalDialog from '@/components/ModalDialog.vue'
import PaginationBar from '@/components/PaginationBar.vue'
import TemporaryPasswordDialog from '@/components/TemporaryPasswordDialog.vue'
import { useAuthStore } from '@/stores/auth'
import { formatDateTime, ROLE_LABEL } from '@/utils/format'

/**
 * 사용자 관리 (관리자).
 * - 등록: 서버가 임시 비밀번호를 만들어 한 번만 보여줌 → 관리자가 사용자에게 전달
 * - 수정: 이름·역할
 * - 사용 중지/재개: 삭제 대신 비활성화 (이력 보존). 중지하면 로그인 중인 세션도 바로 끊김
 * - 비밀번호 초기화: 새 임시 비밀번호 + 로그인 잠금 해제
 * 본인 계정의 역할·사용 여부는 바꿀 수 없음 (서버에서도 막음)
 */
const auth = useAuthStore()
const ROLES: Role[] = ['STAFF', 'DEVELOPER', 'ADMIN']

const result = ref<PageResponse<AdminUser> | null>(null)
const filters = reactive({ keyword: '', role: '' as Role | '', enabled: '' as '' | 'true' | 'false' })
const page = ref(0)
const error = ref('')
const notice = ref('')

/** 모달 상태 */
const creating = ref(false)
const createForm = reactive({ email: '', name: '', role: 'STAFF' as Role })
const editing = ref<AdminUser | null>(null)
const editForm = reactive({ name: '', role: 'STAFF' as Role })
const modalError = ref('')
const saving = ref(false)
const passwordResult = ref<{ title: string; result: TemporaryPasswordResult } | null>(null)

async function load() {
  error.value = ''
  try {
    result.value = await userApi.list({
      keyword: filters.keyword.trim() || undefined,
      role: filters.role || undefined,
      enabled: filters.enabled === '' ? undefined : filters.enabled === 'true',
      page: page.value,
      size: 20,
    })
  } catch (e) {
    error.value = errorMessage(e)
  }
}

function search() {
  page.value = 0
  void load()
}

function changePage(p: number) {
  page.value = p
  void load()
}

function isSelf(user: AdminUser) {
  return user.id === auth.me?.id
}

function openCreate() {
  Object.assign(createForm, { email: '', name: '', role: 'STAFF' })
  modalError.value = ''
  creating.value = true
}

async function submitCreate() {
  saving.value = true
  modalError.value = ''
  try {
    const created = await userApi.create({ ...createForm, email: createForm.email.trim(), name: createForm.name.trim() })
    creating.value = false
    passwordResult.value = { title: '사용자 등록 완료', result: created }
    await load()
  } catch (e) {
    modalError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

function openEdit(user: AdminUser) {
  editing.value = user
  Object.assign(editForm, { name: user.name, role: user.role })
  modalError.value = ''
}

async function submitEdit() {
  if (!editing.value) return
  saving.value = true
  modalError.value = ''
  try {
    await userApi.update(editing.value.id, { name: editForm.name.trim(), role: editForm.role })
    notice.value = `${editForm.name} 님의 정보를 수정했습니다.`
    editing.value = null
    await load()
  } catch (e) {
    modalError.value = errorMessage(e)
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(user: AdminUser) {
  const next = !user.enabled
  const message = next
    ? `${user.name} 님의 계정을 다시 사용하게 할까요?`
    : `${user.name} 님의 계정 사용을 중지할까요?\n로그인 중이라면 바로 로그아웃됩니다.`
  if (!window.confirm(message)) return
  error.value = ''
  try {
    await userApi.changeEnabled(user.id, next)
    notice.value = `${user.name} 님의 계정을 ${next ? '다시 사용하게' : '중지'}했습니다.`
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

async function resetPassword(user: AdminUser) {
  if (!window.confirm(`${user.name} 님의 비밀번호를 초기화할까요?\n새 임시 비밀번호가 발급되고, 로그인 잠금도 풀립니다.`)) return
  error.value = ''
  try {
    const r = await userApi.resetPassword(user.id)
    passwordResult.value = { title: '비밀번호 초기화', result: r }
    await load()
  } catch (e) {
    error.value = errorMessage(e)
  }
}

onMounted(load)
</script>

<template>
  <div class="page-header">
    <div>
      <h1>사용자 관리</h1>
      <p class="muted">계정 발급, 역할 변경, 사용 중지, 비밀번호 초기화</p>
    </div>
    <button type="button" class="btn btn-primary" @click="openCreate">사용자 등록</button>
  </div>

  <form class="card filters" @submit.prevent="search">
    <div class="field">
      <label for="keyword">이름·이메일</label>
      <input id="keyword" v-model="filters.keyword" type="search" placeholder="검색어" />
    </div>
    <div class="field">
      <label for="role">역할</label>
      <select id="role" v-model="filters.role">
        <option value="">전체</option>
        <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
      </select>
    </div>
    <div class="field">
      <label for="enabled">상태</label>
      <select id="enabled" v-model="filters.enabled">
        <option value="">전체</option>
        <option value="true">사용 중</option>
        <option value="false">중지</option>
      </select>
    </div>
    <div class="filter-actions">
      <button type="submit" class="btn btn-primary">검색</button>
    </div>
  </form>

  <div v-if="notice" class="alert alert-info">{{ notice }}</div>
  <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

  <template v-if="result">
    <div v-if="result.content.length === 0" class="empty">조건에 맞는 사용자가 없습니다.</div>
    <template v-else>
      <div class="table-wrap">
        <table class="table">
          <thead>
            <tr>
              <th>이름</th>
              <th>이메일</th>
              <th>역할</th>
              <th>상태</th>
              <th>등록일</th>
              <th><span class="sr-only">관리</span></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="u in result.content" :key="u.id" :class="{ inactive: !u.enabled }">
              <td>
                <strong>{{ u.name }}</strong>
                <span v-if="isSelf(u)" class="muted"> (나)</span>
              </td>
              <td>{{ u.email }}</td>
              <td>{{ ROLE_LABEL[u.role] }}</td>
              <td>
                <div class="status">
                <span v-if="u.enabled" class="badge badge-success">사용 중</span>
                <span v-else class="badge badge-neutral">중지</span>
                <span v-if="u.locked" class="badge badge-danger" :title="`잠금 해제: ${formatDateTime(u.lockedUntil)}`">잠김</span>
                <span v-if="u.mustChangePassword" class="badge badge-neutral">임시 비밀번호</span>
                </div>
              </td>
              <td>{{ formatDateTime(u.createdAt) }}</td>
              <td>
                <div class="row-actions">
                <button type="button" class="btn btn-sm" @click="openEdit(u)">수정</button>
                <button type="button" class="btn btn-sm" @click="resetPassword(u)">비밀번호 초기화</button>
                <button type="button" class="btn btn-sm" :disabled="isSelf(u)"
                  :title="isSelf(u) ? '본인 계정은 중지할 수 없습니다' : ''" @click="toggleEnabled(u)">
                  {{ u.enabled ? '사용 중지' : '다시 사용' }}
                </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <PaginationBar :page="result.page" :total-pages="result.totalPages" @change="changePage" />
    </template>
  </template>

  <!-- 등록 -->
  <ModalDialog v-if="creating" title="사용자 등록" @close="creating = false">
    <form @submit.prevent="submitCreate">
      <div v-if="modalError" class="alert alert-error" role="alert">{{ modalError }}</div>
      <div class="field">
        <label for="new-email">이메일 (로그인 ID)</label>
        <input id="new-email" v-model="createForm.email" type="email" maxlength="255" required autofocus />
      </div>
      <div class="field">
        <label for="new-name">이름</label>
        <input id="new-name" v-model="createForm.name" maxlength="100" required />
      </div>
      <div class="field">
        <label for="new-role">역할</label>
        <select id="new-role" v-model="createForm.role">
          <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
        </select>
      </div>
      <p class="hint muted">비밀번호는 서버가 임시로 만들어 등록 후에 보여 줍니다.</p>
      <div class="modal-actions">
        <button type="button" class="btn" @click="creating = false">취소</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '등록 중...' : '등록' }}</button>
      </div>
    </form>
  </ModalDialog>

  <!-- 수정 -->
  <ModalDialog v-if="editing" :title="`${editing.email} 수정`" @close="editing = null">
    <form @submit.prevent="submitEdit">
      <div v-if="modalError" class="alert alert-error" role="alert">{{ modalError }}</div>
      <div class="field">
        <label for="edit-name">이름</label>
        <input id="edit-name" v-model="editForm.name" maxlength="100" required />
      </div>
      <div class="field">
        <label for="edit-role">역할</label>
        <select id="edit-role" v-model="editForm.role" :disabled="isSelf(editing)">
          <option v-for="r in ROLES" :key="r" :value="r">{{ ROLE_LABEL[r] }}</option>
        </select>
        <span v-if="isSelf(editing)" class="hint">본인 역할은 바꿀 수 없습니다.</span>
        <span v-else class="hint">역할을 바꾸면 그 사용자의 다음 요청부터 바로 적용됩니다.</span>
      </div>
      <div class="modal-actions">
        <button type="button" class="btn" @click="editing = null">취소</button>
        <button type="submit" class="btn btn-primary" :disabled="saving">{{ saving ? '저장 중...' : '저장' }}</button>
      </div>
    </form>
  </ModalDialog>

  <TemporaryPasswordDialog v-if="passwordResult" :title="passwordResult.title" :result="passwordResult.result"
    @close="passwordResult = null" />
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
  margin-bottom: 16px;
}

/* td 에 display:flex 를 직접 걸면 표 칸 정렬이 깨지므로 안쪽 div 에 건다 */
.status {
  display: flex;
  gap: 4px;
}

.row-actions {
  display: flex;
  gap: 6px;
  justify-content: flex-end;
}

tr.inactive td {
  color: var(--text-muted);
}

.hint {
  font-size: 13px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
