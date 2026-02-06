<!-- projects/project-a/modules/approval-center/pages/ApprovalCenterPage.vue -->
<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'Approval Center'
const subtitle = 'Decision and approval module'

const approvalStats = [
  { label: '待決策', value: 4 },
  { label: '本週通過', value: 9 },
  { label: '退回修正', value: 2 }
]

const decisionItems = [
  { id: 'APR-1021', subject: '內容分類調整', level: 'L2', status: '待簽核' },
  { id: 'APR-1022', subject: '審批節點重排', level: 'L1', status: '審核中' },
  { id: 'APR-1023', subject: '治理標籤補齊', level: 'L3', status: '已核准' }
]
</script>

<template lang="pug">
LayoutRoot(:title="title" :subtitle="subtitle")
  section.pa-approval
    .pa-approval__header
      p.pa-approval__lead 決策流程看板
      p.pa-approval__desc 聚焦審批節點、責任層級與決策狀態。
    .pa-approval__stats
      article.pa-approval__stat(v-for="item in approvalStats" :key="item.label")
        p.pa-approval__stat-label {{ item.label }}
        p.pa-approval__stat-value {{ item.value }}
    .pa-approval__table
      .pa-approval__row.pa-approval__row--head
        span 編號
        span 主題
        span 層級
        span 狀態
      .pa-approval__row(v-for="item in decisionItems" :key="item.id")
        span {{ item.id }}
        span {{ item.subject }}
        span {{ item.level }}
        span.pa-approval__status(:class="`pa-approval__status--${item.status}`") {{ item.status }}
</template>

<style lang="sass" scoped>
.pa-approval
  --pa-approval-bg: #f7f9ff
  --pa-approval-surface: #ffffff
  --pa-approval-surface-soft: #f2f5ff
  --pa-approval-border: #e0e8ff
  --pa-approval-border-soft: #e7edff
  --pa-approval-text-main: #202f52
  --pa-approval-text-sub: #60729d
  --pa-approval-text-muted: #8a99ba
  --pa-approval-accent: #5f72ff
  display: grid
  gap: 16px
  padding: 18px
  border: 1px solid var(--pa-approval-border)
  border-radius: 14px
  background: var(--pa-approval-bg)

.pa-approval__header
  display: grid
  gap: 6px
  padding-bottom: 10px
  border-bottom: 1px solid var(--pa-approval-border)

.pa-approval__lead
  margin: 0
  font-size: 11px
  text-transform: uppercase
  letter-spacing: 0.08em
  color: var(--pa-approval-accent)
  font-weight: 700

.pa-approval__desc
  margin: 0
  font-size: 14px
  line-height: 1.6
  color: var(--pa-approval-text-sub)

.pa-approval__stats
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))
  gap: 12px

.pa-approval__stat
  border: 1px solid var(--pa-approval-border)
  border-radius: 12px
  background: var(--pa-approval-surface)
  padding: 12px 14px
  transition: border-color 120ms ease, background-color 120ms ease

.pa-approval__stat:hover
  border-color: #c7d6ff
  background: var(--pa-approval-surface-soft)

.pa-approval__stat-label
  margin: 0
  font-size: 11px
  color: var(--pa-approval-text-muted)

.pa-approval__stat-value
  margin: 8px 0 0
  font-size: 26px
  font-weight: 700
  line-height: 1
  color: var(--pa-approval-text-main)

.pa-approval__table
  border: 1px solid var(--pa-approval-border)
  border-radius: 12px
  overflow: hidden
  background: var(--pa-approval-surface)

.pa-approval__row
  display: grid
  grid-template-columns: 1.1fr 2fr 0.8fr 1fr
  gap: 10px
  align-items: center
  padding: 11px 12px
  font-size: 13px
  color: var(--pa-approval-text-main)
  border-top: 1px solid var(--pa-approval-border-soft)
  transition: background-color 120ms ease

.pa-approval__row:first-child
  border-top: 0

.pa-approval__row:not(.pa-approval__row--head):hover
  background: #f5f8ff

.pa-approval__row--head
  font-weight: 700
  background: #f2f6ff
  color: var(--pa-approval-text-muted)

.pa-approval__status
  justify-self: end
  display: inline-flex
  align-items: center
  justify-content: center
  min-width: 64px
  padding: 4px 8px
  border-radius: 999px
  border: 1px solid #d0dcff
  background: #f2f6ff
  font-size: 11px
  color: var(--pa-approval-text-sub)

.pa-approval__status--待簽核
  border-color: #c9d6ff
  background: #edf1ff
  color: #5266ff

.pa-approval__status--審核中
  border-color: #ddd7ff
  background: #f5f2ff
  color: #7364c5

.pa-approval__status--已核准
  border-color: #cbe6da
  background: #effaf5
  color: #2d8a6e
</style>
