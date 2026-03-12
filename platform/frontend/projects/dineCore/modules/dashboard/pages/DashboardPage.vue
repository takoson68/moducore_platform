<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'

const dashboardStore = world.store('dineCoreDashboardStore')
const state = computed(() => dashboardStore.state)
const staffAuth = useDineCoreStaffAuth()

const statusLabels = {
  pending: '待處理',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消',
  submitted: '已送出',
  draft: '草稿'
}

const paymentMethodLabels = {
  cash: '現金',
  counter_card: '櫃台刷卡',
  other: '其他',
  unpaid: '未付款'
}

function reloadDashboard() {
  if (!staffAuth.isAuthenticated.value) return
  dashboardStore.load()
}

onMounted(() => {
  reloadDashboard()
})

watch(
  () => staffAuth.isAuthenticated.value,
  isAuthenticated => {
    if (!isAuthenticated) return
    reloadDashboard()
  }
)
</script>

<template lang="pug">
.desk-page
  section.panel-card
    .panel-card__head
      div
        p.eyebrow 營運摘要
        h2 營運首頁儀表板
        p.lead
          | 集中查看今日已收款營收、訂單流量、批次狀態與熱銷品項，作為經理與副店長的第一個工作入口。
      button.panel-card__action(type="button" @click="reloadDashboard()" :disabled="state.loading")
        | {{ state.loading ? '更新中...' : '重新整理' }}

  section.warning-card(v-if="state.warnings.length > 0")
    p.warning-card__title 部分資料暫時不可用
    ul.warning-card__list
      li(v-for="warning in state.warnings" :key="warning") {{ warning }}

  section.error-card(v-if="state.error")
    p.error-card__text {{ state.error }}
    button.panel-card__action(type="button" @click="reloadDashboard()" :disabled="state.loading") 重新嘗試

  section.status-card(v-if="state.loading")
    p.status-card__line 儀表板資料載入中...

  section.stat-grid
    article.info-card
      span.info-label 今日營收
      strong.info-value {{ `NT$ ${state.dailyRevenueTotal}` }}
      small.info-subvalue {{ `營運日期 ${state.businessDate || '尚未取得'}` }}
    article.info-card
      span.info-label 今日訂單概況
      strong.info-value {{ `NT$ ${state.dailyOrderGrossTotal}` }}
      small.info-subvalue {{ `共 ${state.dailyOrderCount} 筆訂單` }}
    article.info-card
      span.info-label 現場待處理
      strong.info-value {{ `${state.batchSnapshot.activeBatchCount} 個批次` }}
      small.info-subvalue {{ `未付款金額 NT$ ${state.unpaidAmount} / 平均客單價 NT$ ${state.averageOrderValue}` }}

  section.breakdown-grid
    article.breakdown-card
      h3.breakdown-card__title 訂單狀態
      .breakdown-row
        span 待處理
        strong {{ state.orderStatusBreakdown.pending }}
      .breakdown-row
        span 製作中
        strong {{ state.orderStatusBreakdown.preparing }}
      .breakdown-row
        span 可取餐
        strong {{ state.orderStatusBreakdown.ready }}
      .breakdown-row
        span 已取餐
        strong {{ state.orderStatusBreakdown.picked_up }}
      .breakdown-row
        span 已取消
        strong {{ state.orderStatusBreakdown.cancelled }}

    article.breakdown-card
      h3.breakdown-card__title 付款方式
      .breakdown-row(v-for="(value, key) in state.paymentMethodBreakdown" :key="key")
        span {{ paymentMethodLabels[key] || key }}
        strong {{ value }}

    article.breakdown-card
      h3.breakdown-card__title 批次快照
      .breakdown-row
        span 待處理批次
        strong {{ state.batchSnapshot.submittedCount }}
      .breakdown-row
        span 製作中批次
        strong {{ state.batchSnapshot.preparingCount }}
      .breakdown-row
        span 可取餐批次
        strong {{ state.batchSnapshot.readyCount }}
      .breakdown-row
        span 草稿訂單
        strong {{ state.batchSnapshot.draftOrderCount }}

  section.dual-grid
    article.rank-card
      h3.rank-card__title 熱銷品項
      .rank-item(v-for="item in state.topSellingItems" :key="item.itemId || item.itemName")
        .rank-item__main
          strong {{ item.itemName }}
          span {{ `${item.quantity} 份` }}
        strong.rank-item__value {{ `NT$ ${item.grossSales}` }}
      p.empty-text(v-if="state.topSellingItems.length === 0") 目前沒有可顯示的熱銷品項資料。

    article.rank-card
      h3.rank-card__title 最新訂單
      .rank-item(v-for="order in state.recentOrders" :key="order.id")
        .rank-item__main
          strong {{ `${order.orderNo} / ${order.tableCode}` }}
          span {{ `批次 ${order.latestBatchNo || 0} / ${statusLabels[order.latestBatchStatus] || order.latestBatchStatus || '狀態未明'}` }}
        .rank-item__meta
          strong {{ `NT$ ${order.totalAmount}` }}
          span {{ order.createdAt }}
      p.empty-text(v-if="state.recentOrders.length === 0") 目前沒有可顯示的最新訂單資料。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .info-card, .rank-card, .breakdown-card, .status-card, .error-card, .warning-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.88)
  border: 1px solid rgba(140, 90, 31, 0.12)

.panel-card__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 16px

.panel-card__action
  border: 0
  border-radius: 999px
  padding: 12px 16px
  background: #17383f
  color: #fff
  font-weight: 700
  cursor: pointer

.panel-card__action:disabled
  opacity: 0.6
  cursor: not-allowed

.eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.panel-card h2
  margin: 0 0 10px

.lead, .status-card__line, .error-card__text
  margin: 0
  color: #6f5b43
  line-height: 1.7

.error-card
  display: grid
  gap: 12px
  color: #a4432c

.warning-card
  display: grid
  gap: 10px
  border-color: rgba(198, 143, 53, 0.24)
  background: rgba(255, 247, 227, 0.92)

.warning-card__title
  margin: 0
  color: #8c5a1f
  font-weight: 700

.warning-card__list
  margin: 0
  padding-left: 20px
  color: #6f5b43

.stat-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px

.info-card
  display: grid
  gap: 8px

.info-label
  color: #8c7b65
  font-size: 13px

.info-value
  color: #2f2416

.info-subvalue
  color: #7b8d90
  font-size: 12px

.breakdown-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px

.breakdown-card__title, .rank-card__title
  margin: 0 0 12px
  color: #243a3e

.breakdown-row
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 10px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.breakdown-row:last-child
  border-bottom: 0

.dual-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.rank-item
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 12px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.rank-item:last-child
  border-bottom: 0

.rank-item__main, .rank-item__meta
  display: grid
  gap: 4px

.rank-item__main span, .rank-item__meta span
  color: #7b8d90

.rank-item__value
  color: #287a76

.empty-text
  margin: 0
  color: #7b8d90

@media (max-width: 1100px)
  .stat-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .breakdown-grid, .dual-grid
    grid-template-columns: 1fr

@media (max-width: 640px)
  .panel-card__head
    display: grid
    grid-template-columns: 1fr

  .stat-grid
    grid-template-columns: 1fr
</style>
