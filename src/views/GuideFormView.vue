<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { guideApi } from '@/api/guides'
import { projectApi } from '@/api/projects'
import type { Guide, Project } from '@/api/types'
import FilePicker from '@/components/FilePicker.vue'
import UploadProgress from '@/components/UploadProgress.vue'
import { formatBytes } from '@/utils/format'
import { renderMarkdown } from '@/utils/markdown'

/**
 * 가이드 등록·수정 (개발자 이상).
 * 본문은 마크다운이며 오른쪽(좁은 화면은 아래)에 미리보기를 보여준다.
 * 수정 화면에서는 첨부 파일을 추가하거나 교체할 수 있다.
 */
const props = defineProps<{ projectId?: number; guideId?: number }>()
const router = useRouter()
const isEdit = computed(() => props.guideId !== undefined)

const project = ref<Project | null>(null)
const original = ref<Guide | null>(null)
const title = ref('')
const content = ref('')
const file = ref<File | null>(null)
const progress = ref<number | null>(null)
const submitting = ref(false)
const error = ref('')

const preview = computed(() => renderMarkdown(content.value))

onMounted(async () => {
  try {
    if (props.guideId !== undefined) {
      original.value = await guideApi.get(props.guideId)
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
  const form = { title: title.value.trim(), content: content.value }
  try {
    let saved: Guide
    if (original.value) {
      saved = await guideApi.update(original.value.id, form)
      if (file.value) {
        progress.value = 0
        saved = await guideApi.replaceAttachment(original.value.id, file.value, (p) => (progress.value = p))
      }
    } else {
      if (file.value) progress.value = 0
      saved = await guideApi.create(project.value.id, form, file.value, (p) => (progress.value = p))
    }
    await router.push({ name: 'guide', params: { guideId: saved.id } })
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
    <span>{{ isEdit ? '가이드 수정' : '가이드 등록' }}</span>
  </nav>
  <h1>{{ isEdit ? '가이드 수정' : '가이드 등록' }}</h1>

  <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>

  <form v-if="project && (!isEdit || original)" @submit.prevent="submit">
    <div class="card">
      <div class="field">
        <label for="title">제목</label>
        <input id="title" v-model="title" maxlength="200" required />
      </div>
      <div class="editor">
        <div class="field">
          <label for="content">본문 (마크다운)</label>
          <textarea id="content" v-model="content" rows="18" maxlength="100000"
            placeholder="# 1단계&#10;전원을 켭니다.&#10;&#10;- 항목&#10;- **굵게**" />
          <span class="hint">#제목, - 목록, **굵게**, ```코드``` 를 쓸 수 있습니다. HTML 태그는 글자로 표시됩니다.</span>
        </div>
        <div class="field">
          <span class="label">미리보기</span>
          <div class="preview markdown" v-html="preview" />
        </div>
      </div>
      <div class="field">
        <label for="file">첨부 파일 (선택)</label>
        <span v-if="original?.hasAttachment" class="hint">
          현재: {{ original.fileName }} ({{ formatBytes(original.fileSize) }}) — 새 파일을 고르면 교체됩니다.
        </span>
        <FilePicker id="file" v-model="file" />
      </div>

      <UploadProgress v-if="progress !== null" :percent="progress" />

      <div class="actions">
        <button type="button" class="btn" :disabled="submitting" @click="router.back()">취소</button>
        <button type="submit" class="btn btn-primary" :disabled="submitting">
          {{ submitting ? '저장 중...' : isEdit ? '저장' : '등록' }}
        </button>
      </div>
    </div>
  </form>
  <p v-else-if="!error" class="muted">불러오는 중...</p>
</template>

<style scoped>
.editor {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

textarea {
  font-family: var(--mono);
  font-size: 13px;
  resize: vertical;
}

.label {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-h);
}

.preview {
  min-height: 200px;
  max-height: 440px;
  overflow-y: auto;
  padding: 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius);
  background: var(--surface);
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
