<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const trackerStore = world.store('dineCoreOrderTrackerStore')
const entryStore = world.hasStore('dineCoreEntryStore') ? world.store('dineCoreEntryStore') : null
const state = computed(() => trackerStore.state)
const entryState = computed(() => entryStore?.state || { orderingSessionToken: '' })
const statusLabels = {
  pending: '待處理',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}
const POLL_INTERVAL_MS = 5000
let refreshTimer = null

async function refreshTracker() {
  const orderId = String(route.params.orderId || 'demo-order')
  await trackerStore.load({
    orderId,
    orderingSessionToken: entryState.value.orderingSessionToken
  })
}

function stopPolling() {
  if (refreshTimer) {
    window.clearInterval(refreshTimer)
    refreshTimer = null
  }
}

function startPolling() {
  stopPolling()
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return
  }

  refreshTimer = window.setInterval(() => {
    refreshTracker()
  }, POLL_INTERVAL_MS)
}

function handleVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    stopPolling()
    return
  }

  refreshTracker()
  startPolling()
}

watch(
  [() => route.params.orderId, () => entryState.value.orderingSessionToken],
  async () => {
    await refreshTracker()
    startPolling()
  },
  { immediate: true }
)


onMounted(() => {
  if (typeof document !== 'undefined') {
    document.addEventListener('visibilitychange', handleVisibilityChange)
  }
})

onBeforeUnmount(() => {
  stopPolling()
  if (typeof document !== 'undefined') {
    document.removeEventListener('visibilitychange', handleVisibilityChange)
  }
})
</script>

<template lang="pug">
.mobile-page
  section.order-history-card
    .order-history-card__status
      span.order-history-card__number {{ state.status === 'ready' ? '2' : state.status === 'picked_up' ? '1' : '3' }}
      span.order-history-card__label {{ statusLabels[state.status] || state.status }}
    .order-history-card__body
      h2.order-history-card__title {{ route.params.orderId || state.orderNo || '訂單' }}
      p.order-history-card__meta {{ `目前狀態 ${statusLabels[state.status] || state.status}` }}
      p.order-history-card__meta {{ `預估等待 ${state.estimatedWaitMinutes ?? '--'} 分鐘` }}

  section.notice-card.is-error(v-if="state.errorMessage")
    h3.notice-card__title 同步提醒
    p.notice-card__copy {{ state.errorMessage }}

  section.progress-card
    h3.progress-card__title 訂單進度
    .progress-card__bar
      span.progress-card__fill(:class="`is-${state.status}`")
    .progress-card__legend
      span 待處理
      span 製作中
      span 可取餐

  section.person-card
    h3.person-card__title 已送出品項
    .person-list
      article.person-panel(v-for="person in state.persons" :key="person.cartId")
        .person-panel__head
          .person-panel__title-block
            strong.person-panel__title {{ person.guestLabel }}
            span.person-panel__meta {{ `小計 $${person.subtotal}` }}
          strong.person-panel__total {{ `$${person.total}` }}
        .person-panel__items
          article.person-item(v-for="item in person.items" :key="item.id")
            .person-item__head
              strong.person-item__title {{ item.title }}
              span.person-item__qty {{ `x${item.quantity}` }}
            p.person-item__note(v-if="item.note") {{ item.note }}
            .person-item__options(v-if="item.options?.length")
              span.person-item__option(v-for="option in item.options" :key="option") {{ option }}

  section.timeline-card
    h3.timeline-card__title 時間線
    .timeline-item(v-for="item in state.timeline" :key="`${item.status}-${item.changed_at}`")
      span.timeline-item__dot
      p.timeline-item__text {{ `${item.changed_at} | ${item.note}` }}

  section.history-card
    h3.history-card__title 最近桌號訂單
    .history-card__list
      article.history-card__item(v-for="(item, index) in state.history" :key="item.id")
        .history-card__badge {{ index + 1 }}
        .history-card__body
          strong {{ item.orderNo }}
          p {{ `建立時間 ${item.createdAt}` }}
          span {{ `NT$ ${item.totalAmount}` }}
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.order-history-card, .timeline-card, .progress-card, .history-card, .person-card, .notice-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.notice-card.is-error
  border-color: rgba(206, 109, 89, 0.28)
  background: linear-gradient(180deg, rgba(255, 244, 241, 0.98), rgba(255, 250, 248, 1))

