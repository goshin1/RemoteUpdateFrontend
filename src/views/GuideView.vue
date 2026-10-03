<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { errorMessage } from '@/api/http'
import { guideApi } from '@/api/guides'
import { projectApi } from '@/api/projects'
import type { Guide, Project } from '@/api/types'
import { formatBytes, formatDateTime } from '@/utils/format'
import { renderMarkdown } from '@/utils/markdown'
import { useAuthStore } from '@/stores/auth'

const props = defineProps<{ guideId: number }>()
const auth = useAuthStore()

const guide = ref<Guide | null>(null)
const project = ref<Project | null>(null)
const error = ref('')

/** renderMarkdown 은 HTML 태그를 막아 둔 상태라 v-html 에 넣어도 안전 */
const html = computed(() => renderMarkdown(guide.value?.content))

onMounted(async () => {
  try {
    guide.value = await guideApi.get(props.guideId)
    project.value = await projectApi.get(guide.value.projectId)
    document.title = `${guide.value.title} · RemoteUpdate`
  } catch (e) {
    error.value = errorMessage(e)
  }
})
</script>

<template>
  <nav class="breadcrumb">
    <RouterLink :to="{ name: 'projects' }">프로젝트</RouterLink>
    <span>/</span>
    <RouterLink v-if="project" :to="{ name: 'project', params: { projectId: project.id } }">
      {{ project.name }}
    </RouterLink>
    <span>/</span>
    <span>가이드</span>
  </nav>

  <div v-if="error" class="alert alert-error">{{ error }}</div>

  <template v-else-if="guide">
    <div class="page-header">
      <div>
        <h1>{{ guide.title }}</h1>
        <p class="muted small">{{ guide.createdByName }} · 수정 {{ formatDateTime(guide.updatedAt) }}</p>
      </div>
      <div class="header-actions">
        <RouterLink v-if="auth.hasRole('DEVELOPER')" :to="{ name: 'guide-edit', params: { guideId: guide.id } }"
          class="btn">수정</RouterLink>
        <a v-if="guide.hasAttachment" :href="guideApi.attachmentUrl(guide.id)" class="btn btn-primary">
          첨부 파일 받기 ({{ formatBytes(guide.fileSize) }})
        </a>
      </div>
    </div>

    <article v-if="html" class="card markdown" v-html="html" />
    <div v-else class="empty">본문이 없습니다.</div>
  </template>

  <p v-else class="muted">불러오는 중...</p>
</template>

<style scoped>
.header-actions {
  display: flex;
  gap: 8px;
}

.small {
  font-size: 13px;
  margin-top: 4px !important;
}
</style>
