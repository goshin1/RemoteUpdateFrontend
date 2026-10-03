<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { errorMessage } from '@/api/http'
import { projectApi } from '@/api/projects'

/** 프로젝트 등록·수정 (관리자). projectId 가 있으면 수정 */
const props = defineProps<{ projectId?: number }>()
const router = useRouter()

const name = ref('')
const description = ref('')
const loading = ref(!!props.projectId)
const submitting = ref(false)
const error = ref('')

onMounted(async () => {
  if (!props.projectId) return
  try {
    const p = await projectApi.get(props.projectId)
    name.value = p.name
    description.value = p.description ?? ''
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
})

async function submit() {
  error.value = ''
  submitting.value = true
  try {
    const form = { name: name.value.trim(), description: description.value }
    const saved = props.projectId ? await projectApi.update(props.projectId, form) : await projectApi.create(form)
    await router.push({ name: 'project', params: { projectId: saved.id } })
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <nav class="breadcrumb">
    <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
    <span>/</span>
    <span>{{ projectId ? '수정' : '등록' }}</span>
  </nav>
  <h1>{{ projectId ? '프로젝트 수정' : '프로젝트 등록' }}</h1>

  <div v-if="error" class="alert alert-error" role="alert">{{ error }}</div>
  <p v-if="loading" class="muted">불러오는 중...</p>
  <form v-else class="card form" @submit.prevent="submit">
    <div class="field">
      <label for="name">프로젝트명</label>
      <input id="name" v-model="name" maxlength="200" required />
    </div>
    <div class="field">
      <label for="description">설명</label>
      <textarea id="description" v-model="description" rows="4" maxlength="2000" />
    </div>
    <div class="actions">
      <button type="button" class="btn" @click="router.back()">취소</button>
      <button type="submit" class="btn btn-primary" :disabled="submitting">{{ submitting ? '저장 중...' : '저장' }}</button>
    </div>
  </form>
</template>

<style scoped>
.form {
  max-width: 640px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
}
</style>
