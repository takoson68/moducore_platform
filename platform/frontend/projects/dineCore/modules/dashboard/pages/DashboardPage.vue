<script setup>
import { computed, watchEffect } from 'vue'
import world from '@/world.js'

const dashboardStore = world.store('dineCoreDashboardStore')
const state = computed(() => dashboardStore.state)

const statusLabels = {
  pending: '待處理',
  preparing: '備餐中',
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

watchEffect(() => {
  dashboardStore.load()
})
</script>

<template lang="pug">
.desk-page
  section.panel-card
    p.eyebrow 營運總覽
    h2 營運儀表板
    p.lead 主管視角整合今日營收、主單狀態與目前仍在流動中的送單批次，方便快速掌握現場負載。

  section.error-card(v-if="state.error")
    p {{ state.error }}

  section.status-card(v-if="state.loading")
    p.status-card__line 正在同步最新資料...
  section.status-card(v-else)
    p.status-card__line {{ `營業日：${state.businessDate || '未提供'}` }}
    p.status-card__line {{ `平均客單價：NT$ ${state.averageOrderValue}` }}

  section.stat-grid
    article.info-card
      span.info-label 今日營收
      strong.info-value {{ `NT$ ${state.dailyRevenueTotal}` }}
    article.info-card
      span.info-label 今日主單數
      strong.info-value {{ state.dailyOrderCount }}
    article.info-card
      span.info-label 現場批次數
      strong.info-value {{ state.batchSnapshot.activeBatchCount }}
    article.info-card
      span.info-label 未付款主單
      strong.info-value {{ state.batchSnapshot.unpaidOrderCount }}

  section.breakdown-grid
    article.breakdown-card
      h3.breakdown-card__title 主單狀態
      .breakdown-row
        span 待處理
        strong {{ state.orderStatusBreakdown.pending }}
      .breakdown-row
        span 備餐中
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
      h3.breakdown-card__title 付款方式 / 狀態
      .breakdown-row(v-for="(value, key) in state.paymentMethodBreakdown" :key="key")
        span {{ paymentMethodLabels[key] || key }}
        strong {{ value }}

    article.breakdown-card
      h3.breakdown-card__title 批次流量
      .breakdown-row
        span 待出單批次
        strong {{ state.batchSnapshot.submittedCount }}
      .breakdown-row
        span 備餐中批次
        strong {{ state.batchSnapshot.preparingCount }}
      .breakdown-row
        span 可取餐批次
        strong {{ state.batchSnapshot.readyCount }}
      .breakdown-row
        span 草稿主單
        strong {{ state.batchSnapshot.draftOrderCount }}

  section.dual-grid
    article.rank-card
      h3.rank-card__title 熱門品項
      .rank-item(v-for="item in state.topSellingItems" :key="item.itemId || item.itemName")
        .rank-item__main
          strong {{ item.itemName }}
          span {{ `${item.quantity} 份` }}
        strong.rank-item__value {{ `NT$ ${item.grossSales}` }}
      p.empty-text(v-if="state.topSellingItems.length === 0") 目前尚無可顯示的熱門品項。

    article.rank-card
      h3.rank-card__title 最新主單
      .rank-item(v-for="order in state.recentOrders" :key="order.id")
        .rank-item__main
          strong {{ `${order.orderNo} / ${order.tableCode}` }}
          span {{ `第 ${order.latestBatchNo || 0} 批 / ${statusLabels[order.latestBatchStatus] || order.latestBatchStatus || '未建立'}` }}
        .rank-item__meta
          strong {{ `NT$ ${order.totalAmount}` }}
          span {{ order.createdAt }}
      p.empty-text(v-if="state.recentOrders.length === 0") 目前尚無主單資料。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .info-card, .rank-card, .breakdown-card, .status-card, .error-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.88)
  border: 1px solid rgba(140, 90, 31, 0.12)

.eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.panel-card h2
  margin: 0 0 10px

.lead, .status-card__line
  margin: 0
  color: #6f5b43
  line-height: 1.7

.error-card
  color: #a4432c

.stat-grid
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 12px

.info-card
  display: grid
  gap: 8px

.info-label
  color: #8c7b65
  font-size: 13px

.info-value
  color: #2f2416

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
  .stat-grid
    grid-template-columns: 1fr
</style>
