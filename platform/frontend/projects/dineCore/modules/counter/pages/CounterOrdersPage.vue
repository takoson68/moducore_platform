<script setup>
import { computed, watch, onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import world from '@/world.js'

const counterStore = world.store('dineCoreCounterStore')
const state = computed(() => counterStore.state)

const statusLabels = {
  draft: '草稿',
  pending: '待處理',
  submitted: '已送出',
  preparing: '製作中',
  ready: '可出餐',
  picked_up: '已取餐',
  cancelled: '已取消',
  unpaid: '未付款',
  paid: '已付款'
}

const tableOptions = computed(() => {
  const codes = new Set()

  for (const table of state.value.tables || []) {
    const code = String(table?.code || '').trim()
    if (code) codes.add(code)
  }

  for (const order of state.value.orders || []) {
    const code = String(order?.tableCode || '').trim()
    if (code) codes.add(code)
  }

  const currentCode = String(state.value.filters.tableCode || '').trim()
  if (currentCode) codes.add(currentCode)

  return [''].concat(Array.from(codes).sort((a, b) => a.localeCompare(b)))
})

let pollTimer = null

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    counterStore.load()
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

watch(
  () => ({ ...state.value.filters }),
  () => {
    counterStore.load()
  },
  { immediate: true, deep: true }
)

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

async function markPreparing(orderId) {
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'preparing',
    note: '櫃台已更新為製作中'
  })
}

async function markReady(orderId) {
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'ready',
    note: '櫃台已更新為可出餐'
  })
}

async function markPaid(orderId) {
  await counterStore.setPaymentStatus({
    orderId,
    paymentStatus: 'paid'
  })
}

function isKitchenStatusLocked(orderStatus) {
  return String(orderStatus || '').trim() === 'picked_up'
}
</script>

<template lang="pug">
.desk-page
  section.panel-card
    p.eyebrow 櫃台總覽
    h2 訂單清單（依開單身分）
    p.lead 每筆訂單代表一位顧客的開單身份，同桌不同顧客會分開顯示，方便追加與收款管理。

  section.error-card(v-if="state.error")
    p {{ state.error }}

  section.filter-grid
    label.field-card
      span.info-label 桌號
      select.field-input(
        :value="state.filters.tableCode"
        @change="counterStore.setFilters({ tableCode: $event.target.value })"
      )
        option(value="") 全部桌號
        option(v-for="tableCode in tableOptions.filter(code => code !== '')" :key="tableCode" :value="tableCode") {{ tableCode }}
    label.field-card
      span.info-label 訂單編號
      input.field-input(
        type="text"
        :value="state.filters.orderNo"
        @input="counterStore.setFilters({ orderNo: $event.target.value })"
      )
    label.field-card
      span.info-label 訂單狀態
      select.field-input(
        :value="state.filters.orderStatus"
        @change="counterStore.setFilters({ orderStatus: $event.target.value })"
      )
        option(value="all") 全部
        option(value="pending") 待處理
        option(value="submitted") 已送出
        option(value="preparing") 製作中
        option(value="ready") 可出餐
        option(value="picked_up") 已取餐
        option(value="cancelled") 已取消
    label.field-card
      span.info-label 付款狀態
      select.field-input(
        :value="state.filters.paymentStatus"
        @change="counterStore.setFilters({ paymentStatus: $event.target.value })"
      )
        option(value="all") 全部
        option(value="unpaid") 未付款
        option(value="paid") 已付款

  section.order-grid(v-if="state.orders.length > 0")
    article.order-card(v-for="order in state.orders" :key="order.id")
      .order-card__head
        strong.order-card__title {{ order.orderNo }}
        span.order-card__badge(:class="`is-${order.orderStatus}`") {{ statusLabels[order.orderStatus] || order.orderStatus }}
      .order-card__meta
        span {{ `桌號 ${order.tableCode}` }}
        span {{ `開單 ${order.guestLabel || '未綁定'}` }}
      .order-card__meta
        span {{ `最新批次：第 ${order.latestBatchNo || 0} 批 / ${statusLabels[order.latestBatchStatus] || order.latestBatchStatus || '無資料'}` }}
        span {{ order.canAppend ? `可追加（草稿第 ${order.draftBatchNo || 0} 批）` : '不可追加' }}
      .order-card__meta
        span {{ `付款狀態：${statusLabels[order.paymentStatus] || order.paymentStatus}` }}
        strong {{ `NT$ ${order.totalAmount}` }}
      p.order-card__time {{ `建立 ${order.createdAt} / 更新 ${order.updatedAt || order.createdAt}` }}
      .order-card__actions
        button.quick-action(type="button" :disabled="order.orderStatus === 'preparing' || isKitchenStatusLocked(order.orderStatus)" @click="markPreparing(order.id)") 標記製作中
        button.quick-action(type="button" :disabled="order.orderStatus === 'ready' || isKitchenStatusLocked(order.orderStatus)" @click="markReady(order.id)") 標記可出餐
        button.quick-action(type="button" :disabled="order.paymentStatus === 'paid'" @click="markPaid(order.id)") 標記已付款
        RouterLink.detail-link(:to="`/staff/counter/orders/${order.id}`") 查看明細

  section.empty-card(v-else)
    p.empty-card__title 目前沒有符合條件的訂單
    p.empty-card__text 請調整篩選條件，或等待顧客送出訂單。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .field-card, .order-card, .error-card, .empty-card
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

.error-card
  color: #a4432c

.filter-grid
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 12px

.field-card
  display: grid
  gap: 8px

.info-label
  color: #8c7b65
  font-size: 13px

.field-input
  width: 100%
  border: 0
  border-radius: 14px
  padding: 12px 14px
  background: rgba(121, 214, 207, 0.12)
  color: #2f2416

.order-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px

.order-card
  display: grid
  gap: 10px

.order-card__head, .order-card__meta
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.order-card__title
  color: #21393d

.order-card__badge
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #4a7779
  font-size: 12px
  font-weight: 700

.order-card__badge.is-pending, .order-card__badge.is-submitted
  background: rgba(255, 196, 113, 0.18)
  color: #a55a11

.order-card__badge.is-preparing
  background: rgba(121, 214, 207, 0.16)
  color: #287a76

.order-card__badge.is-ready, .order-card__badge.is-picked_up
  background: rgba(45, 199, 98, 0.14)
  color: #18834a

.order-card__badge.is-cancelled
  background: rgba(201, 95, 71, 0.14)
  color: #a4432c

.order-card__meta
  color: #647a7d
  font-size: 14px

.order-card__time
  margin: 0
  color: #8da0a3
  font-size: 13px

.order-card__actions
  display: flex
  flex-wrap: wrap
  gap: 8px

.quick-action, .detail-link
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(121, 214, 207, 0.16)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer
  text-decoration: none

.quick-action:disabled
  opacity: 0.45
  cursor: default

.detail-link
  background: rgba(140, 90, 31, 0.1)
  color: #8c5a1f

.empty-card
  display: grid
  gap: 6px

.empty-card__title
  margin: 0
  color: #21393d
  font-size: 18px
  font-weight: 800

.empty-card__text
  margin: 0
  color: #6f7f82
  line-height: 1.6

@media (max-width: 960px)
  .filter-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .order-grid
    grid-template-columns: 1fr

@media (max-width: 640px)
  .filter-grid
    grid-template-columns: 1fr
</style>
