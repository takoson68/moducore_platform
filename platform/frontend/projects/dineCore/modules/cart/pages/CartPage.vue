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
const pollIntervalMs = 5000
let pollTimer = null

async function refreshCart() {
  if (!entryState.value.orderingSessionToken) return

  await cartStore.load({
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
    refreshCart()
  }, pollIntervalMs)
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
const hasCheckoutItems = computed(() =>
  state.value.carts.some(cart => Number(cart.itemCount || 0) > 0)
)
const submittedBatchCount = computed(() => Math.max(Number(state.value.currentBatchNo || 0) - 1, 0))
const currentBatchLabel = computed(() => {
  const batchNo = Number(state.value.currentBatchNo || 0)
  return batchNo > 0 ? `第 ${batchNo} 批餐點` : '本批餐點'
})

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

async function removeItem(cartItemId, quantity) {
  const safeQuantity = Number(quantity || 0)
  if (safeQuantity <= 0) return

  await changeQuantity(cartItemId, -safeQuantity)
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
  if (!hasCheckoutItems.value) return
  router.push(`/t/${tableCode.value}/checkout`)
}
</script>

<template lang="pug">
.mobile-page
  section.mobile-hero-card.is-compact
    .mobile-hero-card__badge 購物車
    h2.mobile-hero-card__title {{ currentBatchLabel }}
    p.mobile-hero-card__copy(v-if="state.currentBatchNo > 0") {{ `你現在編輯的是第 ${state.currentBatchNo} 批，送出後這一批就會鎖定。` }}
    p.mobile-hero-card__copy(v-if="submittedBatchCount > 0") {{ `前面已送出 ${submittedBatchCount} 批，新的加點不會混進上一批。` }}
    p.mobile-hero-card__copy(v-if="orderingCart") {{ `本機顧客身份：${orderingCart.guestLabel}` }}
    p.mobile-hero-card__copy 系統會持續同步共桌點餐狀態；若其他顧客先送單，這裡會自動切到新的空白批次。

  section.feature-card.is-error(v-if="state.errorMessage")
    h3.feature-card__title 發生問題
    p.feature-card__copy {{ state.errorMessage }}

  section.cart-switcher
    button.cart-chip(
      v-for="cart in state.carts"
      :key="cart.id"
      type="button"
      :class="{ 'is-active': state.viewingCartId === cart.id }"
      @click="cartStore.setViewingCart(cart.id)"
    )
      span.cart-chip__title {{ cart.guestLabel }}
      small.cart-chip__pin(v-if="state.orderingCartId === cart.id") 本機
      span.cart-chip__meta {{ `${cart.itemCount} 項 / $${cart.subtotal}` }}

  section.cart-summary-card
    .cart-summary-card__head
      h3.cart-summary-card__title {{ viewingCart?.guestLabel || '尚未選擇共桌購物車' }}
      span.cart-summary-card__tag {{ state.currentBatchStatus || 'draft' }}

    .cart-empty(v-if="viewingCartItems.length === 0")
      p.cart-empty__text 這位顧客在目前批次還沒有品項。
    .cart-item-list(v-else)
      article.cart-item(v-for="item in viewingCartItems" :key="item.id")
        button.cart-item__remove(type="button" @click="removeItem(item.id, item.quantity)") 取消
        .cart-item__main
          h4.cart-item__title {{ item.title }}
          p.cart-item__meta {{ item.note || '無備註' }}
          .cart-item__options(v-if="item.options?.length")
            span.cart-item__option(v-for="option in item.options" :key="option") {{ option }}
        .cart-item__side
          .cart-item__stepper
            button.cart-item__stepper-button(type="button" @click="changeQuantity(item.id, -1)") -
            span.cart-item__qty {{ `x${item.quantity}` }}
            button.cart-item__stepper-button(type="button" @click="changeQuantity(item.id, 1)") +
          strong.cart-item__price {{ `$${item.price}` }}
          button.cart-item__edit(type="button" @click="cartStore.openEditor(item)") 編輯

    .cart-summary-card__footer
      strong.cart-summary-card__total {{ `小計 $${viewingCart?.subtotal || 0}` }}

  section.bottom-action-card
    .bottom-action-card__meta
      span.bottom-action-card__label 正在共桌點餐
      strong.bottom-action-card__value {{ `${state.participantCount} 位顧客可一起送出這一批` }}
      p.bottom-action-card__hint 進入下一步後，你會先確認這一批餐點；送出後系統會自動開啟下一批加點。
    button.bottom-action-card__button(type="button" :disabled="!hasCheckoutItems" @click="goToConfirmOrder") 確認本批餐點

  section.feature-card
    h3.feature-card__title 批次提醒
    p.feature-card__copy 系統每 5 秒檢查一次。如果其他顧客先送單，這裡會自動切到新的空白批次，避免新的加點混進已送出的餐點。

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
          span.option-group__meta 可留空
        textarea.option-note(
          :value="state.editor.note"
          rows="3"
          placeholder="例如：少冰、去蔥、餐後再上"
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

.feature-card,
.cart-summary-card,
.bottom-action-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.feature-card__title
  margin: 0 0 8px

.feature-card__copy
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.7

.feature-card.is-error
  border-color: rgba(220, 104, 89, 0.32)
  background: rgba(255, 237, 232, 0.9)

.cart-switcher
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 10px

.cart-chip
  min-width: 0
  min-height: 88px
  border: 0
  border-radius: 18px
  padding: 12px 14px
  background: rgba(255, 255, 255, 0.84)
  color: #5d4a34
  cursor: pointer
  display: grid
  grid-template-rows: auto auto 1fr
  align-content: start
  gap: 6px
  text-align: left

.cart-chip.is-active
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff

.cart-chip__title
  font-weight: 700
  line-height: 1.4

.cart-chip__pin
  width: fit-content
  font-size: 11px
  padding: 2px 6px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.22)

.cart-chip__meta
  font-size: 12px
  opacity: 0.82

.cart-summary-card
  display: grid
  gap: 14px

.cart-summary-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.cart-summary-card__title
  margin: 0

.cart-summary-card__tag
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #4d7678
  font-size: 12px
  font-weight: 700

.cart-empty
  padding: 20px
  border-radius: 18px
  background: rgba(121, 214, 207, 0.08)

.cart-empty__text
  margin: 0
  color: var(--dc-text-muted)

.cart-item-list
  display: grid
  gap: 12px

.cart-item
  padding: 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)
  display: flex
  justify-content: space-between
  gap: 16px
  position: relative

