<script setup lang="ts">
import { useAccessStore } from '@/stores/access'

/** 허용되지 않은 IP 로 접속했을 때의 화면. 현장 직원이 이 IP 를 전화로 알려 주면 관리자가 허용 IP 에 등록한다 */
const access = useAccessStore()

function retry() {
  window.location.reload()
}
</script>

<template>
  <div class="blocked-page">
    <div class="card blocked-card" role="alert">
      <h1>허용되지 않은 IP입니다.</h1>
      <p class="muted">현재 접속 IP</p>
      <code class="ip">{{ access.blockedIp ?? '알 수 없음' }}</code>
      <p class="muted help">접속이 필요하면 담당자에게 위 IP 를 알려 주세요.<br />등록된 뒤 아래 버튼을 누르면 바로 접속됩니다.</p>
      <button type="button" class="btn btn-primary" @click="retry">다시 확인</button>
    </div>
  </div>
</template>

<style scoped>
.blocked-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.blocked-card {
  width: 100%;
  max-width: 420px;
  padding: 32px 28px;
  text-align: center;
}

h1 {
  font-size: 20px;
  margin: 0 0 16px;
}

.ip {
  display: inline-block;
  margin: 4px 0 16px;
  padding: 8px 14px;
  font-size: 18px;
  font-weight: 600;
}

.help {
  font-size: 14px;
  line-height: 1.6;
  margin-bottom: 20px;
}
</style>
