<!-- projects/project-a/layout/LayoutRoot.vue -->
<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import ProjectTopbar from '../components/ProjectTopbar.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'

const authStore = world.store('auth')
const route = useRoute()
const projectConfig = computed(() => world.projectConfig() || {})
const isLoggedIn = computed(() => authStore.isLoggedIn())
const mobileSidebarOpen = ref(false)

function toggleMobileSidebar() {
  if (!isLoggedIn.value) return
  mobileSidebarOpen.value = !mobileSidebarOpen.value
}

function closeMobileSidebar() {
  mobileSidebarOpen.value = false
}

watch(() => route.fullPath, closeMobileSidebar)
watch(isLoggedIn, (next) => {
  if (!next) closeMobileSidebar()
})
</script>

<template lang="pug">
.shell
  ProjectTopbar(
    :project-config="projectConfig"
    :can-open-sidebar="isLoggedIn"
    :sidebar-open="mobileSidebarOpen"
    @toggle-sidebar="toggleMobileSidebar"
  )
  .main(:class="{ 'no-sidebar': !isLoggedIn }")
    button.sidebar-overlay(
      v-if="isLoggedIn && mobileSidebarOpen"
      type="button"
      aria-label="關閉側欄"
      @click="closeMobileSidebar"
    )
    aside.sidebar-wrap(
      v-if="isLoggedIn"
      id="project-a-sidebar"
      :class="{ 'is-open': mobileSidebarOpen }"
    )
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
  .sidebar-overlay
    position: fixed
    inset: 0
    z-index: 10004
    border: 0
    background: rgba(16, 24, 40, 0.42)
    padding: 0
    margin: 0
    appearance: none

  .sidebar-wrap
    display: block
    top: 0
    left: 0
    z-index: 10005
    width: min(88vw, 300px)
    transform: translateX(-100%)
    transition: transform 180ms ease
    box-shadow: 0 18px 40px rgba(16, 24, 40, 0.24)

  .sidebar-wrap.is-open
    transform: translateX(0)

  .content
    margin-left: 0
    padding-top: 0
</style>
