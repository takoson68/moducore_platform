<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FlowTopbar from '../components/FlowTopbar.vue'
import FlowSidebar from '../components/FlowSidebar.vue'
import FlowRail from '../components/FlowRail.vue'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'
import { canAccessFlowRoute, filterAccessibleFlowRoutes, findFlowFallbackPath } from '@project/services/flowCenterRouteAccess.js'

const route = useRoute()
const router = useRouter()
const auth = useFlowCenterAuth()

const accessibleRoutes = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  return filterAccessibleFlowRoutes(bucket.all || [], auth.user.value)
})

const currentChildRoute = computed(() =>
  [...route.matched]
    .reverse()
    .find((item) => item.name !== 'root' && item.path !== '/')
)

watch(
  () => [route.fullPath, auth.isLoggedIn.value, auth.role.value, auth.companyId.value].join('|'),
  async () => {
    const activeRoute = currentChildRoute.value
    if (!activeRoute) return
    if (canAccessFlowRoute(activeRoute, auth.user.value)) return

    const fallbackPath = findFlowFallbackPath(accessibleRoutes.value, auth.user.value)
    if (fallbackPath && fallbackPath !== route.path) {
      await router.replace(fallbackPath)
    }
  },
  { immediate: true }
)
</script>

<template lang="pug">
.shell
  .shell-window.flow-glass
    FlowSidebar
    .shell-main
      FlowTopbar
      .shell-content
        section.shell-view
          RouterView
        FlowRail
</template>

<style lang="sass">
.shell
  height: 100vh
  display: grid
  padding: 2em
  position: relative
  overflow: hidden

.shell-window
  width: 100%
  height: 100%
  min-height: 0
  border-radius: 22px
  display: grid
  grid-template-columns: 220px minmax(0, 1fr)
  overflow: hidden

.shell-main
  display: grid
  grid-template-rows: auto 1fr
  min-width: 0
  min-height: 0
  height: 100%
  overflow: auto

.shell-content
  display: grid
  grid-template-columns: minmax(0, 1fr) 312px
  gap: 22px
  padding: 12px 22px 22px
  min-width: 0
  min-height: 0

.shell-view
  min-width: 0
  min-height: 0

@media (max-width: 1180px)
  .shell-content
    grid-template-columns: 1fr

@media (max-width: 960px)
  .shell
    padding: 2em

  .shell-window
    grid-template-columns: 1fr

  .shell-content
    padding: 16px
</style>
