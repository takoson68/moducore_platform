<script setup>
import { computed, ref, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const counterStore = world.store('dineCoreCounterStore')
const state = computed(() => counterStore.state)
const detail = computed(() => counterStore.state.detail)
const cancelReason = ref('')
const statusLabels = {
  pending: '待處理',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消',
  unpaid: '未付款',
  paid: '已付款'
}

const groupedItems = computed(() => {
  const items = detail.value?.items || []
  return items.reduce((groups, item) => {
    const guestLabel = item.guestLabel || 'Unknown'
    if (!groups[guestLabel]) {
      groups[guestLabel] = []
    }
    groups[guestLabel].push(item)
    return groups
  }, {})
})

watchEffect(() => {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return
  counterStore.loadDetail(orderId)
})

async function updateOrderStatus(event) {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: event.target.value
  })
}

async function updatePaymentStatus(event) {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return
  await counterStore.setPaymentStatus({
    orderId,
    paymentStatus: event.target.value
  })
}

async function markPickedUp() {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'picked_up',
    note: '顧客已於櫃台取餐'
  })
}

async function cancelOrder() {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return
  const reason = cancelReason.value.trim() || '櫃台取消'
  await counterStore.setOrderStatus({
    orderId,
    orderStatus: 'cancelled',
    note: `訂單已取消：${reason}`
  })
}
</script>

<template lang="pug">
.desk-page(v-if="detail")
  section.detail-list-card(v-if="state.error")
    p.error-text {{ state.error }}
  section.scope-card
    p.eyebrow 櫃台模組
    h2 櫃台訂單明細
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
        span.detail-label 總額
        strong.detail-value {{ `NT$ ${detail.order.totalAmount}` }}
    .detail-actions
      label.action-field
        span.action-label 更新訂單狀態
        select.action-input(:value="detail.order.orderStatus" @change="updateOrderStatus")
          option(value="pending") 待處理
          option(value="preparing") 製作中
          option(value="ready") 可取餐
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
    h3.detail-list-card__title 各人金額
    .list-row(v-for="person in detail.persons" :key="person.guestLabel")
      span {{ person.guestLabel }}
      strong {{ `NT$ ${person.total}` }}

  section.detail-list-card
    h3.detail-list-card__title 客製內容摘要
    .guest-block(v-for="(items, guestLabel) in groupedItems" :key="guestLabel")
      .guest-block__head
        strong.guest-block__title {{ guestLabel }}
        span.guest-block__meta {{ `${items.length} 項` }}
      article.item-card(v-for="item in items" :key="item.id")
        .item-card__head
          strong.item-card__title {{ item.title }}
          span.item-card__qty {{ `x${item.quantity}` }}
        p.item-card__note(v-if="item.note") {{ item.note }}
        .item-card__options(v-if="item.options?.length")
          span.item-card__option(v-for="option in item.options" :key="option") {{ option }}
        strong.item-card__price {{ `NT$ ${item.price}` }}

  section.detail-list-card
    h3.detail-list-card__title 時間線
    .timeline-row(v-for="item in detail.timeline" :key="`${item.status}-${item.changed_at}`")
      .timeline-row__main
        strong {{ statusLabels[item.status] || item.status }}
        p {{ item.note }}
      span {{ item.changed_at }}
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

.guest-block
  display: grid
  gap: 12px
  padding: 18px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.guest-block:last-child
  border-bottom: 0
  padding-bottom: 0

.guest-block__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.guest-block__title
  color: #243a3e

.guest-block__meta
  color: #7b8d90
  font-size: 13px

.item-card
  padding: 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)
  display: grid
  gap: 8px

.item-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.item-card__title
  color: #243a3e

.item-card__qty
  color: #7b8d90
  font-size: 13px
  font-weight: 700

.item-card__note
  margin: 0
  padding: 10px 12px
  border-radius: 12px
  background: rgba(255, 214, 102, 0.18)
  color: #7b5316
  line-height: 1.6
  font-weight: 700

.item-card__options
  display: flex
  flex-wrap: wrap
  gap: 8px

.item-card__option
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  font-size: 12px
  font-weight: 700

.item-card__price
  color: #243a3e

.timeline-row__main
  display: grid
  gap: 4px

.timeline-row__main p
  margin: 0
  color: #7b8d90
  line-height: 1.6

@media (max-width: 960px)
  .detail-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .detail-actions, .quick-actions
    grid-template-columns: 1fr

  .cancel-box
    grid-template-columns: 1fr

@media (max-width: 640px)
  .detail-grid
    grid-template-columns: 1fr
</style>
