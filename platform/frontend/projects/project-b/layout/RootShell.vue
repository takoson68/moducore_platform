<!-- projects/project-b/layout/RootShell.vue -->
<script setup>
import { computed } from 'vue'
import { container } from '@app/container'
import ProjectTopbar from '../components/ProjectTopbar.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'

defineProps({
  projectConfig: Object,
  discoveredModules: Array
})

const authStore = container.resolve('auth')
const isLoggedIn = computed(() => authStore.isLoggedIn())
</script>

<template lang="pug">
.shell
  .bg-grid
  ProjectTopbar(:project-config="projectConfig")
  .main(:class="{ 'no-sidebar': !isLoggedIn }")
    ProjectSidebar(v-if="isLoggedIn")
    section.content
      RouterView
</template>

<style lang="sass">
.shell
  min-height: 100vh
  display: grid
  grid-template-rows: auto 1fr
  background: radial-gradient(1200px 600px at 10% 10%, rgba(34, 211, 238, 0.12), transparent 60%), linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%)
  color: #0f172a
  position: relative
  overflow: auto
  height: 100vh
.bg-grid
  position: absolute
  inset: 0
  background-image: linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px)
  background-size: 28px 28px
  mask-image: radial-gradient(circle at 15% 20%, rgba(0, 0, 0, 0.5), transparent 70%)
  pointer-events: none

.main
  padding: 28px
  position: relative
  display: grid
  grid-template-columns: 240px minmax(0, 1fr)
  gap: 20px

.main.no-sidebar
  grid-template-columns: minmax(0, 1fr)

.content
  min-width: 0
  display: flex

@media (max-width: 960px)
  .main
    grid-template-columns: minmax(0, 1fr)
</style>
