<script setup>
import { computed, reactive, watchEffect } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import { loadCheckoutSuccessSummary } from '../service.js'
import { useDineCoreOrderingFlow } from '@project/services/dineCoreOrderingFlowService.js'

const route = useRoute()
const orderingFlow = useDineCoreOrderingFlow()
const entryState = orderingFlow.entryState

const statusLabels = {
  pending: '待製作',
  preparing: '製作中',
  ready: '可取餐',
  picked_up: '已取餐',
  cancelled: '已取消'
}

const summary = reactive({
  orderId: String(route.params.orderId || ''),
  orderNo: '',
  tableCode: 'A01',
  status: 'pending',
  paymentMethod: '現場付款',
  estimatedWaitMinutes: 15,
  persons: [],
  batches: [],
  latestSubmittedBatch: null
})

const submittedBatchNo = computed(() => Number(route.query.submittedBatchNo || 0))
const nextBatchNo = computed(() => Number(route.query.nextBatchNo || 0))

const latestBatch = computed(() => {
  if (summary.latestSubmittedBatch) return summary.latestSubmittedBatch
  if (!Array.isArray(summary.batches)) return null

  const submitted = summary.batches.filter(batch => batch.status !== 'draft')
  return submitted.length > 0 ? submitted[submitted.length - 1] : null
})

const latestBatchPersonCount = computed(() =>
  Array.isArray(latestBatch.value?.persons) ? latestBatch.value.persons.length : 0
)

watchEffect(async () => {
  const payload = await loadCheckoutSuccessSummary(
    String(route.params.tableCode || summary.tableCode || ''),
    String(route.params.orderId || ''),
    submittedBatchNo.value,
    String(entryState.value.orderingSessionToken || '')
  )

  summary.orderId = String(payload.orderId || route.params.orderId || '')
  summary.orderNo = payload.orderNo || ''
  summary.tableCode = payload.tableCode || String(route.params.tableCode || 'A01')
  summary.status = payload.status || 'pending'
  summary.paymentMethod = payload.paymentMethod || '現場付款'
  summary.estimatedWaitMinutes = Number(payload.estimatedWaitMinutes || 0)
  summary.persons = Array.isArray(payload.persons) ? payload.persons : []
  summary.batches = Array.isArray(payload.batches) ? payload.batches : []
  summary.latestSubmittedBatch = payload.latestSubmittedBatch || null
})
</script>

<template lang="pug">
.mobile-page
  section.success-card
    .success-card__badge 送單成功
    h2.success-card__title {{ latestBatch?.batchNo ? `第 ${latestBatch.batchNo} 批已送出` : '訂單已成功送出' }}
    .success-card__actions
      RouterLink.success-card__ghost(:to="`/t/${summary.tableCode}/menu`") 返回菜單
      RouterLink.success-card__primary(:to="`/t/${summary.tableCode}/order/${summary.orderId}`") 前往追蹤
    p.success-card__order {{ `訂單編號：${summary.orderNo || summary.orderId}` }}
    p.success-card__copy
      | 廚房已收到你的訂單，請留意叫號與取餐通知。你也可以回到菜單繼續加點，新品項會進入下一批次。

  section.summary-card
    .summary-card__row(v-if="latestBatch?.batchNo")
      span.summary-card__label 本次批次
      strong.summary-card__value {{ `第 ${latestBatch.batchNo} 批` }}
    .summary-card__row(v-if="latestBatch")
      span.summary-card__label 本次品項
      strong.summary-card__value {{ `${latestBatch.itemCount || 0} 項` }}
    .summary-card__row(v-if="latestBatch")
      span.summary-card__label 本次金額
      strong.summary-card__value {{ `$${latestBatch.subtotal || 0}` }}
    .summary-card__row
      span.summary-card__label 桌號
      strong.summary-card__value {{ summary.tableCode }}
    .summary-card__row
      span.summary-card__label 訂單狀態
      strong.summary-card__value {{ statusLabels[summary.status] || summary.status }}
    .summary-card__row
      span.summary-card__label 預估等待
      strong.summary-card__value {{ `${summary.estimatedWaitMinutes} 分鐘` }}
    .summary-card__row
      span.summary-card__label 付款方式
      strong.summary-card__value {{ summary.paymentMethod === 'onsite' ? '現場付款' : summary.paymentMethod }}
    .summary-card__row(v-if="latestBatchPersonCount > 0")
      span.summary-card__label 本批人數
      strong.summary-card__value {{ `${latestBatchPersonCount} 位` }}

  section.person-card
    h3.person-card__title 本批明細
    p.person-card__intro(v-if="latestBatch") {{ `以下是第 ${latestBatch.batchNo} 批次送出的內容。` }}
    p.person-card__intro(v-else) 目前尚未取得本批次明細。
    .person-list
      article.person-panel(v-for="person in latestBatch?.persons || []" :key="person.cartId")
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
      p.person-card__empty(v-if="(latestBatch?.persons || []).length === 0") 本批沒有可顯示的項目。

  section.next-card
    h3.next-card__title 下一步
    .next-card__list
      .next-card__item
        strong 1. 可回菜單繼續加點
        p 新增的品項會建立在下一批次，不會影響剛送出的這一批。
      .next-card__item
        strong 2. 可查看訂單追蹤
        p {{ nextBatchNo > 0 ? `你目前可繼續新增品項到第 ${nextBatchNo} 批。` : '你可以前往追蹤頁查看廚房處理進度。' }}
      .next-card__item
        strong 3. 等待叫號取餐
        p 若狀態變成「可取餐」，請依店員指示前往取餐。
</template>

<style lang="sass">
.mobile-page
  display: grid
  gap: 14px

.success-card
  padding: 22px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(120, 213, 206, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff
  display: grid
  gap: 10px

.success-card__badge
  width: fit-content
  padding: 6px 12px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.22)
  font-size: 12px
  font-weight: 700

.success-card__title
  margin: 0
  font-size: 30px

.success-card__actions
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 10px
  margin-top: 4px

.success-card__ghost,
.success-card__primary
  display: grid
  place-items: center
  padding: 12px
  border-radius: 14px
  text-decoration: none
  font-weight: 700

.success-card__ghost
  background: rgba(255, 255, 255, 0.22)
  color: #fff
  border: 1px solid rgba(255, 255, 255, 0.34)

.success-card__primary
  background: #fff
  color: #2b7d78

.success-card__copy,
.success-card__order
  margin: 0
  line-height: 1.7

.summary-card,
.next-card,
.person-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.summary-card
  display: grid
  gap: 10px

.summary-card__row
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  padding: 10px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.summary-card__row:last-child
  border-bottom: 0

.summary-card__label
  color: var(--dc-text-muted)

.summary-card__value
  color: var(--dc-text)

.person-card__title,
.next-card__title
  margin: 0 0 12px
  color: var(--dc-text)

.person-card__intro,
.person-card__empty
  margin: 0 0 12px
  color: var(--dc-text-muted)
  line-height: 1.7

.person-list,
.next-card__list
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

.next-card__item
  padding: 14px 16px
  border-radius: 18px
  background: linear-gradient(180deg, #ffffff 0%, #f5faf9 100%)
  display: grid
  gap: 6px

.next-card__item strong
  color: var(--dc-text)

.next-card__item p
  margin: 0
  color: #53686c
  line-height: 1.7
</style>
