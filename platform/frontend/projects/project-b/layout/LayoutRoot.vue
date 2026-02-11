<!-- projects/project-b/layout/LayoutRoot.vue -->
<script setup>
import { computed } from 'vue'
import world from '@/world.js'
import ProjectTopbar from '../components/ProjectTopbar.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'

const authStore = world.store("auth")
const projectConfig = computed(() => world.projectConfig() || {})
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
  --project-b-topbar-height: 96px
  --project-b-shell-padding: 28px
  --project-b-sidebar-width: 240px
  --project-b-layout-gap: 20px
  --project-b-sidebar-edge-gap: 1em
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
  padding: 4em var(--project-b-shell-padding) var(--project-b-shell-padding)
  position: relative
  display: flex
  height: 100vh
  gap: var(--project-b-layout-gap)

.content
  min-width: 0
  display: flex
  flex: 1 1 auto
  margin-left: calc(var(--project-b-sidebar-width) + var(--project-b-layout-gap))

.main.no-sidebar .content
  margin-left: 0

@media (max-width: 960px)
  .content
    margin-left: 0
</style>