.cart-item__main
  display: grid
  gap: 8px

.cart-item__title
  margin: 0

.cart-item__meta
  margin: 0
  color: var(--dc-text-muted)

.cart-item__options
  display: flex
  flex-wrap: wrap
  gap: 6px

.cart-item__option
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #4d7678
  font-size: 11px
  font-weight: 700

.cart-item__side
  display: grid
  gap: 10px
  justify-items: end

.cart-item__stepper
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.12)

.cart-item__stepper-button
  border: 0
  background: transparent
  font-size: 18px
  cursor: pointer

.cart-item__qty
  min-width: 42px
  text-align: center
  font-weight: 700

.cart-item__price
  font-size: 18px
  color: #21373b

.cart-item__edit
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(93, 189, 184, 0.14)
  color: #356d6e
  font-weight: 700
  cursor: pointer

.cart-item__remove
  position: absolute
  top: 14px
  right: 14px
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(220, 104, 89, 0.14)
  color: #a44b3d
  font-size: 12px
  font-weight: 700
  cursor: pointer

.cart-summary-card__footer
  display: flex
  justify-content: flex-end

.cart-summary-card__total
  font-size: 20px
  color: #20373b

.bottom-action-card
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.bottom-action-card__meta
  display: grid
  gap: 4px

.bottom-action-card__label
  color: var(--dc-text-muted)
  font-size: 13px

.bottom-action-card__value
  color: #20373b
  font-size: 18px
  font-weight: 700

.bottom-action-card__hint
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.6

.bottom-action-card__button
  border: 0
  border-radius: 16px
  padding: 14px 18px
  background: linear-gradient(180deg, #2dc762, #24ba59)
  color: #fff
  font-size: 15px
  font-weight: 700
  cursor: pointer

.bottom-action-card__button:disabled
  background: #cfd8d6
  color: #7a8784
  cursor: not-allowed

.option-sheet
  position: fixed
  inset: 0
  z-index: 30

.option-sheet__backdrop
  position: absolute
  inset: 0
  background: rgba(16, 29, 34, 0.42)
  backdrop-filter: blur(5px)

.option-sheet__panel
  position: absolute
  left: 0
  right: 0
  bottom: 0
  max-height: 88vh
  overflow: auto
  border-radius: 24px 24px 0 0
  background: #fff
  padding: 20px
  display: grid
  gap: 16px

.option-sheet__head
  display: flex
  justify-content: space-between
  gap: 12px

.option-sheet__title
  margin: 0

.option-sheet__subtitle
  margin: 6px 0 0
  color: var(--dc-text-muted)

.option-sheet__close
  border: 0
  background: transparent
  color: var(--dc-text-muted)
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

.option-group__meta
  color: var(--dc-text-muted)
  font-size: 12px

.option-group__list
  display: flex
  flex-wrap: wrap
  gap: 10px

.option-pill
  border: 1px solid rgba(121, 214, 207, 0.28)
  border-radius: 999px
  padding: 9px 12px
  background: #fff
  display: inline-flex
  align-items: center
  gap: 6px
  cursor: pointer

.option-pill.is-active
  border-color: transparent
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff
  color: #009688
  
.option-note
  width: 100%
  border: 1px solid rgba(97, 129, 131, 0.2)
  border-radius: 14px
  padding: 12px
  resize: vertical
  font: inherit

.option-sheet__summary
  display: grid
  gap: 12px

.option-sheet__chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.option-sheet__chip
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.16)
  color: #4d7678
  font-size: 11px
  font-weight: 700

.option-sheet__price
  font-size: 20px
  color: #20373b

.option-sheet__submit
  border: 0
  border-radius: 16px
  padding: 14px
  background: linear-gradient(180deg, #2dc762, #24ba59)
  color: #fff
  font-weight: 700
  cursor: pointer

@media (max-width: 720px)
  .cart-switcher
    grid-template-columns: repeat(3, minmax(0, 1fr))

@media (max-width: 520px)
  .bottom-action-card
    display: grid

  .cart-item
    flex-direction: column
    align-items: stretch

  .cart-item__side
    justify-items: start
</style>
