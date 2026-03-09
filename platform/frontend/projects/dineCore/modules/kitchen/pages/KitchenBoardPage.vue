<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import world from '@/world.js'

const kitchenStore = world.store('dineCoreKitchenStore')
const state = computed(() => kitchenStore.state)

const statusLabels = {
  pending: '待送出',
  submitted: '已送出',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}

let pollTimer = null
let waitTickTimer = null
const waitNow = ref(Date.now())

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    kitchenStore.load()
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

function startWaitTicker() {
  stopWaitTicker()
  waitTickTimer = window.setInterval(() => {
    waitNow.value = Date.now()
  }, 60000)
}

function stopWaitTicker() {
  if (waitTickTimer) {
    window.clearInterval(waitTickTimer)
    waitTickTimer = null
  }
}

function parseDateTime(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const direct = new Date(raw)
  if (!Number.isNaN(direct.getTime())) return direct

  const normalized = new Date(raw.replace(' ', 'T'))
  return Number.isNaN(normalized.getTime()) ? null : normalized
}

function formatWaitLabel(order) {
  const waitMinutes = Number(order?.waitMinutes)
  if (Number.isFinite(waitMinutes)) {
    return `已等待 ${Math.max(0, Math.floor(waitMinutes))} 分鐘`
  }

  const createdAt = parseDateTime(order?.createdAt)
  if (!createdAt) return String(order?.waitLabel || '已等待 0 分鐘')

  const elapsedMinutes = Math.max(0, Math.floor((waitNow.value - createdAt.getTime()) / 60000))
  return `已等待 ${elapsedMinutes} 分鐘`
}

onMounted(() => {
  kitchenStore.load()
  startPolling()
  startWaitTicker()
})

onUnmounted(() => {
  stopPolling()
  stopWaitTicker()
})

async function updateOrderStatus(batchId, orderStatus) {
  await kitchenStore.setOrderStatus({ orderId: batchId, orderStatus })
}
</script>

<template lang="pug">
.desk-page
  section.panel-card
    p.eyebrow 廚房作業
    h2 廚房看板
    p.lead 即時查看已送出的批次，確認桌號、批次內容與目前製作狀態。

  section.error-card(v-if="state.error")
    p {{ state.error }}

  section.info-grid
    article.info-card
      span.info-label 看板狀態
      strong.info-value {{ state.boardStatus }}
    article.info-card
      span.info-label 顯示狀態
      strong.info-value {{ state.visibleStatuses.map(status => statusLabels[status] || status).join(' / ') }}

  section.board-grid(v-if="state.orders.length > 0")
    article.board-card(v-for="order in state.orders" :key="order.id")
      .board-card__head
        strong.board-card__title {{ `${order.orderNo} / 第 ${order.batchNo} 批` }}
        span.board-card__wait {{ formatWaitLabel(order) }}
      p.board-card__meta {{ `桌號 ${order.tableCode} | ${statusLabels[order.orderStatus] || order.orderStatus}` }}

      .board-card__items
        .board-item(v-for="item in order.items" :key="item.id")
          .board-item__top
            strong.board-item__title {{ item.title }}
            span.board-item__qty {{ `x${item.quantity}` }}
          p.board-item__note(v-if="item.note") {{ item.note }}
          .board-item__options(v-if="item.options?.length")
            span.board-item__option(v-for="option in item.options" :key="option") {{ option }}

      .board-card__actions
        button.board-action(type="button" :disabled="order.orderStatus === 'preparing'" @click="updateOrderStatus(order.id, 'preparing')") 標記製作中
        button.board-action(type="button" :disabled="order.orderStatus === 'ready'" @click="updateOrderStatus(order.id, 'ready')") 標記可取餐
        button.board-action(type="button" :disabled="order.orderStatus === 'picked_up'" @click="updateOrderStatus(order.id, 'picked_up')") 標記已取餐

  section.empty-card(v-else)
    p.empty-card__title 目前沒有待處理批次
    p.empty-card__text 新送出的批次會在 5 秒內自動出現在這裡。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .info-card, .board-card, .error-card, .empty-card
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

.info-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.info-card
  display: grid
  gap: 8px

.info-label
  color: #8c7b65
  font-size: 13px

.info-value
  color: #2f2416

.board-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px

.board-card
  display: grid
  gap: 12px

.board-card__head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.board-card__title
  color: #243a3e

.board-card__wait
  padding: 6px 10px
  border-radius: 999px
  background: rgba(255, 196, 113, 0.18)
  color: #a55a11
  font-size: 12px
  font-weight: 700

.board-card__meta
  margin: 0
  color: #7b8d90

.board-card__items
  display: grid
  gap: 10px

.board-item
  padding: 14px
  border-radius: 16px
  background: rgba(121, 214, 207, 0.1)
  display: grid
  gap: 8px

.board-item__top
  display: flex
  justify-content: space-between
  align-items: start
  gap: 12px

.board-item__title
  color: #243a3e

.board-item__qty
  color: #2d6f6d
  font-size: 13px
  font-weight: 700

.board-item__note
  margin: 0
  padding: 10px 12px
  border-radius: 12px
  background: rgba(255, 214, 102, 0.22)
  color: #7b5316
  line-height: 1.6
  font-weight: 700

.board-item__options
  display: flex
  flex-wrap: wrap
  gap: 8px

.board-item__option
  padding: 5px 9px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.82)
  color: #2d6f6d
  font-size: 12px
  font-weight: 700

.board-card__actions
  display: flex
  flex-wrap: wrap
  gap: 8px

.board-action
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(121, 214, 207, 0.16)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.board-action:disabled
  opacity: 0.45
  cursor: default

.empty-card
  display: grid
  gap: 6px

.empty-card__title
  margin: 0
  color: #243a3e
  font-size: 18px
  font-weight: 800

.empty-card__text
  margin: 0
  color: #6f7f82
  line-height: 1.6

@media (max-width: 960px)
  .board-grid
    grid-template-columns: 1fr

@media (max-width: 640px)
  .info-grid
    grid-template-columns: 1fr
</style>
