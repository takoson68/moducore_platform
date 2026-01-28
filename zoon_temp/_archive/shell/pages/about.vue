<script setup>
const highlights = [
  {
    title: '前端平台基底',
    desc: '整理身份、租戶、通知、流程等常見前端平台需求，形成可重用的模組結構。'
  },
  {
    title: '結構優先',
    desc: '在功能之前先處理邊界、事件與狀態流向，讓後續擴充有清楚依據。'
  },
  {
    title: '支援產品演進',
    desc: '以模組化方式承載業務介面，適合從 PoC 到 MVP 的前端演進過程。'
  }
]


const principles = [
  {
    title: '模組作為邊界',
    desc: '以前端模組劃分責任範圍，降低跨功能耦合與維護成本。'
  },
  {
    title: '預設合理而非完整',
    desc: '提供常見結構與流程範例，避免過度假設實際使用情境。'
  },
  {
    title: '可觀測性的前端接口',
    desc: '為事件、狀態與操作預留記錄與追蹤位置，方便後續整合。'
  },
  {
    title: '保留擴充彈性',
    desc: '透過清楚的介面與約定，讓不同後端或服務能逐步接入。'
  }
]

const milestones = [
  {
    year: 'Phase 1',
    detail: '在實作多租戶前端介面時，開始整理身份與通知等共通結構。'
  },
  {
    year: 'Phase 2',
    detail: '將流程、事件與狀態管理抽離為模組，形成平台化前端雛形。'
  },
  {
    year: 'Phase 3',
    detail: '持續調整模組邊界，嘗試將架構整理為可重用的前端平台骨架。'
  }
]


const teamFocus = [
  {
    title: '前端平台設計',
    desc: '關注模組邊界、生命週期與長期可維護性的前端架構問題。'
  },
  {
    title: '結構與風險意識',
    desc: '在設計階段思考權限、狀態與資料流向，避免後期重構成本。'
  },
  {
    title: '實作導向',
    desc: '以實際專案經驗反覆調整架構，而非一次性定義完整藍圖。'
  }
]

</script>

<template lang="pug">
.about-page
  section.hero
    .hero__bg
    .hero__content
      .badge 關於 ModuCore
      h1 一個以前端為核心的 SaaS 平台骨架
      p.lead
        | ModuCore 是一個前端平台結構的實作嘗試，
        | 用來整理模組化業務介面的組織方式，
        | 並探索在 SaaS 情境下的可維護性設計。
      .hero__meta
        .meta-item
          div.meta__value 模組導向
          div.meta__label 前端平台設計
        .meta-item
          div.meta__value 可演進
          div.meta__label 架構調整彈性
        .meta-item
          div.meta__value 實作中
          div.meta__label 持續整理與驗證


  section.highlights
    .section-head
      h2 我們在解決什麼問題
      p 面對多租戶、跨模組協作與法遵挑戰，平台底座應該先替團隊擋下複雜度。
    .highlight-grid
      .highlight-card(v-for="item in highlights" :key="item.title")
        h3 {{ item.title }}
        p {{ item.desc }}

  section.principles
    .section-head
      h2 設計原則
      p 以平台級思維打造模組，確保獨立性、可觀測性與擴充彈性。
    .principle-grid
      .principle-card(v-for="item in principles" :key="item.title")
        h3 {{ item.title }}
        p {{ item.desc }}

  section.milestones
    .section-head
      h2 演進里程碑
      p 從單一產品需求出發，逐步提煉成通用、可插拔的 SaaS 底座。
    .timeline
      .timeline__item(v-for="mile in milestones" :key="mile.year")
        .dot
        .content
          h4 {{ mile.year }}
          p {{ mile.detail }}

  section.team
    .section-head
      h2 團隊關注
      p 我們將 SaaS 與平台化經驗收斂成模組，陪伴你的產品從初期到規模化。
    .team-grid
      .team-card(v-for="item in teamFocus" :key="item.title")
        h3 {{ item.title }}
        p {{ item.desc }}

  section.callout
    h3 如果你正在思考 SaaS 的前端架構
    p
      | 這個專案整理了一套模組化前端平台的設計方式，
      | 適合用來討論、實驗或作為架構起點。
    .cta-row
      a.primary-cta(href="/login") 進入平台
      a.ghost-cta(href="/") 回首頁

</template>

<style lang="sass" scoped>
.about-page
  min-height: 100vh
  background: radial-gradient(120% 120% at 10% 10%, color-mix(in srgb, $primaryColor 8%, transparent), transparent), radial-gradient(120% 120% at 90% 0%, color-mix(in srgb, $sys_6 8%, transparent), transparent), $bgColor
  color: $txtColor
  font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif

section
  position: relative
  padding: 72px 8vw

.hero
  padding-top: 96px
  padding-bottom: 80px
  overflow: hidden

.hero__bg
  position: absolute
  inset: 0
  background: linear-gradient(135deg, color-mix(in srgb, $primaryColor 14%, transparent), color-mix(in srgb, $sys_4 8%, transparent))
  filter: blur(48px)
  opacity: 0.7
  pointer-events: none

.hero__content
  position: relative
  max-width: 1040px
  margin: 0 auto
  display: grid
  gap: 18px

