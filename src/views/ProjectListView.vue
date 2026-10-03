<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { errorMessage } from '@/api/http'
import { projectApi } from '@/api/projects'
import type { Project } from '@/api/types'

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref('')

onMounted(async () => {
  try {
    projects.value = await projectApi.list()
  } catch (e) {
    error.value = errorMessage(e)
  } finally {
    loading.value = false
  }
})
</script>

<template>
  <div class="page-header">
    <div>
      <h1>프로젝트</h1>
      <p class="muted">현장에 맞는 프로젝트를 선택해 초기 세팅 가이드와 업데이트 파일을 확인하세요.</p>
    </div>
  </div>

  <div v-if="error" class="alert alert-error">{{ error }}</div>
  <p v-else-if="loading" class="muted">불러오는 중...</p>
  <div v-else-if="projects.length === 0" class="empty">등록된 프로젝트가 없습니다.</div>
  <ul v-else class="grid">
    <li v-for="project in projects" :key="project.id">
      <RouterLink :to="{ name: 'project', params: { projectId: project.id } }" class="card project-card">
        <h2>{{ project.name }}</h2>
        <p class="muted desc">{{ project.description || '설명 없음' }}</p>
      </RouterLink>
    </li>
  </ul>
</template>

<style scoped>
.grid {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(260px, 1fr));
  gap: 16px;
}

.project-card {
  display: block;
  height: 100%;
  color: inherit;
  text-decoration: none;
  transition: border-color 0.15s;
}

.project-card:hover {
  border-color: var(--accent);
}

.project-card h2 {
  margin-bottom: 6px;
}

.desc {
  margin: 0;
  font-size: 14px;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
