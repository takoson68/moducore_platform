<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const router = useRouter()
const checkoutStore = world.store('dineCoreCheckoutStore')
const entryStore = world.hasStore('dineCoreEntryStore') ? world.store('dineCoreEntryStore') : null

const state = computed(() => checkoutStore.state)
const entryState = computed(() => entryStore?.state || { orderingSessionToken: '' })
const tableCode = computed(() => String(route.params.tableCode || 'A01'))
const submittedBatchCount = computed(() => Math.max(Number(state.value.currentBatchNo || 0) - 1, 0))
const pollIntervalMs = 5000
let pollTimer = null

async function refreshCheckout() {
  if (!entryState.value.orderingSessionToken) return

  await checkoutStore.load({
    tableCode: tableCode.value,
    orderingSessionToken: entryState.value.orderingSessionToken
  })
}

function stopPolling() {
  if (!pollTimer) return
  window.clearInterval(pollTimer)
  pollTimer = null
}

function startPolling() {
  stopPolling()
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return
  }

  pollTimer = window.setInterval(() => {
    refreshCheckout()
  }, pollIntervalMs)
}

function handleVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    stopPolling()
    return
  }

  refreshCheckout()
  startPolling()
}

watch(
  [tableCode, () => entryState.value.orderingSessionToken],
  async ([, orderingSessionToken]) => {
    if (!orderingSessionToken) {
      stopPolling()
      return
    }

    await refreshCheckout()
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

async function submitOrder() {
  if (state.value.itemCount <= 0 || state.value.submitting) {
    return
  }

  stopPolling()
  const result = await checkoutStore.submit({
    tableCode: tableCode.value,
    orderingSessionToken: entryState.value.orderingSessionToken
  })

  // Keep top nav state in sync immediately after submit, no hard refresh required.
  if (entryStore) {
    entryStore.setTableContext({
      tableCode: tableCode.value,
      orderId: String(result.orderId || entryState.value.orderId || ''),
      orderStatus: 'pending',
      currentBatchId: String(result.nextBatchId || ''),
      currentBatchNo: Number(result.nextBatchNo || 0),
      currentBatchStatus: 'draft'
    })
  }

  router.push({
    path: `/t/${tableCode.value}/checkout/success/${result.orderId}`,
    query: {
      submittedBatchNo: String(result.submittedBatchNo || ''),
      nextBatchNo: String(result.nextBatchNo || '')
    }
  })
}

function goBackToCart() {
  router.push(`/t/${tableCode.value}/cart`)
}
</script>

<template lang="pug">
.mobile-page
  section.bill-card
    .bill-card__head
      p.bill-card__eyebrow 結帳確認
      h2.bill-card__title 確認本批餐點
      p.bill-card__copy(v-if="state.currentBatchNo > 0") {{ `目前要送出第 ${state.currentBatchNo} 批` }}
      p.bill-card__copy 系統會將目前批次內所有顧客的品項一起送出。送出後，這一批會立即鎖定。
      p.bill-card__copy(v-if="submittedBatchCount > 0") {{ `前面已送出 ${submittedBatchCount} 批，這次送出不會回頭改動之前的餐點。` }}
      p.bill-card__copy 送出後如果還要加點，系統會自動建立新的草稿批次供你繼續操作。
    .bill-row
      span.bill-row__label 品項數
      strong.bill-row__value {{ state.itemCount }}
    .bill-row
      span.bill-row__label 小計
      strong.bill-row__value {{ state.subtotal }}
    .bill-row
      span.bill-row__label 服務費
      strong.bill-row__value {{ state.serviceFee }}
    .bill-row
      span.bill-row__label 稅額
      strong.bill-row__value {{ state.tax }}
    .bill-row.is-total
      span.bill-row__label 總計
      strong.bill-row__value {{ state.total }}
    .bill-card__actions
      button.bill-card__back(type="button" :disabled="state.submitting" @click="goBackToCart") 返回上一步
      button.bill-card__action(type="button" :disabled="state.submitting || state.itemCount <= 0" @click="submitOrder")
        | {{ state.submitting ? '處理中...' : '送出訂單' }}

  section.notice-card.is-error(v-if="state.errorMessage")
    h3.notice-card__title 發生問題
    p.notice-card__copy {{ state.errorMessage }}

  section.notice-card(v-else-if="state.itemCount <= 0")
    h3.notice-card__title 目前沒有可送出的品項
    p.notice-card__copy 只要這一批沒有任何商品，系統就不會建立訂單。請先回菜單或購物車加入品項。

  section.person-card
    h3.person-card__title 本批次明細
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
            strong.person-item__price {{ `$${item.price}` }}

  section.notice-card
    h3.notice-card__title 同步提示
    p.notice-card__copy 系統每 5 秒同步一次。若其他顧客先送出，這裡會自動切到新的草稿批次。
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.bill-card,
.person-card,
.notice-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.bill-card
  display: grid
  gap: 14px

.bill-card__head
  display: grid
  gap: 8px

.bill-card__eyebrow
  margin: 0
  color: #72c8c4
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.bill-card__title
  margin: 0
  color: var(--dc-text)

.bill-card__copy
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.7

.bill-row
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 14px 0
  border-bottom: 1px solid rgba(98, 145, 148, 0.12)

.bill-row:last-of-type
  border-bottom: 0

.bill-row__label
  color: var(--dc-text-muted)

.bill-row__value
  color: var(--dc-text)

.bill-row.is-total .bill-row__label,
.bill-row.is-total .bill-row__value
  color: #20373b
  font-size: 20px

.bill-card__action
  border: 0
  border-radius: 16px
  padding: 16px
  background: linear-gradient(180deg, #2dc762 0%, #24ba59 100%)
  color: #fff
  font-size: 16px
  font-weight: 700
  cursor: pointer

.bill-card__action:disabled
  opacity: 1
  background: #cfd8d6
  color: #7a8784
  cursor: not-allowed

.bill-card__actions
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.bill-card__back
  border: 1px solid rgba(98, 145, 148, 0.22)
  border-radius: 16px
  padding: 16px
  background: #fff
  color: #31585d
  font-size: 16px
  font-weight: 700
  cursor: pointer

.bill-card__back:disabled
  background: #f4f7f6
  color: #9aa8a5
  cursor: not-allowed

.person-card__title,
.notice-card__title
  margin: 0 0 12px
  color: var(--dc-text)

.notice-card__copy
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.7

.notice-card.is-error
  border-color: rgba(220, 104, 89, 0.32)
  background: rgba(255, 237, 232, 0.9)

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

.person-item__price
  color: #21373b
  font-size: 16px
</style>
