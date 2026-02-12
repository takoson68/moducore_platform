<!-- projects/_proTemp/layout/LayoutRoot.vue -->
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
.shell
  ProjectTopbar(:project-config="projectConfig")
  .main(:class="{ 'no-sidebar': !isLoggedIn }")
    ProjectSidebar(v-if="isLoggedIn")
    section.content
      RouterView
</template>

<style lang="sass">
.shell
  --project-template-topbar-height: 88px
  --project-template-sidebar-width: 240px
  --project-template-shell-padding: 20px
  --project-template-layout-gap: 20px
  min-height: 100vh
  background: var(--surface, #ffffff)

.main
  min-height: 100vh

.topbar
  position: fixed
  top: 0
  left: var(--project-template-sidebar-width)
  right: 0
  z-index: 10010

.sidebar
  position: fixed
  top: 0
  left: 0
  bottom: 0
  width: var(--project-template-sidebar-width)
  border-radius: 0
  z-index: 10011

.content
  min-width: 0
  padding: calc(var(--project-template-topbar-height) + var(--project-template-shell-padding)) var(--project-template-shell-padding) var(--project-template-shell-padding)
  margin-left: var(--project-template-sidebar-width)

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
