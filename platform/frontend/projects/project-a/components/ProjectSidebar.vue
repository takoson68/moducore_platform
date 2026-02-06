<!-- projects/project-a/components/ProjectSidebar.vue -->
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
  .sidebar-logo
    img.sidebar-logo__img(src="/assets/icons/moducore.png" alt="ModuCore")
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
  --sidebar-text: #e9f2ff
  --sidebar-text-strong: #ffffff
  --sidebar-border: #2b6fda
  --sidebar-surface: rgba(89, 165, 255, 0.18)
  --sidebar-surface-hover: rgba(137, 194, 255, 0.24)
  --sidebar-active-bg: linear-gradient(180deg, #2f7dff 0%, #0f58e6 100%)
  display: flex
  flex-direction: column
  align-items: stretch
  justify-content: flex-start
  gap: 14px
  height: 100%
  padding: 18px 14px
  // border: 1px solid var(--sidebar-border)
  border-radius: 0
  background: linear-gradient(180deg, #67b5ff 0%, #4a98eb 43%, #1f70d3 74%, #0d50b5 100%)

.sidebar-logo
  display: flex
  align-items: center
  justify-content: center
  padding: 4px 2px 10px

.sidebar-logo__img
  width: 140px
  height: auto
  display: block
  margin: 0 auto
  border-radius: 16px
  // border: 1px solid #2e3f78

.module-nav
  display: flex
  flex-direction: column
  justify-content: flex-start
  gap: 12px
  flex: 1

.sidebar-item
  display: flex
  flex-direction: column
  // gap: 10px

.main-link
  display: flex
  align-items: center
  gap: 0
  padding: 12px 24px
  border-radius: 22px
  border: 1px solid rgba(255, 255, 255, 0.12)
  background: var(--sidebar-surface)
  text-decoration: none
  color: var(--sidebar-text)
  font-size: 15px
  font-weight: 700
  position: relative
  transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease

.main-link:hover
  border-color: rgba(255, 255, 255, 0.34)
  background: var(--sidebar-surface-hover)
  color: var(--sidebar-text-strong)

.main-link.is-active
  border-color: rgba(107, 188, 255, 0.85)
  background: var(--sidebar-active-bg)
  color: #ffffff

.submenu
  display: flex
  flex-direction: column
  gap: 10px
  padding-left: 26px
  margin-left: 10px
  position: relative
  max-height: 0
  opacity: 0
  overflow: hidden
  transition: max-height 160ms ease, opacity 160ms ease
  > a:nth-child(1)
    margin-top: 10px

.submenu::before
  content: ''
  position: absolute
  left: 6px
  top: 2px
  width: 1px
  height: calc(100% - 4px)
  background: rgba(255, 255, 255, 0.34)

.sub-link
  display: flex
  align-items: center
  gap: 0
  padding: 10px 12px
  border-radius: 18px
  border: 1px solid rgba(255, 255, 255, 0.2)
  background: rgba(23, 87, 187, 0.3)
  color: var(--sidebar-text)
  text-decoration: none
  font-size: 14px
  font-weight: 600
  position: relative
  transition: border-color 120ms ease, background-color 120ms ease, color 120ms ease

.sub-link:hover
  border-color: rgba(255, 255, 255, 0.34)
  background: rgba(33, 108, 218, 0.42)
  color: var(--sidebar-text-strong)

.sub-link.is-active
  border-color: rgba(255, 255, 255, 0.45)
  background: var(--sidebar-active-bg)
  color: #ffffff

.sidebar-item:hover .submenu,
.sidebar-item.active .submenu
  max-height: 520px
  opacity: 1
</style>
