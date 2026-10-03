<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { projectApi } from '@/api/projects'
import type { Project, Update } from '@/api/types'
import { updateApi } from '@/api/updates'
import FilePicker from '@/components/FilePicker.vue'
import UploadProgress from '@/components/UploadProgress.vue'

/**
 * 업데이트 등록·수정 (개발자 이상).
 * - 등록: /projects/:projectId/updates/new → 버전·제목·내용·파일
 * - 수정: /updates/:updateId/edit → 제목·내용만 (버전·파일은 바꿀 수 없음 — 바꾸려면 새 버전 등록)
 */
const props = defineProps<{ projectId?: number; updateId?: number }>()
const router = useRouter()
const isEdit = computed(() => props.updateId !== undefined)

const project = ref<Project | null>(null)
const original = ref<Update | null>(null)
const version = ref('')
const title = ref('')
const content = ref('')
const file = ref<File | null>(null)
const progress = ref<number | null>(null)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  try {
    if (props.updateId !== undefined) {
      original.value = await updateApi.get(props.updateId)
      title.value = original.value.title
      content.value = original.value.content ?? ''
      project.value = await projectApi.get(original.value.projectId)
    } else if (props.projectId !== undefined) {
      project.value = await projectApi.get(props.projectId)
    }
  } catch (e) {
    error.value = errorMessage(e)
  }
})

async function submit() {
  if (!project.value) return
  error.value = ''
  submitting.value = true
  try {
    let saved: Update
    if (original.value) {
      saved = await updateApi.updateMeta(original.value.id, { title: title.value.trim(), content: content.value })
    } else {
      if (!file.value) {
        error.value = '파일을 선택하세요.'
        return
      }
      progress.value = 0
      saved = await updateApi.create(
        project.value.id,
        { version: version.value.trim(), title: title.value.trim(), content: content.value, file: file.value },
        (p) => (progress.value = p),
      )
    }
    await router.push({ name: 'update', params: { updateId: saved.id } })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
    progress.value = null
  }
}
</script>

<template>
  <nav class="breadcrumb">
    <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
    <span>/</span>
    <RouterLink v-if="project" :to="{ name: 'project', params: { projectId: project.id } }">{{ project.name }}</RouterLink>
    <span>/</span>
    <span>{{ isEdit ? `${original?.version ?? ''} 수정` : '업데이트 등록' }}</span>
  </nav>
  <h1>{{ isEdit ? '업데이트 수정' : '업데이트 등록' }}</h1>

  <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

  <form v-if="project && (!isEdit || original)" class="card form" @submit.prevent="submit">
    <div class="field">
      <label for="version">버전</label>
      <input v-if="!isEdit" id="version" v-model="version" placeholder="예: 1.2.0" maxlength="50" required
        pattern="[0-9A-Za-z][0-9A-Za-z.+_\-]*" title="영문, 숫자, . + _ - 만 사용할 수 있습니다." />
      <input v-else id="version" :value="original?.version" disabled />
      <span class="hint">{{ isEdit ? '버전은 바꿀 수 없습니다.' : '같은 프로젝트에 같은 버전은 등록할 수 없습니다.' }}</span>
    </div>
    <div class="field">
      <label for="title">제목</label>
      <input id="title" v-model="title" maxlength="200" required />
    </div>
    <div class="field">
      <label for="content">업데이트 내용</label>
      <textarea id="content" v-model="content" rows="6" maxlength="2000" placeholder="변경 사항, 적용 방법, 주의 사항" />
    </div>
    <div class="field">
      <label for="file">파일</label>
      <FilePicker v-if="!isEdit" id="file" v-model="file" required />
      <template v-else>
        <input id="file" :value="original?.fileName" disabled />
        <span class="hint">파일은 등록 후 바꿀 수 없습니다. 파일을 바꾸려면 새 버전으로 등록하세요.</span>
      </template>
    </div>

    <UploadProgress v-if="progress !== null" :percent="progress" />

    <div class="actions">
      <button type="button" class="btn" :disabled="submitting" @click="router.back()">취소</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting || (!isEdit && !file)">
        {{ submitting ? '저장 중...' : isEdit ? '저장' : '등록' }}
      </button>
    </div>
  </form>
  <p v-else-if="!error" class="muted">불러오는 중...</p>
</template>

<style scoped>
.form {
  max-width: 720px;
}

.field input:disabled {
  background: var(--surface);
  color: var(--text-muted);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
