<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'
import AppLayout from '@/layouts/AppLayout.vue'
import IpBlockedView from '@/views/IpBlockedView.vue'
import { useAccessStore } from '@/stores/access'

const route = useRoute()
const access = useAccessStore()
</script>

<template>
  <IpBlockedView v-if="access.blocked" />
  <RouterView v-else-if="route.meta.public" />
  <AppLayout v-else>
    <RouterView />
  </AppLayout>
</template>
