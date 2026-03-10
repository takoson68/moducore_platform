<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import world from '@/world.js'
import { recordVisitorEntry } from '../../visitor-stats/service.js'

const route = useRoute()
const router = useRouter()
const entryStore = world.store('dineCoreEntryStore')
const state = computed(() => entryStore.state)

const tableCode = computed(() => String(route.params.tableCode || 'A01').trim())
const entryHeroImageCandidates = [
  import.meta.env.VITE_DINECORE_ENTRY_HERO_IMAGE_URL || '',
  'https://images.pexels.com/photos/6287495/pexels-photo-6287495.jpeg',
  '/assets/dinecore/entry-landing-food.png',
  '/assets/dinecore/entry-landing-food.jpg',
  '/assets/icons/moducore_platform.jpg'
].filter(Boolean)
const entryHeroImageUrl = ref(entryHeroImageCandidates[0] || '')

function handleEntryHeroImageError() {
  const currentIndex = entryHeroImageCandidates.indexOf(entryHeroImageUrl.value)
  const nextImage = entryHeroImageCandidates[currentIndex + 1] || ''
  if (nextImage && nextImage !== entryHeroImageUrl.value) {
    entryHeroImageUrl.value = nextImage
  }
}

function goToMenu() {
  router.push(`/t/${tableCode.value}/menu`)
}

onMounted(() => {
  if (route.path !== '/') return

  recordVisitorEntry({
    path: route.path,
    search: typeof window === 'undefined' ? '' : window.location.search
  }).catch(() => {})
})
</script>

<template lang="pug">
.mobile-page
  section.mobile-hero-card
    .mobile-hero-card__badge 掃碼點餐
    .mobile-hero-card__title-row
      h2.mobile-hero-card__title
        | {{ state.tableCode || (tableCode + ' 桌') }}
        span.mobile-hero-card__identity(v-if="state.orderingLabel") {{ `｜本機身分碼 ${state.orderingLabel}` }}
      button.mobile-hero-card__button(type="button" @click="goToMenu") 進入菜單

  section.entry-photo-card
    img.entry-photo-card__image(
      :src="entryHeroImageUrl"
      alt="本店主打餐點示意圖"
      loading="eager"
      decoding="async"
      @error="handleEntryHeroImageError"
    )

  section.feature-card
    h3.feature-card__title 開始點餐前會確認的事項
    p.feature-card__error(v-if="state.errorMessage") {{ state.errorMessage }}
    .entry-stage
      .entry-stage__step
        span.entry-stage__index 1
        .entry-stage__copy
          strong 確認桌號
          p 系統會自動帶入桌號，送單後櫃台與廚房會依這個桌號處理訂單。
      .entry-stage__step
        span.entry-stage__index 2
        .entry-stage__copy
          strong 選擇品項
          p 可在菜單中調整數量、客製規格與備註，送單前都能回到購物車修改。
      .entry-stage__step
        span.entry-stage__index 3
        .entry-stage__copy
          strong 送出訂單
          p 結帳前會先檢查內容與金額，確認後送出，櫃台就會收到你的點餐單。

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
  flex: 1

.mobile-hero-card__identity
  margin-left: 8px
  font-size: 18px
  font-weight: 700
  opacity: 0.92

.mobile-hero-card__title-row
  display: flex
  align-items: center
  justify-content: center
  gap: 14px
  flex-direction: column
  text-align: center

.feature-card
  padding: 18px
  border-radius: 22px
  background: var(--dc-card)
  border: 1px solid var(--dc-border)

.entry-photo-card
  border-radius: 22px
  overflow: hidden
  border: 1px solid var(--dc-border)
  background: #fff

.entry-photo-card__image
  display: block
  width: 100%
  aspect-ratio: 16 / 10
  object-fit: cover

.feature-card__title
  margin: 0 0 10px
  color: var(--dc-text)

.feature-card__error
  margin: 0 0 12px
  padding: 12px 14px
  border-radius: 14px
  background: rgba(216, 111, 89, 0.1)
  color: #9d4737
  line-height: 1.6

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

.mobile-hero-card__button
  border: 0
  border-radius: 16px
  padding: 16px 22px
  background: #fff
  color: #2b6c69
  font-size: 16px
  font-weight: 700
  cursor: pointer
  width: 100%
  text-align: center

@media (max-width: 900px)
</style>
