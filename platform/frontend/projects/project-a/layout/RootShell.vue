<script setup>
import { computed } from 'vue'
import { container } from '../../../src/app/container/container.js'

const props = defineProps({
  projectConfig: Object,
  discoveredModules: Array
})

const navRoutes = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return (bucket.all || []).map(route => ({
    path: route.path,
    label: route.meta?.label ?? route.meta?.nav?.label ?? route.name ?? route.path
  }))
})

const lifecycleStore = container.resolve('lifecycle')
const moduleStore = container.resolve('module')
const phase = computed(() => lifecycleStore.state.phase)
const moduleCount = computed(() => moduleStore.state.modules.length)
</script>

<template lang="pug">
.shell
  header.topbar
    .brand
      .brand-title {{ projectConfig?.title ?? 'Project' }}
      .brand-sub Guest World Establishment · {{ phase }}
    .topbar-actions
      span.badge {{ projectConfig?.name ?? 'unknown' }}
      span.badge Modules {{ moduleCount }}

  .main
    aside.sidebar
      nav.module-nav
        RouterLink(
          v-for="route in navRoutes"
          :key="route.path"
          :to="route.path"
          class="module-link"
          active-class="is-active"
        )
          | {{ route.label }}

    section.content
      h2 View
      .module-shell
        .module-body
          RouterView

  footer.footer
    span World Shell Footer
</template>

<style lang="sass">
@use "../layout/base" as *

.shell
  min-height: 100vh
  display: grid
  grid-template-rows: auto 1fr auto
  background: #f5f6f7

.status
  margin: 8px 0 16px
  font-weight: 600

.topbar
  display: flex
  align-items: center
  justify-content: space-between
  padding: 14px 24px
  border-bottom: 1px solid var(--border)
  background: var(--surface)

.brand-title
  font-size: 20px
  font-weight: 700

.brand-sub
  font-size: 13px
  color: #6b7280

.badge
  padding: 6px 10px
  border-radius: 999px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  font-size: 12px
  margin-left: 6px

.main
  display: grid
  grid-template-columns: 220px 1fr
  gap: 20px
  padding: 20px 24px

.sidebar
  display: grid
  gap: 12px
  padding: 16px
  border: 1px solid var(--border)
  border-radius: 16px
  background: var(--surface)


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
    max-height: 3em
  .module-shell
    flex: 1

.module-shell
  border: 1px solid var(--border)
  border-radius: 16px
  background: var(--surface)
  overflow: hidden

.module-body
  padding: 8px 0

.module-nav
  display: flex
  flex-direction: column
  gap: 8px

.module-link
  padding: 6px 12px
  border-radius: 10px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  text-decoration: none
  color: inherit
  font-size: 13px

.module-link.is-active
  border-color: #000
  background: #000
  color: #fff

.footer
  padding: 12px 24px
  border-top: 1px solid var(--border)
  background: var(--surface)
  color: #6b7280
  font-size: 12px
</style>
