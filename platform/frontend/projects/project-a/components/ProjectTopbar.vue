<script setup>
import { computed } from 'vue'
import { container } from '@app/container'
import PlatformLoginPanel from './PlatformLoginPanel.vue'

defineProps({
  projectConfig: Object
})

const resolveNavProjection = container.getService('resolveNavProjection')
const navProjection = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return resolveNavProjection(bucket.all || [])
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
</style>
