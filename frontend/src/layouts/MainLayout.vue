<template>
  <div class="app-root flex min-h-screen bg-white text-gray-900">
    <LeftNav />

    <main class="flex-1 p-6 overflow-auto bg-white ml-16 md:ml-[220px]">
      <router-view />
    </main>
  </div>
</template>

<script setup>
import LeftNav from '../components/LeftNav.vue'
</script>

<style scoped>
.app-root {
  font-family:
    Inter,
    ui-sans-serif,
    system-ui,
    -apple-system,
    'Segoe UI',
    Roboto,
    'Helvetica Neue',
    Arial;
}
</style>
