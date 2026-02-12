<!-- projects/project-a/layout/LayoutRoot.vue -->
<script setup>
import { computed } from 'vue'
import world from '@/world.js'
import ProjectTopbar from '../components/ProjectTopbar.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'

const authStore = world.store('auth')
const projectConfig = computed(() => world.projectConfig() || {})
const isLoggedIn = computed(() => authStore.isLoggedIn())
</script>

<template lang="pug">
.shell(:class="{ 'no-sidebar': !isLoggedIn }")
  ProjectTopbar(:project-config="projectConfig")
  .main(:class="{ 'no-sidebar': !isLoggedIn }")
    ProjectSidebar(v-if="isLoggedIn")
    section.content
      RouterView
</template>

<style lang="sass">
.shell
  --project-a-topbar-height: 60px
  --project-a-sidebar-width: 248px
  --project-a-shell-padding: 20px
  --project-a-layout-gap: 20px
  --project-a-content-offset: var(--project-a-sidebar-width)
  min-height: 100vh
  background: var(--bg)
  color: var(--text-main)

.main
  min-height: 100vh

.sidebar
  position: fixed
  top: 0
  left: 0
  bottom: 0
  width: var(--project-a-sidebar-width)
  height: auto
  z-index: 10003

.content
  min-width: 0
  padding: var(--project-a-topbar-height) var(--project-a-shell-padding) var(--project-a-shell-padding)
  margin-left: var(--project-a-content-offset)

.main.no-sidebar .content
  margin-left: 0

@media (max-width: 960px)
  .topbar
    left: 0
    height: auto

  .sidebar
    position: static
    width: 100%
    height: auto

  .content
    margin-left: 0
</style>
