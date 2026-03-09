<script setup>
import { computed, ref, watchEffect, onMounted, onUnmounted } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const counterStore = world.store('dineCoreCounterStore')
const state = computed(() => counterStore.state)
const detail = computed(() => counterStore.state.detail)
const mergeCandidates = computed(() => counterStore.state.mergeCandidates || [])
const cancelReason = ref('')
const mergeOrderId = ref('')
const mergeReason = ref('')

const statusLabels = {
  draft: '草稿',
  pending: '待處理',
  submitted: '已送出',
  preparing: '製作中',
  ready: '可出餐',
  picked_up: '已取餐',
  cancelled: '已取消',
  merged: '已併單',
  unpaid: '未付款',
  paid: '已付款'
}

let pollTimer = null

function currentOrderId() {
  return String(route.params.orderId || '')
}

function startPolling() {
  stopPolling()
  pollTimer = window.setInterval(() => {
    const orderId = currentOrderId()
    if (!orderId) return
    counterStore.loadDetail(orderId)
  }, 5000)
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

watchEffect(() => {
  const orderId = currentOrderId()
  if (!orderId) return
  counterStore.loadDetail(orderId)
})

onMounted(() => {
  startPolling()
})

onUnmounted(() => {
  stopPolling()
})

async function updateOrderStatus(event) {
  const orderId = currentOrderId()
  if (!orderId) return
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: event.target.value
  })
}

async function updatePaymentStatus(event) {
  const orderId = currentOrderId()
  if (!orderId) return
  await counterStore.setPaymentStatus({
    orderId,
    paymentStatus: event.target.value
  })
}

async function markPickedUp() {
  const orderId = currentOrderId()
  if (!orderId) return
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'picked_up',
    note: '櫃台已更新為已取餐'
  })
}

async function cancelOrder() {
  const orderId = currentOrderId()
  if (!orderId) return
  const reason = cancelReason.value.trim() || '櫃台取消訂單'
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'cancelled',
    note: `取消訂單：${reason}`
  })
}

async function mergeOrder() {
  const orderId = currentOrderId()
  if (!orderId || !mergeOrderId.value) return

  await counterStore.mergeOrders({
    targetOrderId: orderId,
    mergedOrderId: mergeOrderId.value,
    reason: mergeReason.value
  })
  mergeReason.value = ''
  mergeOrderId.value = ''
}
</script>

<template lang="pug">
.desk-page(v-if="detail")
  section.detail-list-card(v-if="state.error")
    p.error-text {{ state.error }}

  section.scope-card
    p.eyebrow 櫃台明細
    h2 訂單明細
    p.lead {{ detail.order.orderNo }}
    .detail-grid
      article.detail-card
        span.detail-label 桌號
        strong.detail-value {{ detail.order.tableCode }}
      article.detail-card
        span.detail-label 訂單狀態
        strong.detail-value {{ statusLabels[detail.order.orderStatus] || detail.order.orderStatus }}
      article.detail-card
        span.detail-label 付款狀態
        strong.detail-value {{ statusLabels[detail.order.paymentStatus] || detail.order.paymentStatus }}
      article.detail-card
        span.detail-label 訂單總額
        strong.detail-value {{ `NT$ ${detail.order.totalAmount}` }}
    .detail-actions
      label.action-field
        span.action-label 更新訂單狀態
        select.action-input(:value="detail.order.orderStatus" @change="updateOrderStatus")
          option(value="pending") 待處理
          option(value="submitted") 已送出
          option(value="preparing") 製作中
          option(value="ready") 可出餐
          option(value="picked_up") 已取餐
          option(value="cancelled") 已取消
      label.action-field
        span.action-label 更新付款狀態
        select.action-input(:value="detail.order.paymentStatus" @change="updatePaymentStatus")
          option(value="unpaid") 未付款
          option(value="paid") 已付款
    .quick-actions
      button.quick-action(type="button" @click="markPickedUp" :disabled="detail.order.orderStatus === 'picked_up'") 標記已取餐
      .cancel-box
        input.cancel-input(type="text" v-model="cancelReason" placeholder="取消原因")
        button.quick-action.is-danger(type="button" @click="cancelOrder" :disabled="detail.order.orderStatus === 'cancelled'") 取消訂單

  section.detail-list-card
    h3.detail-list-card__title 人員小計
    .list-row(v-for="person in detail.persons" :key="person.cartId || person.guestLabel")
      span {{ person.guestLabel }}
      strong {{ `NT$ ${person.total}` }}

  section.detail-list-card
    h3.detail-list-card__title 批次明細
    .batch-block(v-for="batch in detail.batches" :key="batch.id")
      .batch-block__head
        strong.batch-block__title {{ `第 ${batch.batchNo} 批` }}
        span.batch-block__meta {{ statusLabels[batch.status] || batch.status }}
      p.batch-block__info(v-if="batch.submittedAt") {{ `送單時間：${batch.submittedAt}` }}
      p.batch-block__info {{ `${batch.itemCount} 項 / NT$ ${batch.subtotal}` }}
      .guest-block(v-for="person in batch.persons" :key="`${batch.id}-${person.cartId}`")
        .guest-block__head
          strong.guest-block__title {{ person.guestLabel }}
          span.guest-block__meta {{ `NT$ ${person.subtotal}` }}
        article.item-card(v-for="item in person.items" :key="`${batch.id}-${item.id}`")
          .item-card__head
            strong.item-card__title {{ item.title }}
            span.item-card__qty {{ `x${item.quantity}` }}
          p.item-card__note(v-if="item.note") {{ item.note }}
          .item-card__options(v-if="item.options?.length")
            span.item-card__option(v-for="option in item.options" :key="option") {{ option }}
          strong.item-card__price {{ `NT$ ${item.price}` }}

  section.detail-list-card
    h3.detail-list-card__title 狀態紀錄
    .timeline-row(v-for="item in detail.timeline" :key="`${item.status}-${item.changed_at}`")
      .timeline-row__main
        strong {{ statusLabels[item.status] || item.status }}
        p {{ item.note }}
      span {{ item.changed_at }}

  section.detail-list-card
    h3.detail-list-card__title 併單
    p.lead(v-if="mergeCandidates.length === 0") 目前沒有可併入這張單的同桌候選訂單。
    template(v-else)
      label.action-field
        span.action-label 被併入訂單
        select.action-input(v-model="mergeOrderId")
          option(value="") 請選擇要併入的訂單
          option(v-for="candidate in mergeCandidates" :key="candidate.id" :value="candidate.id")
            | {{ `${candidate.orderNo} / ${candidate.tableCode} / NT$ ${candidate.totalAmount}` }}
      label.action-field
        span.action-label 併單原因
        input.action-input(type="text" v-model="mergeReason" placeholder="可留空")
      button.quick-action(type="button" :disabled="!mergeOrderId" @click="mergeOrder") 執行併單
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.scope-card, .detail-list-card
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

