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
    aside.sidebar-wrap(v-if="isLoggedIn")
      ProjectSidebar
    section.content
      RouterView
</template>

<style lang="sass">
.shell
  --project-a-topbar-height: 72px
  --project-a-sidebar-width: 240px
  min-height: 100vh
  background: var(--bg)

.main
  display: flex
  min-height: 100vh

.sidebar-wrap
  position: fixed
  top: 0
  left: 0
  width: var(--project-a-sidebar-width)
  height: 100vh
  z-index: 10003

.content
  flex: 1 1 auto
  min-width: 0
  margin-left: var(--project-a-sidebar-width)
  padding-top: var(--project-a-topbar-height)

.main.no-sidebar .content
  margin-left: 0

@media (max-width: 960px)
  .sidebar-wrap
    display: none
  .content
    margin-left: 0
</style>
