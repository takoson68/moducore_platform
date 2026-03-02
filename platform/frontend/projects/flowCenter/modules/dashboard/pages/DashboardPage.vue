<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const dashboardStore = world.store('flowCenterDashboardStore')
const state = dashboardStore.state

const summaryCards = computed(() => {
  const counts = state.summary?.counts || {}
  return [
    { title: '我的請假', value: counts.my_leave_requests ?? 0, note: '來自請假申請 API', tone: 'mint' },
    { title: '我的採購', value: counts.my_purchase_requests ?? 0, note: 'company-b 會固定為 0', tone: 'rose' },
    { title: '我的任務', value: counts.my_tasks ?? 0, note: '任務建立或指派都會計入', tone: 'violet' },
    { title: '待審數量', value: counts.pending_approvals ?? 0, note: '只有主管角色會看到數量', tone: 'mint' }
  ]
})

const recentAnnouncements = computed(() => state.summary?.recent?.announcements || [])
const recentTasks = computed(() => state.summary?.recent?.my_tasks || [])

function loadDashboard() {
  return dashboardStore.load()
}

onMounted(loadDashboard)
watch(() => auth.isLoggedIn.value, loadDashboard)
</script>

<template lang="pug">
.dashboard
  .hero.flow-glass
    .welcome-copy
      p.eyebrow Flow Center
      h2 後端摘要已接通
      p.summary 目前儀表板已改由 `/api/flowcenter/dashboard/summary` 提供 counts 與 recent，登入後會依角色與 company 顯示不同資料。
    .hero-badge
      span.badge-label 狀態
      strong.badge-value {{ auth.isLoggedIn.value ? 'LIVE' : 'LOCK' }}
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.empty-copy 請先使用右上角登入元件登入，才會載入儀表板摘要。
  template(v-else)
    .panel.flow-glass(v-if="state.error")
      .panel-head
        h3 載入失敗
        span.panel-meta dashboard
      p.empty-copy {{ state.error }}
    template(v-else)
      .summary-grid
        article.summary-card.flow-glass(
          v-for="card in summaryCards"
          :key="card.title"
          :class="`tone-${card.tone}`"
        )
          p.card-label {{ card.title }}
          p.card-value {{ state.loading ? '...' : card.value }}
          p.card-note {{ card.note }}
      .content-grid
        article.panel.flow-glass
          .panel-head
            h3 最新公告
            span.panel-meta announcements
          p.empty-copy(v-if="!recentAnnouncements.length") 目前尚無公告資料。
          ul.task-list(v-else)
            li.task-row(v-for="item in recentAnnouncements" :key="item.id")
              span.task-dot
              span {{ item.title }} ｜ {{ item.time }}
        article.panel.flow-glass
          .panel-head
            h3 我的任務
            span.panel-meta tasks
          p.empty-copy(v-if="!recentTasks.length") 目前尚無任務資料。
          .governance-list(v-else)
            .governance-row(v-for="item in recentTasks" :key="item.id")
              span {{ item.title }}
              strong {{ item.status }}
</template>

<style lang="sass">
.dashboard
  display: grid
  gap: 20px

.hero
  border-radius: 30px
  padding: 30px
  display: flex
  align-items: flex-start
  justify-content: space-between
  gap: 20px

.eyebrow
  margin: 0 0 6px
  font-size: 12px
  letter-spacing: 0.08em
  text-transform: uppercase
  color: rgba(90, 79, 116, 0.58)

.welcome-copy h2
  margin: 0 0 10px
  font-size: 36px
  line-height: 1.15

.summary
  margin: 0
  max-width: 64ch
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.7

.hero-badge
  min-width: 108px
  padding: 16px 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 233, 239, 0.98))
  display: grid
  gap: 6px

.badge-label
  font-size: 11px
  text-transform: uppercase
  letter-spacing: 0.08em
  color: rgba(90, 79, 116, 0.58)

.badge-value
  font-size: 30px
  line-height: 1
  color: #241b31

.summary-grid
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 20px

.summary-card
  border-radius: 26px
  padding: 22px
  display: grid
  gap: 12px

.card-label
  margin: 0
  font-size: 14px
  color: rgba(90, 79, 116, 0.68)

.card-value
  margin: 0
  font-size: 34px
  font-weight: 800

.card-note
  margin: 0
  color: rgba(63, 54, 79, 0.66)
  line-height: 1.6

.tone-mint
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(228, 247, 239, 0.98))

.tone-rose
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(255, 234, 238, 0.98))

.tone-violet
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.76), rgba(240, 233, 255, 0.98))

.content-grid
  display: grid
  grid-template-columns: 1.2fr 1fr
  gap: 20px

.panel
  border-radius: 26px
  padding: 22px

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 16px

.panel-head h3
  margin: 0

.panel-meta
  font-size: 12px
  color: rgba(90, 79, 116, 0.58)

.task-list
  margin: 0
  padding: 0
  list-style: none
  display: grid
  gap: 12px

.task-row
  display: flex
  align-items: flex-start
  gap: 12px
  min-height: 56px
  padding: 12px 14px
  border-radius: 16px
  background: rgba(255, 255, 255, 0.62)
  color: rgba(49, 41, 63, 0.76)

.task-dot
  width: 10px
  height: 10px
  margin-top: 7px
  border-radius: 999px
  background: linear-gradient(135deg, #ff8c82 0%, #f078b1 100%)

.governance-list
  display: grid
  gap: 12px

.governance-row
  padding: 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.62)
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px

.empty-copy
  margin: 0
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.6

@media (max-width: 960px)
  .hero
    flex-direction: column

  .summary-grid, .content-grid
    grid-template-columns: 1fr
</style>