.scope-card h2
  margin: 0 0 10px

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

.error-text
  margin: 0
  color: #a4432c

.detail-grid
  margin-top: 16px
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 12px

.detail-card
  display: grid
  gap: 8px
  padding: 16px
  border-radius: 18px
  background: rgba(121, 214, 207, 0.12)

.detail-label
  color: #7b8d90
  font-size: 13px

.detail-value
  color: #243a3e

.detail-actions
  margin-top: 16px
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.action-field
  display: grid
  gap: 8px
  padding: 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.72)
  border: 1px solid rgba(91, 127, 130, 0.12)

.action-label
  color: #7b8d90
  font-size: 13px

.action-input, .cancel-input
  width: 100%
  border: 0
  border-radius: 12px
  padding: 12px 14px
  background: rgba(121, 214, 207, 0.14)
  color: #243a3e

.quick-actions
  margin-top: 12px
  display: grid
  grid-template-columns: minmax(0, 220px) 1fr
  gap: 12px

.quick-action
  border: 0
  border-radius: 14px
  padding: 12px 16px
  background: #2d6f6d
  color: #fff
  font-weight: 700
  cursor: pointer

.quick-action:disabled
  opacity: 0.45
  cursor: default

.quick-action.is-danger
  background: #c95f47

.cancel-box
  display: grid
  grid-template-columns: 1fr auto
  gap: 10px

.detail-list-card__title
  margin: 0 0 14px
  color: #243a3e

.list-row, .timeline-row
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 14px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.list-row:last-child, .timeline-row:last-child
  border-bottom: 0

.batch-block
  display: grid
  gap: 12px
  padding: 18px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.batch-block:last-child
  border-bottom: 0

.batch-block__head, .guest-block__head, .item-card__head, .timeline-row__main
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: center

.batch-block__info
  margin: 0
  color: #7b8d90

.guest-block
  display: grid
  gap: 10px
  padding: 14px
  border-radius: 18px
  background: rgba(121, 214, 207, 0.08)

.guest-block__title, .item-card__title, .batch-block__title
  color: #243a3e

.guest-block__meta, .batch-block__meta
  color: #2d6f6d
  font-weight: 700

.item-card
  display: grid
  gap: 8px
  padding: 14px
  border-radius: 16px
  background: rgba(255, 255, 255, 0.82)

.item-card__qty, .item-card__price
  color: #2d6f6d
  font-weight: 700

.item-card__note
  margin: 0
  color: #6f5b43

.item-card__options
  display: flex
  flex-wrap: wrap
  gap: 8px

.item-card__option
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #2d6f6d
  font-size: 12px
  font-weight: 700

.timeline-row__main
  flex-direction: column
  align-items: flex-start

.timeline-row__main p
  margin: 4px 0 0
  color: #6f7f82

@media (max-width: 960px)
  .detail-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .detail-actions
    grid-template-columns: 1fr

  .quick-actions
    grid-template-columns: 1fr

@media (max-width: 640px)
  .detail-grid
    grid-template-columns: 1fr

  .cancel-box
    grid-template-columns: 1fr
</style>

