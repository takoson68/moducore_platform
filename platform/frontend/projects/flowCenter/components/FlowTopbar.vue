<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import FlowAuthCard from './FlowAuthCard.vue'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const route = useRoute()
const auth = useFlowCenterAuth()
const projectConfig = computed(() => world.projectConfig() || {})

const pageTitleMap = [
  { match: (path) => path === '/', title: '個人儀表板' },
  { match: (path) => path.startsWith('/leave'), title: '請假申請' },
  { match: (path) => path.startsWith('/purchase'), title: '採購申請' },
  { match: (path) => path.startsWith('/announcement'), title: '公告管理' },
  { match: (path) => path.startsWith('/task'), title: '任務交辦' },
  { match: (path) => path.startsWith('/approval'), title: '主管審核' }
]

const pageTitle = computed(() => {
  const matched = pageTitleMap.find((item) => item.match(route.path))
  return matched?.title || '流程中心'
})

const statusText = computed(() => {
  if (!auth.isLoggedIn.value) return '尚未登入'
  return `${auth.role.value} ｜ ${auth.companyId.value}`
})
</script>

<template lang="pug">
header.topbar
  .title-group
    p.eyebrow 企業流程中心
    h1.title {{ pageTitle }}
    p.subtitle {{ projectConfig.title || 'Flow Center' }} 以登入身份決定資料與模組可見性
  .topbar-actions
    .status.flow-glass
      .status-label 目前系統狀態
      .status-value {{ statusText }}
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

.topbar-actions
  display: grid
  grid-template-columns: auto auto
  gap: 12px
  align-items: start

.status
  min-width: 210px
  padding: 14px 16px
  border-radius: 18px
  display: grid
  gap: 6px

.status-label
  font-size: 12px
  color: rgba(90, 79, 116, 0.58)

.status-value
  font-size: 15px
  font-weight: 700
  color: #5f516f

@media (max-width: 960px)
  .topbar
    padding: 18px 18px 10px
    flex-direction: column

  .topbar-actions
    width: 100%
    grid-template-columns: 1fr

  .title
    font-size: 28px

  .status
    width: 100%
</style>
