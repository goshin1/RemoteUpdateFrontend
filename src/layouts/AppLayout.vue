<script setup lang="ts">
// components
import Header from "@/components/Header.vue";

</script>

<template>
  <div class="layout">
    <Header/>
    <main class="container">
      <slot />
    </main>
  </div>
</template>

<style scoped>

</style>