.badge
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 6px 12px
  border-radius: 999px
  background: color-mix(in srgb, $primaryColor 12%, transparent)
  color: $primaryColor
  font-weight: 600
  width: fit-content

h1
  margin: 0
  font-size: clamp(28px, 5vw, 40px)
  line-height: 1.15

.lead
  margin: 0
  font-size: 18px
  color: $sys_9

.hero__meta
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))
  gap: 12px
  margin-top: 10px

.meta-item
  padding: 14px 16px
  border: 1px solid $borderColor
  border-radius: 12px
  background: color-mix(in srgb, $bgColor 65%, transparent)
  box-shadow: 0 10px 30px color-mix(in srgb, $txtColor 6%, transparent)

.meta__value
  font-size: 22px
  font-weight: 700

.meta__label
  color: $sys_9
  margin-top: 4px

.section-head
  max-width: 920px
  margin: 0 auto 24px auto
  text-align: center

.section-head h2
  margin: 0 0 8px 0
  font-size: 24px

.section-head p
  margin: 0
  color: $sys_9

.highlight-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 16px
  max-width: 1080px
  margin: 0 auto

.highlight-card
  padding: 18px
  border: 1px solid $borderColor
  border-radius: 14px
  background: color-mix(in srgb, $bgColor 70%, transparent)
  box-shadow: 0 12px 32px color-mix(in srgb, $txtColor 6%, transparent)
  transition: transform 0.2s ease, box-shadow 0.2s ease

.highlight-card:hover
  transform: translateY(-3px)
  box-shadow: 0 16px 40px color-mix(in srgb, $txtColor 8%, transparent)

.highlight-card h3
  margin: 0 0 8px 0
  font-size: 18px

.highlight-card p
  margin: 0
  color: $sys_9

.principles
  background: linear-gradient(180deg, color-mix(in srgb, $primaryColor 4%, transparent), transparent)

.principle-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 14px
  max-width: 1100px
  margin: 0 auto

.principle-card
  padding: 16px
  border: 1px solid $borderColor
  border-radius: 12px
  background: $bgColor
  box-shadow: 0 12px 32px color-mix(in srgb, $txtColor 6%, transparent)

.principle-card h3
  margin: 0 0 6px 0
  font-size: 17px

.principle-card p
  margin: 0
  color: $sys_9

.milestones
  background: linear-gradient(180deg, transparent, color-mix(in srgb, $sys_6 5%, transparent))

.timeline
  max-width: 780px
  margin: 0 auto
  position: relative
  display: grid
  gap: 12px

.timeline__item
  display: grid
  grid-template-columns: auto 1fr
  gap: 12px
  align-items: center
  padding: 14px 16px
  border: 1px solid $borderColor
  border-radius: 12px
  background: $bgColor
  box-shadow: 0 10px 28px color-mix(in srgb, $txtColor 6%, transparent)

.timeline .dot
  width: 12px
  height: 12px
  border-radius: 50%
  background: $primaryColor
  box-shadow: 0 0 0 6px color-mix(in srgb, $primaryColor 12%, transparent)

.timeline h4
  margin: 0 0 4px 0

.timeline p
  margin: 0
  color: $sys_9

.team
  background: linear-gradient(180deg, color-mix(in srgb, $sys_4 4%, transparent), transparent)

.team-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 14px
  max-width: 980px
  margin: 0 auto

.team-card
  padding: 16px
  border: 1px solid $borderColor
  border-radius: 14px
  background: color-mix(in srgb, $bgColor 75%, transparent)
  box-shadow: 0 12px 32px color-mix(in srgb, $txtColor 6%, transparent)

.team-card h3
  margin: 0 0 6px 0

.team-card p
  margin: 0
  color: $sys_9

.callout
  padding: 64px 8vw 88px
  background: radial-gradient(80% 80% at 50% 0%, color-mix(in srgb, $primaryColor 12%, transparent), transparent), $bgColor

.callout__content
  max-width: 860px
  margin: 0 auto
  padding: 28px
  border-radius: 18px
  border: 1px solid $borderColor
  background: linear-gradient(135deg, color-mix(in srgb, $primaryColor 12%, transparent), color-mix(in srgb, $sys_6 8%, transparent))
  box-shadow: 0 18px 48px color-mix(in srgb, $txtColor 8%, transparent)
  display: grid
  gap: 10px
  text-align: center

.cta-row
  display: flex
  justify-content: center
  gap: 12px
  margin-top: 6px

.primary-cta
  padding: 10px 16px
  border-radius: 10px
  background: $primaryColor
  color: $sys_1
  font-weight: 600
  transition: transform 0.2s ease, box-shadow 0.2s ease

.primary-cta:hover
  transform: translateY(-1px)
  box-shadow: 0 10px 24px color-mix(in srgb, $primaryColor 30%, transparent)

.ghost-cta
  padding: 10px 14px
  border: 1px solid $borderColor
  border-radius: 10px
  color: $txtColor
  transition: all 0.2s ease

.ghost-cta:hover
  border-color: $primaryColor
  color: $primaryColor
  transform: translateY(-1px)

@media (max-width: 768px)
  section
    padding: 56px 6vw

  .cta-row
    flex-direction: column
    align-items: stretch
</style>
