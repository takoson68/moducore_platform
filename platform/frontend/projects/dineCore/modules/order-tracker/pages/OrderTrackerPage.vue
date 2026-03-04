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
  draft: '草稿',
  pending: '待處理',
  submitted: '已送出',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}
const POLL_INTERVAL_MS = 5000
let refreshTimer = null

async function refreshTracker() {
  const orderId = String(route.params.orderId || '')
  if (!orderId) return

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
  section.order-card
    p.order-card__eyebrow 訂單追蹤
    h2.order-card__title {{ state.orderNo || route.params.orderId || '訂單' }}
    p.order-card__meta {{ `目前狀態：${statusLabels[state.status] || state.status}` }}
    p.order-card__meta {{ `預估等待：${state.estimatedWaitMinutes ?? '--'} 分鐘` }}

  section.notice-card.is-error(v-if="state.errorMessage")
    h3.notice-card__title 發生問題
    p.notice-card__copy {{ state.errorMessage }}

  section.batch-card
    h3.batch-card__title 批次進度
    .batch-list
      article.batch-item(v-for="batch in state.batches" :key="batch.id")
        .batch-item__head
          .batch-item__title-block
            strong.batch-item__title {{ `第 ${batch.batchNo} 批` }}
            span.batch-item__meta {{ statusLabels[batch.status] || batch.status }}
          strong.batch-item__sum {{ `$${batch.subtotal}` }}
        p.batch-item__time(v-if="batch.submittedAt") {{ `送出時間：${batch.submittedAt}` }}
        p.batch-item__time(v-else) 尚未送出
        p.batch-item__count {{ `${batch.itemCount} 項品項` }}
        .batch-item__persons(v-if="batch.persons.length > 0")
          article.batch-person(v-for="person in batch.persons" :key="`${batch.id}-${person.cartId}`")
            .batch-person__head
              strong {{ person.guestLabel }}
              span {{ `$${person.subtotal}` }}
            ul.batch-person__items
              li(v-for="item in person.items" :key="`${batch.id}-${item.id}`") {{ `${item.title} x${item.quantity}` }}

  section.person-card
    h3.person-card__title 全單彙總
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
    h3.history-card__title 最近同桌訂單
    .history-card__list
      article.history-card__item(v-for="(item, index) in state.history" :key="item.id")
        .history-card__badge {{ index + 1 }}
        .history-card__body
          strong {{ item.orderNo }}
          p {{ `建立時間：${item.createdAt}` }}
          span {{ `NT$ ${item.totalAmount}` }}
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.order-card,
.batch-card,
.timeline-card,
.history-card,
.person-card,
.notice-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.order-card__eyebrow
  margin: 0 0 8px
  color: #72c8c4
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.order-card__title
  margin: 0

.order-card__meta
  margin: 6px 0 0
  color: var(--dc-text-muted)

.notice-card.is-error
  border-color: rgba(206, 109, 89, 0.28)
  background: linear-gradient(180deg, rgba(255, 244, 241, 0.98), rgba(255, 250, 248, 1))

.notice-card__title
  margin: 0 0 8px
  color: #a84c3b

.notice-card__copy
  margin: 0
  color: #7b544d

.batch-card__title,
.timeline-card__title,
.history-card__title,
.person-card__title
  margin: 0 0 12px

.batch-list,
.person-list,
.history-card__list
  display: grid
  gap: 12px

.batch-item,
.person-panel,
.history-card__item
  padding: 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)

.batch-item
  display: grid
  gap: 10px

.batch-item__head,
.person-panel__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 12px

.batch-item__title-block,
.person-panel__title-block
  display: grid
  gap: 4px

.batch-item__meta,
.batch-item__time,
.batch-item__count,
.person-panel__meta
  color: var(--dc-text-muted)
  font-size: 13px
  margin: 0

.batch-item__persons
  display: grid
  gap: 10px

.batch-person
  padding: 12px
  border-radius: 14px
  background: rgba(121, 214, 207, 0.08)

.batch-person__head
  display: flex
  justify-content: space-between
  gap: 12px

.batch-person__items
  margin: 8px 0 0
  padding-left: 18px
  color: var(--dc-text-muted)

.person-panel
  display: grid
  gap: 14px

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

.person-item__qty
  color: var(--dc-text-muted)
  font-size: 13px

.person-item__note
  margin: 0
  color: var(--dc-text-muted)

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
  border-radius: 999px
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  margin-top: 6px

.timeline-item__text
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.6

.history-card__item
  display: grid
  grid-template-columns: 38px 1fr
  gap: 12px
  align-items: start

.history-card__badge
  width: 38px
  height: 38px
  border-radius: 12px
  background: rgba(121, 214, 207, 0.16)
  display: grid
  place-items: center
  font-weight: 700
  color: #3f6668

.history-card__body
  display: grid
  gap: 4px

.history-card__body p,
.history-card__body span
  margin: 0
  color: var(--dc-text-muted)
</style>
