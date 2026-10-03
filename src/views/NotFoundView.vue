<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>

<template>
  <div class="empty">
    <h1>페이지를 찾을 수 없습니다</h1>
    <p>주소가 잘못되었거나 삭제된 페이지입니다.</p>
    <RouterLink :to="{ name: 'projects' }" class="btn">프로젝트 목록으로</RouterLink>
  </div>
</template>
