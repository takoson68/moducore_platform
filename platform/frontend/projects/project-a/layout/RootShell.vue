<!-- projects/project-a/layout/RootShell.vue -->
<script setup>
import ProjectTopbar from '../components/ProjectTopbar.vue'
import ProjectSidebar from '../components/ProjectSidebar.vue'

defineProps({
  projectConfig: Object,
  discoveredModules: Array
})
</script>

<template lang="pug">
.shell
  ProjectTopbar(:project-config="projectConfig")

  .main
    ProjectSidebar

    section.content
      .module-shell
        .module-body
          RouterView

  footer.footer
    span World Shell Footer
</template>

<style lang="sass">

:root
  --project-a-topbar-height: 78px
  --project-a-footer-height: 44px
  --project-a-sidebar-width: 230px

.shell
  height: 100vh
  display: grid
  grid-template-rows: 1fr
  background: var(--bg)
  overflow: hidden

.status
  margin: 8px 0 16px
  font-weight: 600

.main
  display: block
  padding: 16px 20px
  box-sizing: border-box
  margin-top: var(--project-a-topbar-height)
  margin-bottom: var(--project-a-footer-height)
  height: calc(100vh - var(--project-a-topbar-height) - var(--project-a-footer-height))
  overflow-y: scroll
  overflow-x: hidden
  scrollbar-width: thin
  scrollbar-color: #6d7ea8 #dbe6ff

.main::-webkit-scrollbar
  width: 10px

.main::-webkit-scrollbar-track
  background: #dbe6ff

.main::-webkit-scrollbar-thumb
  background: #6d7ea8
  border-radius: 999px
  border: 2px solid #dbe6ff

.content
  display: flex
  flex-direction: column
  gap: 10px
  height: 100%
  min-height: 0
  margin-left: calc(var(--project-a-sidebar-width) + 20px)
  background: var(--surface)
  border: 1px solid var(--border)
  border-radius: 24px
  padding: 16px

.main > .sidebar
  position: fixed
  top: 0
  bottom: 0
  left: 0
  width: var(--project-a-sidebar-width)
  box-sizing: border-box
  border-left: 0
  border-radius: 0
  overflow-y: auto
  overflow-x: hidden
  scrollbar-width: thin
  scrollbar-color: #506196 #182657

.main > .sidebar::-webkit-scrollbar
  width: 10px

.main > .sidebar::-webkit-scrollbar-track
  background: #182657

.main > .sidebar::-webkit-scrollbar-thumb
  background: #506196
  border-radius: 999px
  border: 2px solid #182657
  background: linear-gradient(180deg, #0f1632 0%, #161f46 100%)
  border-right: 1px solid #1f2a5c

section.content
  display: flex
  flex-direction: column
  height: 100%
  min-height: 0
  .module-shell
    flex: 1

.module-shell
  display: flex
  flex-direction: column
  min-height: 0
  border: 1px solid #e2e9ff
  border-radius: 18px
  background: var(--surface)
  overflow: hidden

.module-body
  flex: 1
  min-height: 0
  padding: 10px
  overflow: visible

.footer
  position: fixed
  left: var(--project-a-sidebar-width)
  right: 0
  bottom: 0
  height: var(--project-a-footer-height)
  box-sizing: border-box
  display: flex
  align-items: center
  padding: 12px 24px
  border-top: 1px solid #e2e9ff
  background: var(--surface)
  color: var(--text-muted)
  font-size: 12px
  z-index: 10001
</style>
