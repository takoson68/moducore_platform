<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import FlowAuthCard from './FlowAuthCard.vue'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'
import { filterAccessibleFlowRoutes } from '@project/services/flowCenterRouteAccess.js'

const route = useRoute()
const auth = useFlowCenterAuth()
const projectConfig = computed(() => world.projectConfig() || {})
const resolveNavProjection = world.service('resolveNavProjection')

const pageTitle = computed(() => {
  const matched = [...route.matched].reverse().find((item) => item.meta?.title)
  return matched?.meta?.title || '流程中心'
})

const pageDescription = computed(() => {
  const matched = [...route.matched].reverse().find((item) => item.meta?.description)
  return matched?.meta?.description || `${projectConfig.value.title || 'Flow Center'} 以登入身份決定資料與模組可見性`
})

const topbarItems = computed(() => {
  const bucket = window.__MODULE_ROUTES__ || { all: [] }
  const accessibleRoutes = filterAccessibleFlowRoutes(bucket.all || [], auth.user.value)
  const projection = resolveNavProjection(accessibleRoutes)
  return (projection.topbar || []).filter((item) => {
    const routeRecord = accessibleRoutes.find((routeItem) => routeItem.path === item.path)
    const topbarEntry = routeRecord?.meta?.nav?.find((entry) => entry?.area === 'topbar')
    return topbarEntry?.display !== false
  })
})
</script>

<template lang="pug">
header.topbar
  .title-group
    p.eyebrow 企業流程中心
    h1.title {{ pageTitle }}
    p.subtitle {{ pageDescription }}
  nav.topbar-nav(v-if="topbarItems.length")
    RouterLink.topbar-link(
      v-for="item in topbarItems"
      :key="item.path"
      :to="item.path"
      :class="{ 'is-active': route.path === item.path }"
    ) {{ item.label }}
  .topbar-actions
    FlowAuthCard
</template>

<style lang="sass">
.topbar
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 18px
  padding: 26px 26px 12px
  position: sticky
  top: 0
  z-index: 8
  background: linear-gradient(180deg, rgba(248, 246, 255, 0.94), rgba(248, 246, 255, 0.84) 72%, rgba(248, 246, 255, 0))
  backdrop-filter: blur(12px)

.title-group
  display: grid
  gap: 4px

.eyebrow
  margin: 0
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase
  color: rgba(90, 79, 116, 0.54)

.title
  margin: 0
  font-size: 34px
  line-height: 1.1
  color: #241b31

.subtitle
  margin: 0
  color: rgba(63, 54, 79, 0.66)

.topbar-nav
  display: flex
  gap: 10px
  align-items: center
  flex: 1
  justify-content: center

.topbar-link
  text-decoration: none
  padding: 8px 12px
  border-radius: 999px
  color: rgba(63, 54, 79, 0.72)
  border: 1px solid rgba(90, 79, 116, 0.16)
  background: rgba(255, 255, 255, 0.58)
  font-size: 13px
  font-weight: 700

.topbar-link.is-active
  background: #241b31
  color: #fff
  border-color: #241b31

.topbar-actions
  display: grid
  gap: 12px
  align-items: start

@media (max-width: 960px)
  .topbar
    padding: 18px 18px 10px
    flex-direction: column

  .topbar-nav
    justify-content: flex-start
    flex-wrap: wrap

  .topbar-actions
    width: 100%
    grid-template-columns: 1fr

  .title
    font-size: 28px
</style>