.notice-card__title
  margin: 0 0 8px
  color: #a84c3b

.notice-card__copy
  margin: 0
  color: #7b544d
  line-height: 1.7

.order-history-card
  display: grid
  grid-template-columns: 92px 1fr
  gap: 14px
  align-items: center

.order-history-card__status
  min-height: 110px
  border-radius: 18px
  background: linear-gradient(180deg, rgba(124, 214, 207, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff
  display: grid
  place-items: center
  text-align: center
  padding: 10px

.order-history-card__number
  font-size: 34px
  font-weight: 800

.order-history-card__label
  font-size: 13px
  line-height: 1.4

.order-history-card__body
  display: grid
  gap: 8px

.order-history-card__title
  margin: 0
  color: var(--dc-text)
  font-size: 24px

.order-history-card__meta
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.6

.progress-card__title, .history-card__title, .timeline-card__title, .person-card__title
  margin: 0 0 12px
  color: var(--dc-text)

.progress-card__bar
  height: 14px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  overflow: hidden
  margin-bottom: 12px

.progress-card__fill
  display: block
  width: 24%
  height: 100%
  border-radius: inherit
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)

.progress-card__fill.is-preparing
  width: 62%

.progress-card__fill.is-ready, .progress-card__fill.is-picked_up
  width: 100%

.progress-card__fill.is-cancelled
  width: 100%
  background: linear-gradient(135deg, #d98b7c 0%, #c85e4a 100%)

.progress-card__legend
  display: flex
  justify-content: space-between
  gap: 12px
  color: var(--dc-text-muted)
  font-size: 13px

.person-list
  display: grid
  gap: 12px

.person-panel
  padding: 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)
  display: grid
  gap: 14px

.person-panel__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 12px

.person-panel__title-block
  display: grid
  gap: 4px

.person-panel__title
  color: var(--dc-text)

.person-panel__meta
  color: var(--dc-text-muted)
  font-size: 13px

.person-panel__total
  color: #21373b
  font-size: 18px

.person-panel__items
  display: grid
  gap: 10px

.person-item
  padding: 14px
  border-radius: 16px
  background: rgba(121, 214, 207, 0.08)
  display: grid
  gap: 8px

.person-item__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

.person-item__title
  color: var(--dc-text)

.person-item__qty
  color: var(--dc-text-muted)
  font-size: 13px

.person-item__note
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.6

.person-item__options
  display: flex
  flex-wrap: wrap
  gap: 6px

.person-item__option
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #4d7678
  font-size: 11px
  font-weight: 700

.timeline-item
  display: grid
  grid-template-columns: 20px 1fr
  gap: 10px
  align-items: start
  padding: 10px 0

.timeline-item__dot
  width: 12px
  height: 12px
  border-radius: 50%
  background: linear-gradient(180deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  margin-top: 5px

.timeline-item__text
  margin: 0
  color: #53686c
  line-height: 1.7

.history-card__list
  display: grid
  gap: 10px

.history-card__item
  display: grid
  grid-template-columns: 74px 1fr
  gap: 12px
  padding: 14px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)

.history-card__badge
  min-height: 86px
  border-radius: 16px
  background: linear-gradient(180deg, rgba(120, 213, 206, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff
  display: grid
  place-items: center
  font-size: 26px
  font-weight: 800

.history-card__body
  display: grid
  gap: 4px

.history-card__body strong
  color: var(--dc-text)

.history-card__body p
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.6

.history-card__body span
  color: var(--dc-accent)
  font-weight: 700
</style>
