<script setup>
import { computed, watchEffect } from 'vue'
import world from '@/world.js'

const dashboardStore = world.store('dineCoreDashboardStore')
const state = computed(() => dashboardStore.state)

watchEffect(() => {
  dashboardStore.load()
})
</script>

<template lang="pug">
.desk-page
  section.panel-card
    p.eyebrow 營運總覽
    h2 商家後台
    p.lead 這裡集中顯示今日訂單、付款狀態與商品供應管理，方便店家快速掌握現場營運。

  section.stat-grid
    article.info-card
      span.info-label 今日營收
      strong.info-value {{ `NT$ ${state.dailyRevenueTotal}` }}
    article.info-card
      span.info-label 今日訂單數
      strong.info-value {{ state.dailyOrderCount }}
    article.info-card
      span.info-label 熱門品項數
      strong.info-value {{ state.topSellingItems.length }}

  section.breakdown-grid
    article.breakdown-card
      h3.breakdown-card__title 訂單狀態分布
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
      h3.breakdown-card__title 付款狀態分布
      .breakdown-row
        span 未付款
        strong {{ state.paymentStatusBreakdown.unpaid }}
      .breakdown-row
        span 已付款
        strong {{ state.paymentStatusBreakdown.paid }}

  section.rank-card
    h3.rank-card__title 熱門品項
    .rank-item(v-for="item in state.topSellingItems" :key="item.name")
      .rank-item__main
        strong {{ item.name }}
        span {{ `${item.quantity} 份` }}
      strong.rank-item__value {{ `#${item.quantity}` }}
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .info-card, .rank-card, .breakdown-card
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

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

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

.breakdown-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
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

.rank-item
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 12px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.rank-item:last-child
  border-bottom: 0

.rank-item__main
  display: grid
  gap: 4px

.rank-item__main span
  color: #7b8d90

.rank-item__value
  color: #287a76

@media (max-width: 960px)
  .stat-grid
    grid-template-columns: 1fr

  .breakdown-grid
    grid-template-columns: 1fr
</style>
