<!-- projects/_proTemp/components/ProjectSidebar.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const authStore = world.store("auth")
const resolveNavProjection = world.service('resolveNavProjection')
const navProjection = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return resolveNavProjection(bucket.all || [])
})

const navTree = computed(() => {
  const nodes = new Map()
  const isLoggedIn = authStore.isLoggedIn()
  const routes = (navProjection.value.sidebar || []).filter((item) => {
    const access = item?.access || {}
    const hasFlags = typeof access.public === 'boolean' && typeof access.auth === 'boolean'
    if (!hasFlags) return true
    if (access.public === true) return true
    if (access.auth === true) return isLoggedIn
    return false
  })

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
    link: node.link !== false,
    children: node.children.sort(sortByOrder).map(toNavItem)
  })

  return roots.sort(sortByOrder).map(toNavItem)
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
aside.sidebar
  nav.module-nav
    .sidebar-item(
      v-for="route in navTree"
      :key="route.path"
      :class="{ active: isItemActive(route), group: route.link === false }"
    )
      RouterLink(
        v-if="route.link !== false"
        :to="route.path"
        class="main-link"
        active-class="is-active"
        exact-active-class="is-active"
      )
        span.link-label {{ route.label }}
      span.main-link.group-label(v-else) {{ route.label }}
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
</template>

<style lang="sass">
.sidebar
  --sidebar-border: rgba(30, 41, 59, 0.10)
  --sidebar-border-strong: rgba(59, 130, 246, 0.35)
  --sidebar-muted: rgba(255, 255, 255, 0.82)
  --sidebar-hover: rgba(239, 246, 255, 0.95)
  display: grid
  gap: 12px
  padding: 14px
  border: 1px solid var(--sidebar-border)
  border-radius: 20px
  background: linear-gradient(160deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.92) 52%, rgba(239,246,255,0.92) 100%)
  box-shadow: 0 20px 36px rgba(15, 23, 42, 0.10), 0 6px 14px rgba(59, 130, 246, 0.08)
  backdrop-filter: blur(12px)
  align-content: start
  position: relative
  overflow: hidden

.sidebar::before
  content: ''
  position: absolute
  inset: 0 auto 0 0
  width: 4px
  background: linear-gradient(180deg, #3b82f6 0%, #06b6d4 55%, #14b8a6 100%)

.module-nav
  display: flex
  flex-direction: column
  gap: 10px
  max-height: min(70vh, 640px)
  overflow-y: auto
  padding-right: 2px

.sidebar-item
  display: flex
  flex-direction: column
  gap: 8px

.main-link
  padding: 11px 14px
  border-radius: 16px
  border: 1px solid var(--sidebar-border)
  background: var(--sidebar-muted)
  text-decoration: none
  color: #0f172a
  font-size: 14px
  font-weight: 700
  position: relative
  transition: border-color 120ms ease, background-color 120ms ease, transform 120ms ease, box-shadow 120ms ease

.main-link:hover
  border-color: var(--sidebar-border-strong)
  background: var(--sidebar-hover)
  box-shadow: 0 10px 18px rgba(15, 23, 42, 0.08)
  transform: translateY(-1px)

.main-link.group-label
  cursor: default
  opacity: 0.7

.main-link.is-active
  border-color: rgba(37, 99, 235, 0.55)
  background: linear-gradient(180deg, #2563eb 0%, #1d4ed8 100%)
  color: #fff
  box-shadow: 0 12px 20px rgba(37, 99, 235, 0.22)

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
  background: rgba(15, 23, 42, 0.16)

.sub-link
  padding: 8px 12px
  border-radius: 12px
  border: 1px solid rgba(15, 23, 42, 0.08)
  background: rgba(255, 255, 255, 0.72)
  color: #334155
  text-decoration: none
  font-size: 13px
  font-weight: 600
  position: relative
  transition: border-color 120ms ease, background-color 120ms ease

.sub-link:hover
  border-color: rgba(59, 130, 246, 0.22)
  background: rgba(255, 255, 255, 0.96)

.sub-link::before
  content: ''
  position: absolute
  left: -12px
  top: 50%
  width: 10px
  height: 1px
  background: rgba(0, 0, 0, 0.2)

.sub-link.is-active
  border-color: rgba(37, 99, 235, 0.45)
  background: rgba(219, 234, 254, 0.95)
  color: #1d4ed8

.sidebar-item:hover .submenu,
.sidebar-item.active .submenu
  max-height: 400px
  opacity: 1

@media (max-width: 960px)
  .sidebar
    border-radius: 0
    box-shadow: none
    min-height: 100vh
    padding-top: 76px
</style>
