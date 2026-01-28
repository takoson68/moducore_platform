<!-- projects/project-b/components/ProjectSidebar.vue -->
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { container } from '@app/container'

const route = useRoute()
const authStore = container.resolve('auth')
const resolveNavProjection = container.getService('resolveNavProjection')
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
  display: grid
  gap: 12px
  padding: 16px
  border: 1px solid rgba(15, 23, 42, 0.12)
  border-radius: 18px
  background: rgba(255, 255, 255, 0.82)
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.08)
  backdrop-filter: blur(12px)
  height: calc( 90vh - 1em )
  position: sticky
  top: 5em
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
  border: 1px solid rgba(15, 23, 42, 0.12)
  background: rgba(248, 250, 252, 0.8)
  text-decoration: none
  color: inherit
  font-size: 14px
  font-weight: 700
  position: relative
  transition: transform 120ms ease, box-shadow 120ms ease

.main-link.group-label
  cursor: default
  opacity: 0.7

.main-link.is-active
  border-color: #0f172a
  background: #0f172a
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
  background: rgba(15, 23, 42, 0.2)

.sub-link
  padding: 8px 12px
  border-radius: 12px
  border: 1px solid rgba(15, 23, 42, 0.12)
  background: rgba(248, 250, 252, 0.9)
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
  border-color: #0f172a
  background: #0f172a
  color: #fff

@media (max-width: 960px)
  .sidebar
    position: sticky
    top: 88px
    z-index: 2

.sidebar-item:hover .submenu,
.sidebar-item.active .submenu
  max-height: 400px
  opacity: 1
</style>
