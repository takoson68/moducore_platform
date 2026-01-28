<script setup>
// 這裡可依需要掛載 store / service
import { RouterLink } from 'vue-router'
import { container } from "@/app/container";
const tempStore = container.resolve("moduleTemp");


</script>

<template lang="pug">
.temp-home
  .subnav
    .parent
      span.label Module Temp 
      span.caret ▼
      .submenu
        RouterLink.item(to="/moduleTemp") 首頁
        RouterLink.item(to="/moduleTemp/info") Info

  .hero
    .tag MODULE TEMPLATE
    h2 模組範例頁
    p.subtitle 示範模組頁面如何呈現，可替換為實際功能內容。
    p 這裡是store內容 : {{tempStore.state.title}}
    .actions
      button.primary(@click="() => alert('主要動作')") 主要動作
      button.secondary(@click="() => alert('了解更多')") 了解更多

  .info-grid
    .card
      h4 特性
      ul
        li 獨立路由、獨立頁面
        li 可自行掛載 store 或 service
        li 支援導航設定(nav)顯示
    .card
      h4 使用說明
      p 調整 routes.js 指向此頁，按需替換為實際功能。
      RouterLink.more(to="/moduleTemp/info") 查看更多頁面
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

.temp-home
  padding: 20px
  background: $bgColor
  min-height: 100%
  display: flex
  flex-direction: column
  gap: 16px
  position: relative

.subnav
  display: inline-block
  align-self: flex-start
  position: relative
  z-index: 2

.parent
  display: inline-flex
  align-items: center
  gap: 6px
  padding: 8px 12px
  border-radius: 12px
  background: $primaryColor
  color: $sys_1
  cursor: pointer
  box-shadow: 0 10px 20px rgba(12,27,61,0.25)
  position: relative

.caret
  font-size: 12px
  opacity: 0.7

.submenu
  display: none
  position: absolute
  top: 100%
  left: 0
  margin-top: 6px
  background: $sys_1
  border: 1px solid $borderColor
  border-radius: 12px
  box-shadow: 0 10px 24px rgba(16,40,89,0.12)
  min-width: 160px
  overflow: hidden

.parent:hover .submenu
  display: flex
  flex-direction: column

.submenu .item
  padding: 10px 14px
  color: $txtColor
  text-decoration: none
  transition: background 0.12s ease

.submenu .item:hover
  background: $sysBg

.hero
  padding: 18px 20px
  border-radius: 14px
  background: linear-gradient(145deg, $primaryColor, $sys_4)
  color: $sys_1
  box-shadow: 0 16px 30px rgba(12,27,61,0.35)
  display: grid
  gap: 10px

.tag
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 6px 10px
  border-radius: 999px
  background: rgba(255,255,255,0.12)
  color: $sys_1
  font-weight: 700
  font-size: 12px
  letter-spacing: 0.08em

.subtitle
  margin: 0
  opacity: 0.9
  font-size: 14px

.actions
  display: flex
  gap: 10px
  flex-wrap: wrap

button
  border: none
  border-radius: 10px
  padding: 10px 14px
  cursor: pointer
  font-weight: 700

.primary
  background: $primaryColor
  color: $sys_1
  box-shadow: 0 10px 22px rgba(76,195,255,0.35)

.secondary
  background: rgba(255,255,255,0.1)
  color: $sys_1
  border: 1px solid rgba(255,255,255,0.25)

.info-grid
  display: grid
  gap: 12px
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))

.info-grid .card:first-child
  position: relative

.info-grid .card:first-child::after
  content: '更多細節請見 Info'
  position: absolute
  bottom: 12px
  right: 12px
  font-size: 12px
  color: $sys_9

.card
  padding: 14px
  border-radius: 12px
  background: $sys_1
  border: 1px solid $borderColor
  box-shadow: 0 10px 20px rgba(16,40,89,0.08)

ul
  padding-left: 18px
  margin: 8px 0 0 0

li
  margin: 4px 0
</style>
