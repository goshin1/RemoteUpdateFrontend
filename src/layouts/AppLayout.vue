<script setup lang="ts">
// store
import { useAuthStore } from '@/stores/auth'
// components
import Header from "@/components/Header.vue";

const auth = useAuthStore()

</script>

<template>
  <div class="layout">
    <Header/>
    <!-- 관리 기능을 쓸 수 없는 위치에서 접속한 개발자·관리자에게 미리 안내 (서버가 IP 제한으로 막기 전에) -->
    <div v-if="auth.me && auth.hasRole('DEVELOPER') && !auth.me.managementAllowed" class="ip-banner" role="status">
      현재 접속 위치(<code>{{ auth.me.clientIp }}</code>)에서는 등록·수정 같은 관리 기능을 쓸 수 없습니다. 조회와 다운로드는 가능합니다.
    </div>
    <main class="container">
      <slot />
    </main>
  </div>
</template>

<style scoped>

</style>
