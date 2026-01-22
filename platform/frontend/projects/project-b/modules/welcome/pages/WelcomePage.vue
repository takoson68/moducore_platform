<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'ModuCore'
const subtitle = '模組化世界平台'
const highlights = [
  {
    title: '世界裁決一致性',
    body: '以世界規則為最高準則，確保每個專案在同一套邊界下生成與演進。'
  },
  {
    title: '可插拔模組',
    body: '模組可獨立註冊、替換、移除，維持低耦合與可預期運作。'
  },
  {
    title: '工程流程可追蹤',
    body: 'boot 與 lifecycle 分階段可識別、可觀測，利於治理與除錯。'
  }
]
const steps = [
  '選定 Project 與 layout 世界定義',
  '依裁決流程註冊與載入模組',
  '進入 runtime，持續維持世界一致性'
]
</script>

<template lang="pug">
LayoutRoot(:title="title" :subtitle="subtitle")
  h1.hero-title ModuCore
  .intro
    p.lead ModuCore 是以世界規則為核心的模組化平台，讓專案在一致邊界下快速生成與運行。
    p.secondary 聚焦在世界裁決、可插拔模組與工程可追溯，讓平台在多專案、多世界場景中保持穩定。

  .highlight-grid
    .highlight-card(v-for="item in highlights" :key="item.title")
      h3 {{ item.title }}
      p {{ item.body }}

  .section
    h2 核心流程
    ol.flow
      li(v-for="step in steps" :key="step") {{ step }}

  .section
    h2 適用情境
    .tags
      span.tag 多專案世界切換
      span.tag 模組化業務系統
      span.tag 高一致性工程治理
      span.tag 可觀測 boot 流程
</template>

<style lang="sass">
.intro
  display: grid
  gap: 10px
  max-width: 720px

.hero-title
  margin: 0 0 12px
  font-size: clamp(40px, 7vw, 72px)
  font-weight: 800
  letter-spacing: -1px
  color: #0e7490
  border-bottom: 4px solid rgba(14, 116, 144, 0.4)
  padding-bottom: 8px

.lead
  font-size: 19px
  font-weight: 600
  margin: 0

.secondary
  margin: 0
  color: #334155
  line-height: 1.6

.highlight-grid
  margin-top: 24px
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 16px

.highlight-card
  padding: 16px
  border-radius: 16px
  border: 1px solid rgba(14, 116, 144, 0.35)
  background: linear-gradient(160deg, rgba(14, 116, 144, 0.82), rgba(7, 89, 133, 0.96))
  box-shadow: 0 10px 28px rgba(15, 23, 42, 0.12)
  h3
    margin: 0 0 8px
    font-size: 20px
    color: #fff
  p
    margin: 0
    color: rgba(226, 232, 240, 0.9)
    line-height: 1.5

.highlight-card:nth-child(1)
  border-color: rgba(14, 116, 144, 0.28)
  background: linear-gradient(160deg, rgba(14, 116, 144, 0.72), rgba(8, 90, 120, 0.9))

.highlight-card:nth-child(2)
  border-color: rgba(14, 116, 144, 0.32)
  background: linear-gradient(160deg, rgba(14, 116, 144, 0.88), rgba(7, 89, 133, 0.98))

.highlight-card:nth-child(3)
  border-color: rgba(14, 116, 144, 0.4)
  background: linear-gradient(160deg, rgba(8, 90, 120, 0.95), rgba(6, 78, 59, 1))

.section
  margin-top: 28px
  h2
    margin: 0 0 12px
    font-size: 18px
    color: #0f172a

.flow
  margin: 0
  padding-left: 18px
  color: #334155
  line-height: 1.7

.tags
  display: flex
  flex-wrap: wrap
  gap: 8px

.tag
  padding: 6px 10px
  border-radius: 999px
  border: 1px solid rgba(14, 116, 144, 0.18)
  background: rgba(14, 116, 144, 0.08)
  color: #0e7490
  font-size: 12px
</style>
