<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { container } from '@app/container'

defineProps({
  projectConfig: Object
})

const route = useRoute()
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

const isItemActive = (item) => {
  if (!item?.path) return false
  if (route.path === item.path) return true
  if (Array.isArray(item.children)) {
    return item.children.some(child => route.path === child.path)
  }
  return false
}
</script>

<template lang="pug">
header.topbar
  .brand
    .brand-title {{ projectConfig?.title ?? 'Project' }}
    .brand-sub Guest World Establishment
  nav.topbar-nav(v-if="topbarItems.length")
    .topbar-item(
      v-for="item in topbarItems"
      :key="item.path"
      :class="{ active: isItemActive(item) }"
    )
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
  .pill Project B
</template>

<style lang="sass">
.topbar
  display: flex
  align-items: center
  justify-content: space-between
  padding: 18px 28px
  border-bottom: 1px solid rgba(15, 23, 42, 0.08)
  background: rgba(255, 255, 255, 0.75)
  backdrop-filter: blur(6px)
  position: relative
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
  padding: 6px 12px
  border-radius: 999px
  border: 1px solid rgba(15, 23, 42, 0.16)
  background: rgba(255, 255, 255, 0.7)
  text-decoration: none
  color: inherit
  font-size: 12px
  font-weight: 600
  transition: transform 120ms ease, box-shadow 120ms ease

.topbar-link.is-active,
.topbar-item.active .topbar-link
  border-color: #0f172a
  background: #0f172a
  color: #fff

.topbar-submenu
  position: absolute
  top: 100%
  left: 0
  min-width: 160px
  padding: 8px
  border-radius: 12px
  border: 1px solid rgba(15, 23, 42, 0.16)
  background: rgba(255, 255, 255, 0.95)
  box-shadow: 0 12px 24px rgba(15, 23, 42, 0.16)
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
  border: 1px solid rgba(15, 23, 42, 0.14)
  background: rgba(248, 250, 252, 0.9)
  text-decoration: none
  color: inherit
  font-size: 12px
  font-weight: 600

.topbar-sub-link.is-active
  border-color: #0f172a
  background: #0f172a
  color: #fff

.brand-title
  font-size: 22px
  font-weight: 700
  letter-spacing: 0.3px

.brand-sub
  font-size: 12px
  color: #0f172a
  opacity: 0.6

.pill
  padding: 6px 12px
  border-radius: 999px
  border: 1px solid rgba(14, 116, 144, 0.2)
  background: rgba(14, 116, 144, 0.12)
  color: #0e7490
  font-size: 12px
  font-weight: 600
</style>
