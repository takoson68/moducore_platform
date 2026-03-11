<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import { useDineCoreOrderingFlow } from '@project/services/dineCoreOrderingFlowService.js'

const route = useRoute()
const orderingFlow = useDineCoreOrderingFlow()
const trackerStore = world.store('dineCoreOrderTrackerStore')

const state = computed(() => trackerStore.state)
const entryState = orderingFlow.entryState

const statusLabels = {
  draft: '草稿',
  pending: '待製作',
  submitted: '已送出',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}

const POLL_INTERVAL_MS = 5000
let refreshTimer = null

function formatCurrency(value) {
  return `$${Number(value || 0)}`
}

function formatDateTime(input) {
  if (!input) return '--'
  const parsed = new Date(input)
  if (Number.isNaN(parsed.getTime())) return String(input)
  return new Intl.DateTimeFormat('zh-TW', {
    hour12: false,
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  }).format(parsed)
}

async function refreshTracker() {
  const tableCode = String(route.params.tableCode || '')
  const orderId = String(route.params.orderId || '')
  if (!tableCode || !orderId) return

  const queryToken = String(route.query.orderingSessionToken || route.query.ordering_session_token || '')

  await orderingFlow.loadOrderTracker({
    tableCode,
    orderId,
    queryToken
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
  [
    () => route.params.orderId,
    () => route.query.orderingSessionToken,
    () => route.query.ordering_session_token,
    () => entryState.value.orderingSessionToken
  ],
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

const submittedBatches = computed(() =>
  (Array.isArray(state.value.batches) ? state.value.batches : []).filter(batch => batch.status !== 'draft')
)

const latestSubmittedBatch = computed(() =>
  submittedBatches.value.length > 0 ? submittedBatches.value[submittedBatches.value.length - 1] : null
)

const canContinueOrdering = computed(() =>
  (Array.isArray(state.value.batches) ? state.value.batches : []).some(batch => batch.status === 'draft')
)
</script>

<template lang="pug">
.mobile-page
  section.order-card
    p.order-card__eyebrow 訂單追蹤
    h2.order-card__title {{ state.orderNo || route.params.orderId || '訂單' }}
    p.order-card__meta {{ `目前狀態：${statusLabels[state.status] || state.status}` }}
    p.order-card__meta {{ `預估等待：${state.estimatedWaitMinutes ?? '--'} 分鐘` }}
    p.order-card__meta(v-if="latestSubmittedBatch") {{ `最近送出：第 ${latestSubmittedBatch.batchNo} 批，共 ${latestSubmittedBatch.itemCount} 項` }}
    p.order-card__meta(v-if="canContinueOrdering") 你可以回到菜單繼續加點，會進入下一個草稿批次。

  section.notice-card.is-error(v-if="state.errorMessage")
    h3.notice-card__title 載入失敗
    p.notice-card__copy {{ state.errorMessage }}

  section.person-card
    h3.person-card__title 訂單明細
    p.person-card__intro 以下為這張訂單的品項與金額。
    .person-list
      article.person-panel(v-for="person in state.persons" :key="person.cartId")
        .person-panel__head
          .person-panel__title-block
            strong.person-panel__title {{ person.guestLabel }}
            span.person-panel__meta {{ `餐點小計 ${formatCurrency(person.subtotal)}` }}
          strong.person-panel__total {{ `總計 ${formatCurrency(person.total)}` }}
        .person-panel__bill
          .person-panel__bill-row
            span.person-panel__bill-label 餐點小計
            span.person-panel__bill-value {{ formatCurrency(person.subtotal) }}
          .person-panel__bill-row
            span.person-panel__bill-label 10% 服務費
            span.person-panel__bill-value {{ formatCurrency(person.serviceFee) }}
          .person-panel__bill-row.is-total
            span.person-panel__bill-label 總計
            strong.person-panel__bill-value {{ formatCurrency(person.total) }}
        .person-panel__items
          article.person-item(v-for="item in person.items" :key="item.id")
            .person-item__head
              strong.person-item__title {{ item.title }}
              span.person-item__qty {{ `x${item.quantity}` }}
            p.person-item__note(v-if="item.note") {{ item.note }}
            .person-item__options(v-if="item.options?.length")
              span.person-item__option(v-for="option in item.options" :key="option") {{ option }}

  section.batch-card
    h3.batch-card__title 批次進度
    p.batch-card__intro(v-if="submittedBatches.length > 0") {{ `目前已送出 ${submittedBatches.length} 批，以下可查看每批內容。` }}
    p.batch-card__intro(v-else) 目前尚未有已送出批次。
    .batch-list
      article.batch-item(v-for="batch in submittedBatches" :key="batch.id")
        .batch-item__head
          .batch-item__title-block
            strong.batch-item__title {{ `第 ${batch.batchNo} 批` }}
            span.batch-item__meta {{ statusLabels[batch.status] || batch.status }}
          strong.batch-item__sum {{ formatCurrency(batch.subtotal) }}
        p.batch-item__time(v-if="batch.submittedAt") {{ `送出時間：${formatDateTime(batch.submittedAt)}` }}
        p.batch-item__count {{ `${batch.itemCount} 項` }}
        .batch-item__persons(v-if="batch.persons.length > 0")
          article.batch-person(v-for="person in batch.persons" :key="`${batch.id}-${person.cartId}`")
            .batch-person__head
              strong {{ person.guestLabel }}
              span {{ formatCurrency(person.subtotal) }}
            ul.batch-person__items
              li(v-for="item in person.items" :key="`${batch.id}-${item.id}`") {{ `${item.title} x${item.quantity}` }}

</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.order-card,
.batch-card,
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
.person-card__title
  margin: 0 0 12px

.batch-card__intro,
.person-card__intro
  margin: 0 0 12px
  color: var(--dc-text-muted)
  line-height: 1.7

.batch-list,
.person-list
  display: grid
  gap: 12px

.batch-item,
.person-panel
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
.batch-item__draft,
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

.person-panel__bill
  display: grid
  gap: 6px
  padding: 12px 14px
  border-radius: 14px
  background: rgba(33, 55, 59, 0.04)

.person-panel__bill-row
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  color: var(--dc-text-muted)
  font-size: 13px

.person-panel__bill-row.is-total
  padding-top: 6px
  border-top: 1px dashed rgba(109, 180, 177, 0.35)
  color: #21373b

.person-panel__bill-label
  white-space: nowrap

.person-panel__bill-value
  color: inherit

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

</style>
