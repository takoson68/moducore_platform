<!-- projects/project-b/components/ProjectTopbar.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import PlatformLoginPanel from './PlatformLoginPanel.vue'
import UiSlot from '@/components/UiSlot.vue'

defineProps({
  projectConfig: Object
})

const route = useRoute()
const authStore = world.store("auth")
const resolveNavProjection = world.service('resolveNavProjection')
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
</script>

<template lang="pug">
header.topbar
  .brand
    RouterLink.brand-logo(to="/")
      img(src="/assets/icons/moducore.png" alt="ModuCore")
    .brand-text
      .brand-title {{ projectConfig?.title ?? 'Project' }}
      .brand-sub Guest World Establishment
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
    UiSlot(name="header:right")
    PlatformLoginPanel
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
  position: fixed
  top: 0
  left: 0
  right: 0
  width: 100%
  z-index: 10020
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

.topbar-link.group-label
  cursor: default
  opacity: 0.7

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

.brand
  display: flex
  align-items: center
  gap: 10px

.brand-text
  display: flex
  flex-direction: column
  gap: 0px

.brand-logo
  display: inline-flex
  align-items: center
  justify-content: center
  width: 60px
  height: 60px
  border-radius: 10px
  background: transparent
  overflow: hidden
  text-decoration: none

.brand-logo img
  width: 100%
  height: 100%
  object-fit: contain

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

.topbar-actions
  display: flex
  align-items: center
  gap: 12px
</style>
