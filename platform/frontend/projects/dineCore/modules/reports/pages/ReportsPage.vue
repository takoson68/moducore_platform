<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'
import {
  buildReportsCsv,
  reportPaymentMethodLabels,
  reportPaymentStatusLabels,
  reportStatusLabels
} from '../service.js'

const reportsStore = world.store('dineCoreReportsStore')
const state = computed(() => reportsStore.state)
const staffAuth = useDineCoreStaffAuth()

function loadReports() {
  if (!staffAuth.isAuthenticated.value) return
  reportsStore.load()
}

onMounted(() => {
  loadReports()
})

watch(
  () => ({ ...state.value.filters }),
  () => {
    loadReports()
  },
  { immediate: false, deep: true }
)

watch(
  () => staffAuth.isAuthenticated.value,
  isAuthenticated => {
    if (!isAuthenticated) return
    loadReports()
  }
)

function downloadCsv() {
  const csv = buildReportsCsv({
    orderRows: state.value.orderRows,
    summary: state.value.summary,
    filters: state.value.filters
  })
  const blob = new Blob([`\uFEFF${csv}`], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')

  link.href = url
  link.download = `dinecore-reports-${state.value.summary.businessDate || 'export'}.csv`
  link.click()

  URL.revokeObjectURL(url)
}
</script>

<template lang="pug">
.desk-page
  section.panel-card
    .panel-card__head
      .panel-card__copy
        p.eyebrow 營運報表
        h2 營運報表
        p.lead 集中查看指定日期區間的訂單、付款與熱門品項表現，並支援匯出 CSV 做進一步整理。
      button.ghost-button(type="button" :disabled="state.orderRows.length === 0" @click="downloadCsv()") 匯出 CSV

  section.filter-card
    .filter-card__head
      .filter-card__copy
        span.info-label 篩選條件
        h3.filter-card__title 日期與報表條件

    .filter-grid
      .field-card.field-card--date-range
        span.info-label 日期區間
        .date-range-inline
          label.field-card__segment
            span.field-card__segment-label 起始日期
            input.field-input(
              type="date"
              :value="state.filters.dateFrom"
              @input="reportsStore.setFilters({ dateFrom: $event.target.value })"
            )
          label.field-card__segment
            span.field-card__segment-label 結束日期
            input.field-input(
              type="date"
              :value="state.filters.dateTo"
              @input="reportsStore.setFilters({ dateTo: $event.target.value })"
            )
      label.field-card
        span.info-label 訂單狀態
        select.field-input(
          :value="state.filters.status"
          @change="reportsStore.setFilters({ status: $event.target.value })"
        )
          option(value="all") 全部
          option(value="pending") 待處理
          option(value="preparing") 製作中
          option(value="ready") 可取餐
          option(value="picked_up") 已取餐
          option(value="cancelled") 已取消
      label.field-card
        span.info-label 付款狀態
        select.field-input(
          :value="state.filters.paymentStatus"
          @change="reportsStore.setFilters({ paymentStatus: $event.target.value })"
        )
          option(value="all") 全部
          option(value="unpaid") 未付款
          option(value="paid") 已付款
      label.field-card
        span.info-label 付款方式
        select.field-input(
          :value="state.filters.paymentMethod"
          @change="reportsStore.setFilters({ paymentMethod: $event.target.value })"
        )
          option(value="all") 全部
          option(value="cash") 現金
          option(value="counter_card") 櫃台刷卡
          option(value="other") 其他
      label.field-card.field-card--wide
        span.info-label 關鍵字
        input.field-input(
          type="text"
          :value="state.filters.keyword"
          placeholder="可搜尋桌號、訂單編號或備註"
          @input="reportsStore.setFilters({ keyword: $event.target.value })"
        )
      .filter-inline-actions
        button.ghost-button(type="button" @click="reportsStore.resetFilters()") 重設篩選
        span.filter-hint(v-if="state.lastLoadedAt") {{ `最後更新 ${state.lastLoadedAt}` }}

  section.loading-card(v-if="state.loading")
    p 報表資料載入中...

  section.error-card(v-else-if="state.error")
    p {{ `報表資料載入失敗：${state.error}` }}

  template(v-else)
    section.stat-grid
      article.info-card
        span.info-label 營運日期
        strong.info-value {{ state.summary.businessDate || '尚無資料' }}
      article.info-card
        span.info-label 今日營收
        strong.info-value {{ `NT$ ${state.summary.paidAmount}` }}
      article.info-card
        span.info-label 訂單總額
        strong.info-value {{ `NT$ ${state.summary.grossSales}` }}
      article.info-card
        span.info-label 訂單數
        strong.info-value {{ state.summary.orderCount }}
      article.info-card
        span.info-label 未付款金額
        strong.info-value {{ `NT$ ${state.summary.unpaidAmount}` }}
      article.info-card
        span.info-label 平均客單價
        strong.info-value {{ `NT$ ${state.summary.averageOrderValue}` }}

    section.breakdown-grid
      article.breakdown-card
        h3.breakdown-card__title 訂單狀態分布
        .breakdown-row(v-for="(label, key) in reportStatusLabels" :key="key")
          span {{ label }}
          strong {{ state.statusBreakdown[key] || 0 }}
      article.breakdown-card
        h3.breakdown-card__title 付款方式分布
        .breakdown-row(v-for="(label, key) in reportPaymentMethodLabels" :key="key")
          span {{ label }}
          strong {{ state.paymentBreakdown[key] || 0 }}

    section.rank-card(v-if="state.topItems.length > 0")
      h3.rank-card__title 熱門品項
      .rank-item(v-for="item in state.topItems" :key="item.itemId || item.itemName")
        .rank-item__main
          strong {{ item.itemName }}
          span {{ `${item.quantity} 份` }}
        strong.rank-item__value {{ `NT$ ${item.grossSales}` }}
    section.empty-card(v-else)
      p 目前沒有可顯示的熱門品項資料。

    section.table-card(v-if="state.orderRows.length > 0")
      .table-card__head
        h3.table-card__title 訂單明細
        span.table-card__meta {{ `${state.orderRows.length} 筆` }}
      .report-table
        .report-table__head
          span 訂單編號
          span 桌號
          span 訂單狀態
          span 付款資訊
          span 建立時間
          span 訂單金額
        .report-table__row(v-for="order in state.orderRows" :key="order.orderId")
          strong {{ order.orderNo }}
          span {{ order.tableCode }}
          span {{ reportStatusLabels[order.status] || order.status }}
          span {{ `${reportPaymentStatusLabels[order.paymentStatus] || order.paymentStatus} / ${reportPaymentMethodLabels[order.paymentMethod] || order.paymentMethod}` }}
          span {{ order.createdAt }}
          strong {{ `NT$ ${order.totalAmount}` }}
    section.empty-card(v-else)
      p 目前沒有符合條件的訂單資料。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .filter-card, .field-card, .info-card, .breakdown-card, .rank-card, .table-card, .loading-card, .error-card, .empty-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.9)
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

