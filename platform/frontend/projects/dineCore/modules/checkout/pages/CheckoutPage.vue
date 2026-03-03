<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const router = useRouter()
const checkoutStore = world.store('dineCoreCheckoutStore')
const state = computed(() => checkoutStore.state)
const tableCode = computed(() => String(route.params.tableCode || 'A01'))

watchEffect(() => {
  checkoutStore.load(tableCode.value)
})

async function submitOrder() {
  const result = await checkoutStore.submit(tableCode.value)
  router.push(`/t/${tableCode.value}/checkout/success/${result.orderId}`)
}
</script>

<template lang="pug">
.mobile-page
  section.bill-card
    .bill-card__head
      p.bill-card__eyebrow 合併確認
      h2.bill-card__title 確認訂單
      p.bill-card__copy
        | 這一步會把同桌各子購物車合併成一張正式訂單。確認內容正確後，直接送出給店家即可。
    .bill-row
      span.bill-row__label 餐點小計
      strong.bill-row__value {{ state.subtotal }}
    .bill-row
      span.bill-row__label 服務費
      strong.bill-row__value {{ state.serviceFee }}
    .bill-row
      span.bill-row__label 稅額
      strong.bill-row__value {{ state.tax }}
    .bill-row.is-total
      span.bill-row__label 訂單總額
      strong.bill-row__value {{ state.total }}
    button.bill-card__action(type="button" :disabled="state.submitting" @click="submitOrder")
      | {{ state.submitting ? '送單中...' : '送出訂單' }}

  section.person-card
    h3.person-card__title 合併後的子購物車明細
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
    h3.notice-card__title 送單說明
    ul.notice-list
      li 系統不做線上付款，送出後由店家現場處理付款。
      li 送單後，店家就會看到這張合併後的正式訂單。
      li 若仍要修改內容，請在送出前回到購物車調整。
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

.bill-card__copy
  margin: 0
  color: var(--dc-text-muted)
  line-height: 1.7

.bill-card__eyebrow
  margin: 0 0 4px
  color: #72c8c4
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.bill-card__title
  margin: 0
  color: var(--dc-text)

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

.person-card__title,
.notice-card__title
  margin: 0 0 12px
  color: var(--dc-text)

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

.person-item__price
  color: #21373b
  font-size: 16px

.notice-list
  margin: 0
  padding-left: 18px
  color: #53686c
  line-height: 1.8
</style>
