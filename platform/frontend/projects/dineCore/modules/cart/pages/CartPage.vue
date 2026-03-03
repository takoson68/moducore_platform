<script setup>
import { computed, onBeforeUnmount, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const router = useRouter()
const cartStore = world.store('dineCoreCartStore')
const entryStore = world.hasStore('dineCoreEntryStore') ? world.store('dineCoreEntryStore') : null
const state = computed(() => cartStore.state)
const entryState = computed(() => entryStore?.state || { orderingSessionToken: '' })
const tableCode = computed(() => String(route.params.tableCode || 'A01'))
const POLL_INTERVAL_MS = 5000
let pollTimer = null

async function refreshCart() {
  if (!entryState.value.orderingSessionToken) return

  await cartStore.load({
    tableCode: tableCode.value,
    orderingSessionToken: entryState.value.orderingSessionToken
  })
}

function stopPolling() {
  if (pollTimer) {
    window.clearInterval(pollTimer)
    pollTimer = null
  }
}

function startPolling() {
  stopPolling()
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    return
  }

  pollTimer = window.setInterval(() => {
    refreshCart()
  }, POLL_INTERVAL_MS)
}

function handleVisibilityChange() {
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
    stopPolling()
    return
  }

  refreshCart()
  startPolling()
}

watch(
  [tableCode, () => entryState.value.orderingSessionToken],
  async ([, orderingSessionToken]) => {
    if (!orderingSessionToken) {
      stopPolling()
      return
    }

    await refreshCart()
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

const orderingCart = computed(() =>
  state.value.carts.find(item => item.id === state.value.orderingCartId) || null
)

const viewingCart = computed(() =>
  state.value.carts.find(item => item.id === state.value.viewingCartId) || null
)

const viewingCartItems = computed(() => state.value.cartItemsByCartId[state.value.viewingCartId] || [])

const editorSelectedOptions = computed(() => {
  const editor = state.value.editor
  if (!editor) return []

  return editor.optionGroups.flatMap(group =>
    group.options.filter(option => editor.selectedOptionIds.includes(option.id))
  )
})

const editorTotalPrice = computed(() => {
  const basePrice = Number(state.value.editor?.basePrice || 0)
  const extraPrice = editorSelectedOptions.value.reduce(
    (sum, option) => sum + Number(option.priceDelta || 0),
    0
  )

  return basePrice + extraPrice
})

async function changeQuantity(cartItemId, delta) {
  await cartStore.changeItemQuantity({
    tableCode: tableCode.value,
    cartId: state.value.viewingCartId,
    cartItemId,
    delta
  })
}

function hasEditorOption(groupId, optionId) {
  const editor = state.value.editor
  if (!editor) return false

  return editor.selectedOptionIds.includes(optionId) &&
    editor.optionGroups.some(group => group.id === groupId)
}

async function saveEditor() {
  await cartStore.saveEditor({
    tableCode: tableCode.value
  })
}

function goToConfirmOrder() {
  router.push(`/t/${tableCode.value}/checkout`)
}
</script>

<template lang="pug">
.mobile-page
  section.mobile-hero-card.is-compact
    .mobile-hero-card__badge 合單準備
    h2.mobile-hero-card__title 顧客購物車
    p.mobile-hero-card__copy
      | 手機加點會固定加入 API 指定的顧客分組；這裡切換只影響查看與編輯，不會改變後續加點歸屬。
    p.mobile-hero-card__copy(v-if="orderingCart")
      | 目前這支手機的加點目標：{{ orderingCart.guestLabel }}

  section.feature-card.is-error(v-if="state.errorMessage")
    h3.feature-card__title 同步提醒
    p.feature-card__copy {{ state.errorMessage }}

  section.cart-switcher
    button.cart-chip(
      v-for="cart in state.carts"
      :key="cart.id"
      type="button"
      :class="{ 'is-active': state.viewingCartId === cart.id }"
      @click="cartStore.setViewingCart(cart.id)"
    )
      span.cart-chip__title
        | {{ cart.guestLabel }}
        small.cart-chip__pin(v-if="state.orderingCartId === cart.id") 本機加點
      span.cart-chip__meta {{ `${cart.itemCount} 項` }}

  section.cart-summary-card
    .cart-summary-card__head
      h3.cart-summary-card__title {{ viewingCart?.guestLabel || '尚未選擇購物車' }}
      span.cart-summary-card__tag 子購物車

    .cart-item-list
      article.cart-item(v-for="item in viewingCartItems" :key="item.id")
        .cart-item__main
          h4.cart-item__title {{ item.title }}
          p.cart-item__meta {{ item.note || '無備註' }}
          .cart-item__options
            span.cart-item__option(v-for="option in item.options" :key="option") {{ option }}
        .cart-item__side
          .cart-item__stepper
            button.cart-item__stepper-button(type="button" @click="changeQuantity(item.id, -1)") -
            span.cart-item__qty {{ `x${item.quantity}` }}
            button.cart-item__stepper-button(type="button" @click="changeQuantity(item.id, 1)") +
          strong.cart-item__price {{ `$${item.price}` }}
          button.cart-item__edit(type="button" @click="cartStore.openEditor(item)") 編輯

    .cart-summary-card__footer
      p.cart-summary-card__copy(v-if="viewingCart") {{ viewingCart.note }}
      strong.cart-summary-card__total {{ `小計 $${viewingCart?.subtotal || 0}` }}

  section.bottom-action-card
    .bottom-action-card__meta
      span.bottom-action-card__label 購物車狀態
      strong.bottom-action-card__value {{ `${state.carts.length} 個子購物車可合併確認` }}
    button.bottom-action-card__button(type="button" @click="goToConfirmOrder") 確認訂單

  section.feature-card
    h3.feature-card__title 操作提醒
    p.feature-card__copy(v-if="!state.errorMessage")
      | 這個頁面會每 5 秒自動同步一次，避免同桌加點內容過期。
    ul.feature-list
      li 每位顧客可以先整理自己的品項，最後再一起合併送單。
      li 若要修改客製內容，可先在這裡編輯，送出後就會進入廚房流程。
      li 數量減到 0 會自動從子購物車移除。

  section.option-sheet(v-if="state.editor")
    .option-sheet__backdrop(@click="cartStore.closeEditor()")
    .option-sheet__panel
      .option-sheet__head
        .option-sheet__title-block
          h3.option-sheet__title {{ state.editor.title }}
          p.option-sheet__subtitle 編輯購物車品項
        button.option-sheet__close(type="button" @click="cartStore.closeEditor()") 關閉

      section.option-group(v-for="group in state.editor.optionGroups" :key="group.id")
        .option-group__head
          h4.option-group__title {{ group.label }}
          span.option-group__meta {{ group.type === 'single' ? '單選' : '多選' }}
        .option-group__list
          button.option-pill(
            v-for="option in group.options"
            :key="option.id"
            type="button"
            :class="{ 'is-active': hasEditorOption(group.id, option.id) }"
            @click="cartStore.toggleEditorOption({ groupId: group.id, optionId: option.id })"
          )
            span {{ option.label }}
            small(v-if="option.priceDelta > 0") {{ `+$${option.priceDelta}` }}

      section.option-group
        .option-group__head
          h4.option-group__title 備註
          span.option-group__meta 可選填
        textarea.option-note(
          :value="state.editor.note"
          rows="3"
          placeholder="例如：不要香菜、少辣、醬另外放"
          @input="cartStore.setEditorNote($event.target.value)"
        )

      .option-sheet__summary
        .option-sheet__chips
          span.option-sheet__chip(v-for="option in editorSelectedOptions" :key="option.id") {{ option.label }}
        strong.option-sheet__price {{ `$${editorTotalPrice}` }}

      button.option-sheet__submit(type="button" @click="saveEditor") 儲存變更
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.mobile-hero-card
  padding: 20px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(120, 213, 206, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff
  display: grid
  gap: 10px

.mobile-hero-card.is-compact .mobile-hero-card__title
  font-size: 28px

.mobile-hero-card__badge
  width: fit-content
  padding: 6px 12px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.2)
  font-size: 12px
  font-weight: 700

.mobile-hero-card__title
  margin: 0

.mobile-hero-card__copy
  margin: 0
  line-height: 1.6

.cart-switcher
  display: flex
  flex-wrap: wrap
  gap: 10px
  overflow-x: auto

.cart-chip
  border: 0
  border-radius: 18px
  padding: 12px 14px
  background: rgba(255, 255, 255, 0.84)
  color: #5d4a34
  cursor: pointer
  display: grid
  gap: 4px
  min-width: 118px
  text-align: left

.cart-chip.is-active
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff

.cart-chip__title
  font-weight: 700
  display: flex
  align-items: center
  gap: 8px

.cart-chip__pin
  font-size: 11px
  font-weight: 700
  padding: 2px 6px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #356d6e

.cart-chip__meta
  font-size: 12px
  opacity: 0.82

.cart-chip.is-active .cart-chip__pin
  background: rgba(255, 255, 255, 0.22)
  color: #fff

.cart-summary-card,
.feature-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.cart-summary-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  margin-bottom: 14px

.cart-summary-card__title
  margin: 0
  color: var(--dc-text)

.cart-summary-card__tag
  padding: 6px 10px
  border-radius: 999px
  background: var(--dc-mint-3)
  color: #4d7779
  font-size: 12px
  font-weight: 700

.cart-item-list
  display: grid
  gap: 10px

.cart-item
  display: grid
  grid-template-columns: 1fr auto
  gap: 14px
  padding: 14px 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)

.cart-item__main
  display: grid
  gap: 6px

.cart-item__title
  margin: 0
  color: var(--dc-text)
  font-size: 16px

.cart-item__meta
  margin: 0
  color: var(--dc-text-muted)
  font-size: 13px

.cart-item__options
  display: flex
  flex-wrap: wrap
  gap: 6px

.cart-item__option
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #5f7f82
  font-size: 11px
  font-weight: 700

.cart-item__side
  display: grid
  justify-items: end
  align-content: start
  gap: 8px

.cart-item__stepper
  display: flex
  align-items: center
  gap: 6px

.cart-item__stepper-button
  width: 28px
  height: 28px
  border: 0
  border-radius: 50%
  background: rgba(121, 214, 207, 0.16)
  color: #356d6e
  font-weight: 700
  cursor: pointer

.cart-item__qty
  color: var(--dc-text-muted)
  font-size: 13px

.cart-item__price
  color: #22393d
  font-size: 18px

.cart-item__edit
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(121, 214, 207, 0.14)
  color: #356d6e
  font-weight: 700
  cursor: pointer

.cart-summary-card__footer
  margin-top: 14px
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.cart-summary-card__copy
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.7

.cart-summary-card__total
  color: #22393d
  font-size: 22px

.bottom-action-card
  display: grid
  gap: 12px
  padding: 18px
  border-radius: 22px
  background: linear-gradient(180deg, rgba(120, 213, 206, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff

.bottom-action-card__meta
  display: grid
  gap: 4px

.bottom-action-card__label
  font-size: 12px
  letter-spacing: 0.06em
  text-transform: uppercase
  opacity: 0.88

.bottom-action-card__value
  font-size: 18px

.bottom-action-card__button
  border: 0
  border-radius: 16px
  padding: 15px 16px
  background: #fff
  color: #2b6c69
  font-weight: 700
  cursor: pointer

.feature-card__title
  margin: 0 0 10px
  color: var(--dc-text)

.feature-list
  margin: 0
  padding-left: 18px
  color: #53686c
  line-height: 1.8

.option-sheet
  position: fixed
  inset: 0
  z-index: 30
  display: grid
  align-items: end

.option-sheet__backdrop
  position: absolute
  inset: 0
  background: rgba(16, 33, 37, 0.42)

.option-sheet__panel
  position: relative
  display: grid
  gap: 16px
  padding: 20px
  border-radius: 28px 28px 0 0
  background: #fff
  max-height: min(82vh, 760px)
  overflow: auto

.option-sheet__head
  display: flex
  justify-content: space-between
  align-items: start
  gap: 16px

.option-sheet__title
  margin: 0
  color: var(--dc-text)

.option-sheet__subtitle
  margin: 4px 0 0
  color: var(--dc-text-muted)

.option-sheet__close
  border: 0
  border-radius: 999px
  padding: 10px 12px
  background: rgba(121, 214, 207, 0.14)
  color: #356d6e
  cursor: pointer

.option-group
  display: grid
  gap: 10px

.option-group__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.option-group__title
  margin: 0
  color: var(--dc-text)
  font-size: 15px

.option-group__meta
  color: var(--dc-text-muted)
  font-size: 12px

.option-group__list
  display: flex
  flex-wrap: wrap
  gap: 8px

.option-pill
  border: 1px solid var(--dc-border)
  border-radius: 14px
  padding: 10px 12px
  background: #fff
  color: var(--dc-text)
  display: inline-flex
  align-items: center
  gap: 8px
  cursor: pointer

.option-pill.is-active
  border-color: rgba(84, 196, 189, 0.72)
  background: rgba(121, 214, 207, 0.14)

.option-note
  width: 100%
  border: 1px solid var(--dc-border)
  border-radius: 16px
  padding: 12px 14px
  resize: vertical
  font: inherit
  color: var(--dc-text)

.option-sheet__summary
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.option-sheet__chips
  display: flex
  flex-wrap: wrap
  gap: 6px

.option-sheet__chip
  padding: 5px 9px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #4b7375
  font-size: 12px

.option-sheet__price
  color: #22393d
  font-size: 24px

.option-sheet__submit
  border: 0
  border-radius: 18px
  padding: 15px 16px
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff
  font-weight: 700
  cursor: pointer
</style>