.panel-card__head, .filter-card__head
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 12px

.panel-card__copy, .filter-card__copy
  display: grid
  gap: 4px

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

.filter-card
  display: grid
  gap: 18px

.filter-card__title
  margin: 0
  color: #243a3e

.filter-grid
  display: grid
  grid-template-columns: repeat(5, minmax(0, 1fr))
  gap: 12px

.field-card
  display: grid
  gap: 8px

.field-card--date-range
  min-width: 0
  grid-column: span 2

.date-range-inline
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px

.field-card__segment
  display: grid
  gap: 6px
  min-width: 0

.field-card__segment-label
  color: #8c7b65
  font-size: 12px

.field-card--wide
  grid-column: span 2

.info-label
  color: #8c7b65
  font-size: 13px

.field-input
  width: 100%
  border: 0
  border-radius: 14px
  padding: 9px 4px
  background: rgba(121, 214, 207, 0.12)
  color: #2f2416

.filter-actions
  display: flex
  align-items: center
  justify-content: flex-end
  gap: 12px

.filter-inline-actions
  display: flex
  align-items: center
  justify-content: flex-start
  gap: 12px
  flex-wrap: nowrap
  white-space: nowrap

.ghost-button
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(140, 90, 31, 0.1)
  color: #8c5a1f
  font-weight: 700
  cursor: pointer

.ghost-button:disabled
  opacity: 0.45
  cursor: default

.filter-hint
  color: #7b8d90
  font-size: 12px

.stat-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px

.info-card
  display: grid
  gap: 8px

.info-value
  color: #2f2416

.breakdown-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.breakdown-card__title, .rank-card__title, .table-card__title
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

.table-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  margin-bottom: 12px

.table-card__meta
  color: #7b8d90

.report-table
  display: grid
  gap: 8px

.report-table__head, .report-table__row
  display: grid
  grid-template-columns: 1.2fr 0.7fr 0.9fr 1.2fr 1fr 0.8fr
  gap: 12px
  align-items: center

.report-table__head
  color: #7b8d90
  font-size: 12px
  font-weight: 700
  text-transform: uppercase

.report-table__row
  padding: 12px 0
  border-top: 1px solid rgba(91, 127, 130, 0.12)
  color: #31484c

.loading-card, .error-card, .empty-card
  color: #6f5b43

@media (max-width: 1100px)
  .filter-grid
    grid-template-columns: repeat(3, minmax(0, 1fr))

  .field-card--wide
    grid-column: span 2

  .stat-grid, .breakdown-grid
    grid-template-columns: 1fr

  .report-table__head, .report-table__row
    grid-template-columns: repeat(2, minmax(0, 1fr))

@media (max-width: 640px)
  .filter-grid
    grid-template-columns: 1fr

  .date-range-inline
    grid-template-columns: 1fr

  .field-card--date-range
    grid-column: span 1

  .field-card--wide
    grid-column: span 1

  .panel-card__head, .filter-card__head, .filter-actions, .filter-inline-actions
    display: grid
</style>
