<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const route = useRoute()
const auth = useFlowCenterAuth()
const projectConfig = computed(() => world.projectConfig() || {})

const moduleMetaMap = {
  dashboard: { label: '儀表板', path: '/' },
  leave: { label: '請假', path: '/leave' },
  purchase: { label: '採購', path: '/purchase' },
  announcement: { label: '公告', path: '/announcement' },
  task: { label: '任務', path: '/task' },
  approval: { label: '審核', path: '/approval' }
}

const navItems = computed(() =>
  (projectConfig.value.modules || [])
    .filter((name) => {
      if (!auth.isLoggedIn.value) {
        return name === 'dashboard' || name === 'announcement'
      }

      if (name === 'approval') {
        return auth.role.value === 'manager'
      }

      if (name === 'purchase') {
        return auth.role.value === 'employee' && auth.companyId.value !== 'company-b'
      }

      if (name === 'leave') {
        return auth.role.value === 'employee'
      }

      return true
    })
    .map((name) => moduleMetaMap[name])
    .filter(Boolean)
)

function isActive(path) {
  if (path === '/') return route.path === '/'
  return route.path.startsWith(path)
}
</script>

<template lang="pug">
aside.sidebar
  .brand
    .brand-mark FC
    .brand-copy
      h2.brand-title Flow Center
      p.brand-sub 企業內部流程整合平台
  nav.nav
    RouterLink.nav-item(
      v-for="item in navItems"
      :key="item.path"
      :to="item.path"
      :class="{ 'is-active': isActive(item.path) }"
    ) {{ item.label }}
  .sidebar-footer
    p.footer-label 權限檢查
    p.footer-copy {{ auth.isLoggedIn.value ? `${auth.role.value} / ${auth.companyId.value}` : '登入後顯示完整導覽' }}
</template>

<style lang="sass">
.sidebar
  padding: 22px 16px 18px
  border-right: 1px solid rgba(67, 58, 84, 0.08)
  background: rgba(255, 255, 255, 0.58)
  display: grid
  grid-template-rows: auto 1fr auto
  gap: 20px

.brand
  display: flex
  align-items: center
  gap: 12px
  padding: 8px 8px 0

.brand-mark
  width: 42px
  height: 42px
  border-radius: 14px
  display: grid
  place-items: center
  background: linear-gradient(135deg, #ff9f80 0%, #ff7ea7 100%)
  color: #fff
  font-weight: 800

.brand-title
  margin: 0
  font-size: 18px

.brand-sub
  margin: 2px 0 0
  font-size: 12px
  color: rgba(63, 54, 79, 0.58)

.nav
  display: grid
  gap: 8px
  align-content: start

.nav-item
  text-decoration: none
  padding: 12px 14px
  border-radius: 14px
  color: rgba(49, 41, 63, 0.78)
  font-weight: 600
  transition: background 140ms ease, color 140ms ease, transform 140ms ease

.nav-item:hover
  background: rgba(255, 255, 255, 0.72)
  color: #241b31
  transform: translateX(2px)

.nav-item.is-active
  background: rgba(255, 255, 255, 0.9)
  color: #241b31
  box-shadow: inset 0 0 0 1px rgba(109, 96, 135, 0.1)

.sidebar-footer
  padding: 14px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.72)

.footer-label
  margin: 0 0 4px
  font-size: 12px
  color: rgba(90, 79, 116, 0.58)

.footer-copy
  margin: 0
  font-size: 13px
  color: #5f516f

@media (max-width: 960px)
  .sidebar
    border-right: 0
    border-bottom: 1px solid rgba(67, 58, 84, 0.08)
    grid-template-rows: auto auto auto
</style>
