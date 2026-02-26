<script setup>
import { useIdentity } from '@project/composables/useIdentity.js'

const { isLoggedIn, identity } = useIdentity()
</script>

<template lang="pug">
.guest-home
  section.hero-card
    p.eyebrow(v-if="isLoggedIn && identity") 已登入：{{ identity.displayName }}
    p.eyebrow(v-else) 訪客模式首頁
    h2.title {{ isLoggedIn ? '登入完成，前往任務頁開始整理' : '先登入，再開始今天的任務整理' }}
    p.desc(v-if="isLoggedIn")
      | 你已完成身份設定。系統將使用 local-first 方式保存任務資料。
    p.desc(v-else)
      | 使用右上角登入元件輸入顯示名稱。若不登入，也可以直接進入任務頁開始使用。
    .hero-actions
      RouterLink.primary-link(to="/tasks") 前往任務頁
      p.tip 使用右上登入元件登入 / 登出
</template>

<style lang="sass">
.guest-home
  --space-2: 0.75rem
  --space-3: 1rem
  --space-4: 1.25rem
  --radius-2: 1rem
  --border-color: rgba(36, 42, 54, 0.08)
  display: grid
  gap: var(--space-3)
  max-width: 48rem

.hero-card
  background: rgba(255, 255, 255, 0.76)
  border: 1px solid var(--border-color)
  border-radius: var(--radius-2)
  padding: var(--space-4)
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75)
  display: grid
  gap: 0.65rem

.eyebrow
  margin: 0
  color: #6c7387
  font-size: 0.85rem
  font-weight: 600

.title
  margin: 0
  color: #242938
  font-size: 1.4rem

.desc
  margin: 0
  color: #6c7387
  line-height: 1.55

.hero-actions
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: 0.65rem

.primary-link
  text-decoration: none
  border-radius: 999px
  background: linear-gradient(135deg, #c7b4e2, #b59bda)
  color: #fff
  padding: 0.6rem 0.95rem
  box-shadow: 0 8px 18px rgba(181, 155, 218, 0.24)

.tip
  margin: 0
  color: #6f5d98
  background: rgba(183, 155, 213, 0.14)
  border-radius: 999px
  padding: 0.4rem 0.7rem
  font-size: 0.8rem

@media (max-width: 960px)
  .hero-actions
    justify-items: start
    align-items: flex-start
    flex-direction: column
</style>
