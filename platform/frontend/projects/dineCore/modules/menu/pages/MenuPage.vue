<script setup>
import { computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import world from '@/world.js'
import { useDineCoreOrderingFlow } from '@project/services/dineCoreOrderingFlowService.js'

const route = useRoute()
const orderingFlow = useDineCoreOrderingFlow()

const menuStore = world.hasStore('dineCoreMenuStore') ? world.store('dineCoreMenuStore') : null

const state = computed(() => menuStore?.state || {
  categories: [],
  items: [],
  activeCategoryId: '',
  errorMessage: '',
  optionDraft: null
})
const cartState = orderingFlow.cartState
const entryState = orderingFlow.entryState

const tableCode = computed(() => String(route.params.tableCode || 'A01'))
const hasCartCapability = computed(() => Boolean(world.hasStore('dineCoreCartStore')))
const hasMenuContent = computed(() => state.value.items.length > 0)
const orderingCart = computed(() =>
  cartState.value.carts.find(item => item.id === cartState.value.orderingCartId) || null
)

watch(
  [tableCode, () => entryState.value.orderingSessionToken],
  async ([nextTableCode, orderingSessionToken]) => {
    if (!orderingSessionToken) return

    try {
      await orderingFlow.ensureMenuFlow(nextTableCode)
    } catch (error) {
      console.error('[dineCore/menu] 載入菜單失敗', error)
    }
  },
  { immediate: true }
)

const filteredItems = computed(() => {
  if (state.value.activeCategoryId === 'all') {
    return state.value.items
  }

  if (state.value.activeCategoryId === 'popular') {
    return state.value.items.slice(0, 4)
  }

  if (!state.value.activeCategoryId) {
    return state.value.items
  }

  return state.value.items.filter(item => item.categoryId === state.value.activeCategoryId)
})

const draftSelectedOptions = computed(() => {
  const draft = state.value.optionDraft
  if (!draft) return []

  return draft.optionGroups.flatMap(group =>
    group.options.filter(option => draft.selectedOptionIds.includes(option.id))
  )
})

const draftTotalPrice = computed(() => {
  const basePrice = Number(state.value.optionDraft?.basePrice || 0)
  const extraPrice = draftSelectedOptions.value.reduce(
    (sum, option) => sum + Number(option.priceDelta || 0),
    0
  )

  return basePrice + extraPrice
})

function hasDraftOption(groupId, optionId) {
  const draft = state.value.optionDraft
  if (!draft) return false

  return (
    draft.selectedOptionIds.includes(optionId) &&
    draft.optionGroups.some(group => group.id === groupId)
  )
}

function openDraft(item) {
  if (!menuStore || !hasCartCapability.value) return
  menuStore.openOptionDraft(item)
}

function buildImageStyle(item) {
  if (!item.imageUrl) return null

  return {
    backgroundImage: `url(${item.imageUrl})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center'
  }
}

function confirmAddToCart() {
  const draft = state.value.optionDraft
  if (!draft || !menuStore || !hasCartCapability.value) return

  orderingFlow.addMenuItemToOrderingCart({
    tableCode: tableCode.value,
    menuItemId: draft.menuItemId,
    customization: {
      note: draft.note,
      selectedOptionIds: draft.selectedOptionIds
    }
  })

  menuStore.closeOptionDraft()
}
</script>

<template lang="pug">
.mobile-page
  section.menu-grid(v-if="hasMenuContent")

  section.menu-grid(v-if="hasMenuContent")
    article.menu-card(
      v-for="item in filteredItems"
      :key="item.id"
      :class="`is-${item.tone}`"
    )
      .menu-card__image(:style="buildImageStyle(item)")
        span.menu-card__badge(v-if="item.badge") {{ item.badge }}
        span.menu-card__sold(v-if="item.soldOut") 已售完
      .menu-card__body
        h3.menu-card__title {{ item.title }}
        p.menu-card__meta {{ item.subtitle }}
        .menu-card__tags
          span.menu-card__tag(v-for="tag in item.tags" :key="tag") {{ tag }}
        .menu-card__footer
          strong.menu-card__price {{ `$${item.price}` }}
          button.menu-card__action(
            v-if="hasCartCapability"
            type="button"
            @click="openDraft(item)"
            :disabled="item.soldOut"
          ) 加入購物車

  section.empty-card(v-else)
    h3.empty-card__title 尚無菜單內容
    p.empty-card__text 菜單資料尚未載入，或目前沒有可顯示的商品。

  section.feature-card
    h3.feature-card__title 點餐提醒
    p.feature-card__copy(v-if="orderingCart")
      | 這支手機目前的加點會加入 {{ orderingCart.guestLabel }}。
    ul.feature-list
      li 點選商品可先確認加料、辣度、蔥花等客製選項，再加入購物車。
      li 送單前可於確認訂單頁再次檢查每位顧客的品項與備註。
      li 若桌位暫停接單或商品售完，系統會直接在前台標示。

  section.option-sheet(v-if="state.optionDraft && hasCartCapability")
    .option-sheet__backdrop(@click="menuStore && menuStore.closeOptionDraft()")
    .option-sheet__panel
      .option-sheet__head
        .option-sheet__title-block
          h3.option-sheet__title {{ state.optionDraft.title }}
          p.option-sheet__subtitle {{ `基本價格 $${state.optionDraft.basePrice}` }}
        button.option-sheet__close(type="button" @click="menuStore && menuStore.closeOptionDraft()") 關閉

      section.option-group(v-for="group in state.optionDraft.optionGroups" :key="group.id")
        .option-group__head
          h4.option-group__title {{ group.label }}
          span.option-group__meta {{ group.type === 'single' ? '單選' : '多選' }}
        .option-group__list
          button.option-pill(
            v-for="option in group.options"
            :key="option.id"
            type="button"
            :class="{ 'is-active': hasDraftOption(group.id, option.id) }"
            @click="menuStore && menuStore.toggleDraftOption({ groupId: group.id, optionId: option.id })"
          )
            span {{ option.label }}
            small(v-if="option.priceDelta > 0") {{ `+$${option.priceDelta}` }}

      section.option-group
        .option-group__head
          h4.option-group__title 備註
          span.option-group__meta 可選填
        textarea.option-note(
          :value="state.optionDraft.note"
          rows="3"
          placeholder="例如：不要香菜、湯分開裝、麵體偏硬。"
          @input="menuStore && menuStore.setDraftNote($event.target.value)"
        )

      .option-sheet__summary
        .option-sheet__chips
          span.option-sheet__chip(v-for="option in draftSelectedOptions" :key="option.id") {{ option.label }}
        strong.option-sheet__price {{ `$${draftTotalPrice}` }}

      button.option-sheet__submit(type="button" @click="confirmAddToCart") 加入購物車
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.category-row
  display: inline-flex
  width: 100%
  flex-wrap: nowrap
  gap: 10px
  overflow: auto
  -webkit-overflow-scrolling: touch
  padding-bottom: 4px
  border-bottom: 1px solid rgba(109, 180, 177, 0.18)

.category-row::after
  content: ''
  flex: 0 0 12px

.category-chip
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: transparent
  color: #5f7477
  cursor: pointer
  font-weight: 600
  font-size: 14px
  line-height: 1
  white-space: nowrap
  border-bottom: 2px solid transparent
  transition: color 0.2s ease, border-bottom-color 0.2s ease

.category-chip.is-active
  color: var(--dc-mint-2)
  border-bottom-color: var(--dc-mint-2)

.menu-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.menu-card,
.feature-card,
.empty-card
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.menu-card
  overflow: hidden

.menu-card__image
  aspect-ratio: 1 / 1
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.6), transparent 22%), linear-gradient(135deg, #a6e3c2 0%, #84c08d 100%)
  position: relative
  overflow: hidden

.menu-card.is-green .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.58), transparent 24%), linear-gradient(135deg, #bce6a3 0%, #6eb782 100%)

.menu-card.is-mint .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.58), transparent 24%), linear-gradient(135deg, #b9efe4 0%, #7ecbc0 100%)

.menu-card.is-sand .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.58), transparent 24%), linear-gradient(135deg, #ecd7ad 0%, #d2b38d 100%)

.menu-card.is-cream .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.58), transparent 24%), linear-gradient(135deg, #eee9d6 0%, #d4c9a7 100%)

.menu-card.is-amber .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.58), transparent 24%), linear-gradient(135deg, #f3cf9f 0%, #e6a76f 100%)

.menu-card.is-dark .menu-card__image
  background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.4), transparent 24%), linear-gradient(135deg, #4b5b63 0%, #25363c 100%)

.menu-card__badge,
.menu-card__sold
  position: absolute
  top: 10px
  left: 10px
  padding: 6px 10px
  border-radius: 999px
  font-size: 11px
  font-weight: 700
  color: #fff

.menu-card__badge
  background: rgba(18, 56, 61, 0.65)

.menu-card__sold
  background: rgba(235, 94, 69, 0.88)

.menu-card__body
  padding: 14px
  display: grid
  gap: 8px

.menu-card__title
  margin: 0
  color: var(--dc-text)
  font-size: 16px
  line-height: 1.45

.menu-card__meta
  margin: 0
  color: var(--dc-text-muted)
  font-size: 13px
  line-height: 1.6

.menu-card__tags
  display: flex
  flex-wrap: wrap
  gap: 6px

.menu-card__tag
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #5f7f82
  font-size: 11px
  font-weight: 700

.menu-card__price
  color: #4d5960
  font-size: 20px

.menu-card__footer
  display: flex
  justify-content: space-between
  align-items: center
  gap: 10px

.menu-card__action
  border: 0
  border-radius: 999px
  padding: 9px 12px
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff
  font-size: 12px
  font-weight: 700
  cursor: pointer

.menu-card__action:disabled
  opacity: 0.45
  cursor: not-allowed

.feature-card,
.empty-card
  padding: 18px

.feature-card__title,
.empty-card__title
  margin: 0 0 10px
  color: var(--dc-text)

.empty-card__text
  margin: 0
  color: #53686c
  line-height: 1.7

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

.feature-card__copy
  margin: 0 0 10px
  color: var(--dc-text-muted)
  line-height: 1.7

.option-sheet__backdrop
  position: absolute
  inset: 0
  background: rgba(16, 33, 37, 0.42)
  backdrop-filter: blur(5px)
  
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
  color: #009688
  
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

@media (max-width: 360px)
  .menu-grid
    grid-template-columns: 1fr
</style>
