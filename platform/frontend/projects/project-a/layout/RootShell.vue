<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { container } from '../../../src/app/container/container.js'
import { resolveNavProjection } from '../../../src/app/nav/resolveNavProjection.js'

const props = defineProps({
  projectConfig: Object,
  discoveredModules: Array
})

const route = useRoute()
const navProjection = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return resolveNavProjection(bucket.all || [])
})

const navTree = computed(() => {
  const nodes = new Map()
  const routes = navProjection.value.sidebar || []
  routes.forEach((route) => {
    nodes.set(route.path, { ...route, children: [] })
  })

  const roots = []
  routes.forEach((route) => {
    const parentPath = route.parent
    if (parentPath && nodes.has(parentPath)) {
      nodes.get(parentPath).children.push(nodes.get(route.path))
    } else {
      roots.push(nodes.get(route.path))
    }
  })

  const sortByOrder = (a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return String(a.label || '').localeCompare(String(b.label || ''))
  }

  const toNavItem = (node) => ({
    path: node.path,
    label: node.label,
    children: node.children.sort(sortByOrder).map(toNavItem)
  })

  return roots.sort(sortByOrder).map(toNavItem)
})

const topbarItems = computed(() => {
  const unique = new Map()
  ;(navProjection.value.topbar || []).forEach((item) => {
    if (!item?.path || unique.has(item.path)) return
    unique.set(item.path, { ...item, children: [] })
  })

  const nodes = [...unique.values()]
  const nodeMap = new Map(nodes.map(node => [node.path, node]))
  const roots = []

  nodes.forEach((node) => {
    const parentPath = node.parent
    if (parentPath && nodeMap.has(parentPath)) {
      nodeMap.get(parentPath).children.push(node)
    } else {
      roots.push(node)
    }
  })

  const sortByOrder = (a, b) => {
    const orderDiff = (a.order || 0) - (b.order || 0)
    if (orderDiff !== 0) return orderDiff
    return String(a.label || '').localeCompare(String(b.label || ''))
  }

  nodes.forEach((node) => {
    node.children.sort(sortByOrder)
  })

  return roots.sort(sortByOrder)
})

const activePath = computed(() => route.path)
const isItemActive = (item) => {
  if (!item?.path) return false
  if (activePath.value === item.path) return true
  if (Array.isArray(item.children)) {
    return item.children.some(child => activePath.value === child.path)
  }
  return false
}

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
    nav.topbar-nav(v-if="topbarItems.length")
      .topbar-item(v-for="item in topbarItems" :key="item.path")
        RouterLink(
          :to="item.path"
          class="topbar-link"
          active-class="is-active"
          exact-active-class="is-active"
        )
          | {{ item.label }}
        .topbar-submenu(v-if="item.children && item.children.length")
          RouterLink(
            v-for="child in item.children"
            :key="child.path"
            :to="child.path"
            class="topbar-sub-link"
            active-class="is-active"
            exact-active-class="is-active"
          )
            | {{ child.label }}
    .topbar-actions
      span.badge {{ projectConfig?.name ?? 'unknown' }}
      span.badge Modules {{ moduleCount }}

  .main
    aside.sidebar
      nav.module-nav
        .sidebar-item(
          v-for="route in navTree"
          :key="route.path"
          :class="{ active: isItemActive(route) }"
        )
          RouterLink(
            :to="route.path"
            class="main-link"
            active-class="is-active"
            exact-active-class="is-active"
          )
            span.link-label {{ route.label }}
          .submenu(v-if="route.children && route.children.length")
            RouterLink(
              v-for="child in route.children"
              :key="child.path"
              :to="child.path"
              class="sub-link"
              active-class="is-active"
              exact-active-class="is-active"
            )
              span.link-label {{ child.label }}

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
  gap: 16px

.topbar-nav
  display: flex
  gap: 10px
  flex: 1
  justify-content: center

.topbar-item
  position: relative
  display: flex
  align-items: center
  padding-bottom: 6px

.topbar-link
  padding: 6px 10px
  border-radius: 999px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  text-decoration: none
  color: inherit
  font-size: 12px
  font-weight: 600

.topbar-link.is-active
  border-color: #000
  background: #000
  color: #fff

.topbar-submenu
  position: absolute
  top: 100%
  left: 0
  min-width: 160px
  padding: 8px
  border-radius: 12px
  border: 1px solid var(--border)
  background: var(--surface)
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.12)
  display: grid
  gap: 6px
  opacity: 0
  pointer-events: none
  transform: translateY(6px)
  transition: opacity 140ms ease, transform 140ms ease

.topbar-item:hover .topbar-submenu,
.topbar-item:focus-within .topbar-submenu,
.topbar-submenu:hover
  opacity: 1
  pointer-events: auto
  transform: translateY(0)

.topbar-sub-link
  padding: 6px 10px
  border-radius: 10px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  text-decoration: none
  color: inherit
  font-size: 12px
  font-weight: 600

.topbar-sub-link.is-active
  border-color: #000
  background: #000
  color: #fff

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
  gap: 10px

.sidebar-item
  display: flex
  flex-direction: column
  gap: 8px

.main-link
  padding: 10px 14px
  border-radius: 14px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  text-decoration: none
  color: inherit
  font-size: 14px
  font-weight: 700
  position: relative
  transition: transform 120ms ease, box-shadow 120ms ease

.main-link.is-active
  border-color: #000
  background: #000
  color: #fff

.submenu
  display: flex
  flex-direction: column
  gap: 8px
  padding-left: 16px
  position: relative
  max-height: 0
  opacity: 0
  overflow: hidden
  transition: max-height 160ms ease, opacity 160ms ease

.submenu::before
  content: ''
  position: absolute
  left: 6px
  top: 2px
  width: 1px
  height: calc(100% - 4px)
  background: rgba(0, 0, 0, 0.12)

.sub-link
  padding: 8px 12px
  border-radius: 12px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  color: inherit
  text-decoration: none
  font-size: 13px
  font-weight: 600
  position: relative

.sub-link::before
  content: ''
  position: absolute
  left: -12px
  top: 50%
  width: 10px
  height: 1px
  background: rgba(0, 0, 0, 0.2)

.sub-link.is-active
  border-color: #000
  background: #000
  color: #fff

.sidebar-item:hover .submenu,
.sidebar-item.active .submenu
  max-height: 400px
  opacity: 1

.footer
  padding: 12px 24px
  border-top: 1px solid var(--border)
  background: var(--surface)
  color: #6b7280
  font-size: 12px
</style>
