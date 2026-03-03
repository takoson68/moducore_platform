<script setup>
import { computed, watchEffect } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'

const route = useRoute()
const router = useRouter()
const entryStore = world.store('dineCoreEntryStore')

const tableCode = computed(() => String(route.params.tableCode || 'A01').trim())

watchEffect(() => {
  entryStore.loadTableContext(tableCode.value)
})

const state = computed(() => entryStore.state)

function goToMenu() {
  router.push(`/t/${tableCode.value}/menu`)
}
</script>

<template lang="pug">
.mobile-page
  section.mobile-hero-card
    .mobile-hero-card__badge 掃碼點餐
    h2.mobile-hero-card__title {{ state.tableCode || `${tableCode} 桌` }}
    p.mobile-hero-card__copy
      | 掃描桌邊 QR Code 後可直接開始點餐，不需下載 App，也不需要登入。

  section.quick-stat-grid
    article.stat-soft-card
      span.stat-soft-card__label 用餐模式
      strong.stat-soft-card__value {{ state.dineMode }}
    article.stat-soft-card
      span.stat-soft-card__label 點餐狀態
      strong.stat-soft-card__value {{ state.orderingEnabled ? '開放點餐' : '暫停接單' }}
    article.stat-soft-card
      span.stat-soft-card__label 桌號資訊
      strong.stat-soft-card__value {{ state.tableCode || `${tableCode} 桌` }}

  section.feature-card
    h3.feature-card__title 開始點餐前會確認的事項
    .entry-stage
      .entry-stage__step
        span.entry-stage__index 1
        .entry-stage__copy
          strong 確認桌號
          p 系統會自動帶入桌號，送單後櫃台與廚房會依這個桌號處理訂單。
      .entry-stage__step
        span.entry-stage__index 2
        .entry-stage__copy
          strong 自由加點
          p 每位顧客都可以建立自己的子購物車，最後再一起合單送出，不需要拆帳。
      .entry-stage__step
        span.entry-stage__index 3
        .entry-stage__copy
          strong 櫃台付款
          p 目前採櫃台人工付款確認，送單後可隨時回到追單頁查看進度。

  section.action-card
    .action-card__body
      strong.action-card__title 準備開始點餐
      p.action-card__copy 進入菜單後即可選擇餐點、客製選項與備註，再送出整桌訂單。
    button.action-card__button(type="button" @click="goToMenu") 進入菜單
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
  box-shadow: 0 16px 34px rgba(48, 120, 117, 0.22)

.mobile-hero-card__badge
  width: fit-content
  padding: 6px 12px
  border-radius: 999px
  background: rgba(255, 255, 255, 0.2)
  font-size: 12px
  font-weight: 700

.mobile-hero-card__title
  margin: 0
  font-size: 34px

.mobile-hero-card__copy
  margin: 0
  line-height: 1.6
  opacity: 0.94

.quick-stat-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px

.stat-soft-card, .feature-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.stat-soft-card
  display: grid
  gap: 8px

.stat-soft-card__label
  color: var(--dc-text-muted)
  font-size: 13px

.stat-soft-card__value
  color: var(--dc-text)
  font-size: 18px

.feature-card__title
  margin: 0 0 10px
  color: var(--dc-text)

.entry-stage
  display: grid
  gap: 12px

.entry-stage__step
  display: grid
  grid-template-columns: 36px 1fr
  gap: 12px
  align-items: start
  padding: 12px 0
  border-bottom: 1px solid rgba(91, 127, 130, 0.12)

.entry-stage__step:last-child
  border-bottom: 0

.entry-stage__index
  width: 36px
  height: 36px
  border-radius: 50%
  background: linear-gradient(135deg, var(--dc-mint-1) 0%, var(--dc-mint-2) 100%)
  color: #fff
  display: grid
  place-items: center
  font-weight: 700

.entry-stage__copy
  display: grid
  gap: 4px

.entry-stage__copy strong
  color: var(--dc-text)

.entry-stage__copy p
  margin: 0
  color: #53686c
  line-height: 1.7

.action-card
  padding: 18px
  border-radius: 22px
  background: linear-gradient(180deg, rgba(120, 213, 206, 0.95), rgba(99, 195, 189, 0.98))
  color: #fff
  display: flex
  justify-content: space-between
  align-items: center
  gap: 16px

.action-card__body
  display: grid
  gap: 4px

.action-card__title
  font-size: 18px

.action-card__copy
  margin: 0
  opacity: 0.92
  line-height: 1.6

.action-card__button
  border: 0
  border-radius: 16px
  padding: 14px 18px
  background: #fff
  color: #2b6c69
  font-weight: 700
  cursor: pointer

@media (max-width: 900px)
  .quick-stat-grid
    grid-template-columns: 1fr

  .action-card
    display: grid
</style>
