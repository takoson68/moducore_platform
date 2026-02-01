<!-- projects/_proTemp/layout/RootShell.vue -->
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
      h2 View
      .module-shell
        .module-body
          RouterView

  footer.footer
    span World Shell Footer
</template>

<style lang="sass">
.shell
  min-height: 100vh
  display: grid
  grid-template-rows: auto 1fr auto
  background: #f5f6f7

.main
  display: grid
  grid-template-columns: 220px 1fr
  gap: 20px
  padding: 20px 24px

.content
  display: grid
  gap: 12px

section.content
  display: flex
  flex-direction: column
  h2
    margin: 0
    font-size: 1.5em
    font-weight: 600
  .module-shell
    flex: 1

.module-shell
  border: 1px solid var(--border)
  border-radius: 16px
  background: var(--surface)
  overflow: hidden

.module-body
  padding: 8px 0

.footer
  padding: 12px 24px
  border-top: 1px solid var(--border)
  background: var(--surface)
  color: #6b7280
  font-size: 12px
</style>
