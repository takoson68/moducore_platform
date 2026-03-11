<script setup>
import { computed, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'
import { useDineCoreOrderingFlow } from '@project/services/dineCoreOrderingFlowService.js'

const route = useRoute()
const router = useRouter()
const orderingFlow = useDineCoreOrderingFlow()
const cartStore = world.store('dineCoreCartStore')

const state = computed(() => cartStore.state)
const entryState = orderingFlow.entryState
const tableCode = computed(() => String(route.params.tableCode || 'A01'))

watch(
  [tableCode, () => entryState.value.orderingSessionToken],
  ([, orderingSessionToken]) => {
    if (!orderingSessionToken) return

    orderingFlow.syncCartFromEntry(tableCode.value)
  },
  { immediate: true }
)

const orderingCart = computed(() =>
  state.value.carts.find(item => item.id === state.value.orderingCartId) || null
)

const viewingCart = computed(() => orderingCart.value)

const viewingCartItems = computed(() => {
  const cartId = String(viewingCart.value?.id || state.value.orderingCartId || '')
  const rows = Array.isArray(state.value.cartItemsByCartId[cartId])
    ? [...state.value.cartItemsByCartId[cartId]]
    : []

  rows.sort((a, b) => String(b?.id || '').localeCompare(String(a?.id || '')))
  return rows
})

const hasCheckoutItems = computed(() => Number(viewingCart.value?.itemCount || 0) > 0)

const currentBatchLabel = computed(() => {
  const batchNo = Number(state.value.currentBatchNo || 0)
  return batchNo > 0 ? `第 ${batchNo} 批次` : '尚未送單'
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
  const cartId = String(viewingCart.value?.id || state.value.orderingCartId || '')
  if (!cartId) return

  cartStore.changeItemQuantity({
    tableCode: tableCode.value,
    cartId,
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
  cartStore.saveEditor({
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
  section.cart-hero
    .cart-hero__chip 購物車
    h2.cart-hero__title 我的點餐清單
    p.cart-hero__meta {{ currentBatchLabel }}
    p.cart-hero__meta(v-if="orderingCart") {{ `身份：${orderingCart.guestLabel}` }}

  section.notice-card.is-error(v-if="state.errorMessage")
    p.notice-card__text {{ state.errorMessage }}

  section.cart-card
    .cart-card__head
      h3.cart-card__title 目前品項
      span.cart-card__subtotal(v-if="viewingCart") {{ `小計 $${viewingCart.subtotal || 0}` }}

    .cart-empty(v-if="viewingCartItems.length === 0")
      p.cart-empty__title 還沒有加入任何餐點
      p.cart-empty__text 請回到菜單頁選擇商品後再送單。

    .item-list(v-else)
      article.item-card(v-for="item in viewingCartItems" :key="item.id")
        .item-card__main
          .item-card__title-row
            strong.item-card__title {{ item.title }}
            .item-card__qty
              button.item-card__qty-btn(type="button" @click="changeQuantity(item.id, -1)") -
              span.item-card__qty-value {{ `${item.quantity}` }}
              button.item-card__qty-btn(type="button" @click="changeQuantity(item.id, 1)") +
          .item-card__spec(v-if="item.options?.length")
            span.item-card__spec-label 規格：
            span.item-card__spec-values
              span.item-card__option(v-for="option in item.options" :key="option") {{ option }}
          p.item-card__note(v-if="item.note") {{ item.note }}
        .item-card__footer
          .item-card__actions
            button.item-card__action.item-card__action--edit(type="button" @click="cartStore.openEditor(item)") 編輯規格
            button.item-card__action.is-danger(type="button" @click="removeItem(item.id, item.quantity)") 刪除
          .item-card__pricing
            span.item-card__unit {{ `單價 $${item.price}` }}
            strong.item-card__subtotal {{ `小計 $${item.price * item.quantity}` }}

  section.checkout-card
    .checkout-card__meta
      span.checkout-card__label 目前合計
      strong.checkout-card__value {{ `$${viewingCart?.subtotal || 0}` }}
    button.checkout-card__button(type="button" :disabled="!hasCheckoutItems" @click="goToConfirmOrder") 前往結帳

  section.option-sheet(v-if="state.editor")
    .option-sheet__backdrop(@click="cartStore.closeEditor()")
    .option-sheet__panel
      h3.option-sheet__title {{ state.editor.title }}
      section.option-group(v-for="group in state.editor.optionGroups" :key="group.id")
        h4.option-group__title {{ group.label }}
        .option-group__list
          button.option-pill(
            v-for="option in group.options"
            :key="option.id"
            type="button"
            :class="{ 'is-active': hasEditorOption(group.id, option.id) }"
            @click="cartStore.toggleEditorOption({ groupId: group.id, optionId: option.id })"
          ) {{ option.label }} {{ option.priceDelta > 0 ? `+$${option.priceDelta}` : '' }}
      textarea.option-note(
        :value="state.editor.note"
        rows="3"
        placeholder="可填寫口味或備註"
        @input="cartStore.setEditorNote($event.target.value)"
      )
      p.option-sheet__price {{ `調整後單價：$${editorTotalPrice}` }}
      .option-sheet__actions
        button.option-sheet__btn(type="button" @click="cartStore.closeEditor()") 取消
        button.option-sheet__btn.is-primary(type="button" @click="saveEditor") 儲存
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px
  padding-bottom: 96px

.cart-hero
  padding: 20px
  border-radius: 22px
  background: linear-gradient(155deg, #113f47 0%, #1f6975 55%, #2e8a8e 100%)
  color: #f7ffff
  display: grid
  gap: 8px
  box-shadow: 0 18px 32px rgba(22, 63, 71, 0.24)

.cart-hero__chip
  width: fit-content
  padding: 6px 10px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.18)
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.04em

.cart-hero__title
  margin: 0
  font-size: 30px
  line-height: 1.15

.cart-hero__meta
  margin: 0
  color: rgba(247, 255, 255, 0.9)
  line-height: 1.6

.notice-card
  border-radius: 16px
  padding: 14px 16px
  border: 1px solid #efbdb4
  background: #fff1ee

.notice-card__text
  margin: 0
  color: #9a3f32
  line-height: 1.5

.cart-card
  background: #ffffff
  border: 1px solid #d9ece8
  border-radius: 20px
  padding: 16px
  display: grid
  gap: 12px
  box-shadow: 0 10px 22px rgba(64, 111, 113, 0.08)

.cart-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

.cart-card__title
  margin: 0

.cart-card__subtotal
  margin: 0
  color: #2a6469
  font-weight: 700

.cart-empty
  border: 1px dashed #bdd9d3
  border-radius: 14px
  padding: 14px
  background: #f6fbfa
  display: grid
  gap: 6px

.cart-empty__title
  margin: 0
  color: #335c5f
  font-weight: 700

.cart-empty__text
  margin: 0
  color: #6f8689
  line-height: 1.6

.item-list
  display: grid
  gap: 10px

.item-card
  padding: 12px
  border-radius: 12px
  border: 1px solid #e0efec
  background: linear-gradient(180deg, #ffffff 0%, #f8fcfb 100%)
  display: grid
  gap: 8px

.item-card__main
  min-width: 0

.item-card__title-row
  display: flex
  align-items: center
  justify-content: space-between
  gap: 8px
  min-width: 0
  border: 1px solid #e2efed
  border-radius: 10px
  padding: 8px 10px
  background: #fbfefd

.item-card__title
  line-height: 1.45
  min-width: 0
  flex: 1

.item-card__note
  margin: 4px 0 0
  color: #607679
  border: 1px solid #e2efed
  border-radius: 10px
  padding: 8px 10px
  background: #fbfefd

.item-card__spec
  display: flex
  align-items: center
  gap: 4px
  margin-top: 4px
  border: 1px solid #e2efed
  border-radius: 10px
  padding: 6px 10px
  background: #fbfefd

.item-card__spec-label
  color: #5f7c7f
  font-size: 11px
  white-space: nowrap

.item-card__spec-values
  display: flex
  flex-wrap: wrap
  gap: 4px

.item-card__option
  padding: 3px 7px
  border-radius: 999px
  background: #edf8f6
  font-size: 11px
  color: #44686a

.item-card__footer
  display: flex
  justify-content: space-between
  align-items: end
  gap: 8px

.item-card__pricing
  display: grid
  justify-items: end
  gap: 1px

.item-card__unit
  color: #70888b
  font-size: 11px

.item-card__subtotal
  color: #1f4044
  font-size: 16px

.item-card__qty
  display: flex
  gap: 4px
  align-items: center
  border-radius: 999px
  padding: 3px
  background: #ecf7f5

.item-card__qty-btn
  width: 24px
  height: 24px
  border: 0
  border-radius: 999px
  background: #fff
  color: #245f63
  font-size: 14px
  font-weight: 700
  cursor: pointer
  box-shadow: 0 2px 8px rgba(43, 96, 99, 0.12)

.item-card__qty-value
  min-width: 30px
  text-align: center
  font-weight: 700
  color: #356466
  font-size: 13px

.item-card__actions
  display: flex
  justify-content: center
  align-items: center
  gap: 8px
  width: 100%

.item-card__action
  border: 0
  border-radius: 999px
  padding: 6px 9px
  background: #e6f4f1
  color: #2e676a
  font-weight: 700
  font-size: 11px
  cursor: pointer
  justify-self: center

.item-card__action--edit
  justify-self: center

.item-card__action.is-danger
  background: #ffeceb
  color: #a64a3a

@media (max-width: 520px)
  .item-card__footer
    align-items: start
    flex-direction: column

  .item-card__pricing
    justify-items: start

.checkout-card
  position: fixed
  left: 12px
  right: 12px
  bottom: 12px
  z-index: 25
  border-radius: 16px
  border: 1px solid #d4ebe6
  background: rgba(255, 255, 255, 0.94)
  backdrop-filter: blur(8px)
  box-shadow: 0 14px 30px rgba(37, 76, 78, 0.2)
  padding: 10px
  display: grid
  grid-template-columns: minmax(0, 1fr) auto
  gap: 10px
  align-items: center

.checkout-card__meta
  display: grid
  gap: 2px
  padding-left: 4px

.checkout-card__label
  color: #6a8183
  font-size: 12px

.checkout-card__value
  color: #1f3e42
  font-size: 22px

.checkout-card__button
  border: 0
  border-radius: 12px
  padding: 13px 18px
  background: linear-gradient(180deg, #2dc762 0%, #24ba59 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.checkout-card__button:disabled
  background: #cfd8d6
  color: #798582
  cursor: not-allowed

.option-sheet
  position: fixed
  inset: 0
  z-index: 30

.option-sheet__backdrop
  position: absolute
  inset: 0
  background: rgba(0, 0, 0, 0.36)

.option-sheet__panel
  position: absolute
  left: 0
  right: 0
  bottom: 0
  background: #ffffff
  border-radius: 18px 18px 0 0
  padding: 16px
  display: grid
  gap: 12px
  max-height: 85vh
  overflow: auto

.option-sheet__title
  margin: 0
  color: #23464a

.option-group
  display: grid
  gap: 8px

.option-group__title
  margin: 0
  color: #34595d
  font-size: 14px

.option-group__list
  display: flex
  gap: 8px
  flex-wrap: wrap

.option-pill
  border: 0
  border-radius: 999px
  padding: 8px 10px
  background: #eef7f6
  color: #2f5f63
  cursor: pointer

.option-pill.is-active
  background: #daf3ee
  color: #155f5f
  font-weight: 700

.option-note
  width: 100%
  border: 1px solid #d7e7e4
  border-radius: 12px
  padding: 10px 12px
  resize: vertical
  font: inherit
  color: #294c50

.option-sheet__price
  margin: 0
  color: #214144
  font-weight: 700

.option-sheet__actions
  display: flex
  justify-content: end
  gap: 8px

.option-sheet__btn
  border: 0
  border-radius: 10px
  padding: 10px 14px
  background: #edf5f4
  color: #315b5f
  font-weight: 700
  cursor: pointer

.option-sheet__btn.is-primary
  background: linear-gradient(180deg, #2dc762 0%, #24ba59 100%)
  color: #fff

@media (min-width: 860px)
  .checkout-card
    position: sticky
    left: auto
    right: auto
    bottom: 0
</style>
