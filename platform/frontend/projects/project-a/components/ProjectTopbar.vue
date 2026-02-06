<!-- projects/project-a/components/ProjectTopbar.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { container } from '@app/container'
import PlatformLoginPanel from './PlatformLoginPanel.vue'

defineProps({
  projectConfig: Object
})

const authStore = container.resolve('auth')
const route = useRoute()
const resolveNavProjection = container.getService('resolveNavProjection')
const navProjection = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return resolveNavProjection(bucket.all || [])
})

const topbarItems = computed(() => {
  const isLoggedIn = authStore.isLoggedIn()
  const unique = new Map()
  ;(navProjection.value.topbar || [])
    .filter((item) => {
      const access = item?.access || {}
      const hasFlags = typeof access.public === 'boolean' && typeof access.auth === 'boolean'
      if (!hasFlags) return true
      if (access.public === true) return true
      if (access.auth === true) return isLoggedIn
      return false
    })
    .forEach((item) => {
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

const isItemActive = (item) => {
  if (!item?.path) return false
  if (route.path === item.path) return true
  if (Array.isArray(item.children)) {
    return item.children.some(child => route.path === child.path)
  }
  return false
}

const lifecycleStore = container.resolve('lifecycle')
const moduleStore = container.resolve('module')
const phase = computed(() => lifecycleStore.state.phase)
const moduleCount = computed(() => moduleStore.state.modules.length)
</script>

<template lang="pug">
header.topbar
  .brand
    .brand-title {{ projectConfig?.title ?? 'Project' }}
    .brand-sub Guest World Establishment · {{ phase }}
  //- .topbar-search
    input.search-input(type="text" placeholder="Search")
  nav.topbar-nav(v-if="topbarItems.length")
    .topbar-item(
      v-for="item in topbarItems"
      :key="item.path"
      :class="{ active: isItemActive(item), group: item.link === false }"
    )
      RouterLink(
        v-if="item.link !== false"
        :to="item.path"
        class="topbar-link"
        active-class="is-active"
        exact-active-class="is-active"
      )
        | {{ item.label }}
      span.topbar-link.group-label(v-else) {{ item.label }}
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
    PlatformLoginPanel
    //- span.badge {{ projectConfig?.name ?? 'unknown' }}
    //- span.badge Modules {{ moduleCount }}
</template>

<style lang="sass">
.topbar
  display: flex
  align-items: center
  justify-content: space-between
  padding: 14px 24px
  height: var(--project-a-topbar-height)
  box-sizing: border-box
  border-bottom: 1px solid #e2e9ff
  background: var(--surface)
  gap: 16px
  position: fixed
  top: 0
  left: var(--project-a-sidebar-width)
  right: 0
  z-index: 10002

.topbar-nav
  display: flex
  gap: 10px
  flex: 1 1 auto
  justify-content: center

.topbar-search
  flex: 0 1 320px

.search-input
  width: 100%
  box-sizing: border-box
  border: 1px solid #dbe4ff
  background: #f6f9ff
  color: var(--text-main)
  border-radius: 12px
  padding: 10px 12px
  font-size: 13px

.search-input::placeholder
  color: #9cabcb

.topbar-item
  position: relative
  display: flex
  align-items: center
  padding-bottom: 6px

.topbar-link
  padding: 7px 11px
  border-radius: 999px
  border: 1px solid #dbe4ff
  background: var(--surface-muted)
  text-decoration: none
  color: var(--text-sub)
  font-size: 12px
  font-weight: 600
  transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease

.topbar-link:hover
  border-color: #c6d5ff
  background: var(--surface-elevated)
  color: var(--text-main)

.topbar-link.is-active
  border-color: #8ea3ff
  background: #edf1ff
  color: #445dff

.topbar-submenu
  position: absolute
  top: 100%
  left: 0
  min-width: 160px
  padding: 8px
  border-radius: 12px
  border: 1px solid #dbe4ff
  background: var(--surface)
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
  border: 1px solid #dbe4ff
  background: var(--surface-muted)
  text-decoration: none
  color: var(--text-sub)
  font-size: 12px
  font-weight: 600
  transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease

.topbar-sub-link:hover
  border-color: #c6d5ff
  background: var(--surface-elevated)
  color: var(--text-main)

.topbar-sub-link.is-active
  border-color: #8ea3ff
  background: #edf1ff
  color: #445dff

.brand-title
  font-size: 22px
  font-weight: 700

.brand-sub
  font-size: 13px
  color: var(--text-muted)

.topbar-actions
  display: flex
  align-items: center
  gap: 10px

.badge
  padding: 6px 10px
  border-radius: 999px
  border: 1px solid var(--border)
  background: var(--surface-muted)
  font-size: 12px
  margin-left: 6px
  color: var(--text-sub)
</style>
