<script setup lang="ts">
import type { UpdateStatus } from '@/api/types'

defineProps<{ status: UpdateStatus }>()
</script>

<template>
  <span v-if="status === 'ACTIVE'" class="badge badge-success">배포 중</span>
  <span v-else class="badge badge-danger">중단됨</span>
</template>
