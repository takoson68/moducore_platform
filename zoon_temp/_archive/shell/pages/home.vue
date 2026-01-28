<script setup>
import LoginButton from '@/components/LoginButton.vue'

const pillars = [
  {
    title: '模組化設計',
    desc: '核心功能以模組方式拆分，可依需求啟用或停用，避免不必要的耦合。'
  },
  {
    title: '可追蹤的系統行為',
    desc: '提供事件記錄與操作軌跡，方便後續除錯、審查與系統觀測。'
  },
  {
    title: '面向多租戶的結構',
    desc: '考量多租戶與角色差異，預留權限、設定與擴充空間。'
  }
]


const modules = [
  {
    badge: 'Identity / Tenant',
    title: '身份與租戶管理',
    desc: '基本的角色權限、租戶隔離與存取設定，作為平台的登入與管理基礎。'
  },
  {
    badge: 'Workflow',
    title: '流程與事件',
    desc: '以事件為核心的流程設計，協助不同模組之間進行協作與擴充。'
  },
  {
    badge: 'Notifications',
    title: '通知機制',
    desc: '集中處理站內與外部通知，並提供訊息偏好與基本頻率控制。'
  },
  {
    badge: 'Data & Audit',
    title: '紀錄與審計',
    desc: '保留操作紀錄與資料變化，方便追蹤歷程與後續分析。'
  },
  {
    badge: 'AI Assist',
    title: '輔助功能',
    desc: '預留與外部模型或服務整合的介面，作為輔助型功能使用。'
  },
  {
    badge: 'Extensibility',
    title: '擴充方式',
    desc: '透過 API 或 SDK 加入自訂功能，維持一致的設定與載入流程。'
  }
]

const flows = [
  {
    title: '1. 初始設定',
    detail: '選擇需要的模組並完成基本設定，即可啟動平台進行測試與使用。'
  },
  {
    title: '2. 功能調整',
    detail: '依實際需求逐步調整模組與流程，不影響既有結構。'
  },
  {
    title: '3. 日常維運',
    detail: '透過紀錄與狀態檢視，掌握系統運作情況。'
  }
]

</script>

<template lang="pug">
.home-page
  section.hero
    .hero__bg
    .hero__content
      .badge 前端平台骨架（Frontend Platform Skeleton）
      h1 ModuCore：用來組織模組化業務介面的前端平台
      p.lead
        | ModuCore 是一個以前端為核心的平台骨架，
        | 設計目標是承載模組化 SaaS 的業務介面，
        | 專注於模組載入、UI 組織與平台層行為的設計，
        | 協助產品在成長過程中維持結構清楚與可維護性。

      .cta-group
        //- LoginButton
        a.ghost-cta(href="#modules") 查看現有模組
      .stats
        .stat
          div.stat__value 模組導向
          div.stat__label UI 與功能以模組為單位組織
        .stat
          div.stat__value 生命週期清楚
          div.stat__label 登入前後與模組載入分離
        .stat
          div.stat__value 可擴充
          div.stat__label 預留平台與模組擴充空間

  section.pillars
    .section-head
      h2 前端平台的設計重點
      p
        | 這個平台不是成品系統，而是一個用來承載業務介面的前端結構，
        | 設計重點放在邊界清楚與長期維護。
    .pillar-grid
      .pillar-card(v-for="pillar in pillars" :key="pillar.title")
        h3 {{ pillar.title }}
        p {{ pillar.desc }}

  section#modules.modules
    .section-head
      h2 模組化前端能力
      p
        | 以下模組代表平台目前已整理的前端層能力，
        | 這些能力通常出現在多租戶 SaaS 的前端架構中，
        | 可依需求載入，並與既有後端服務整合。
    .module-grid
      .module-card(v-for="module in modules" :key="module.title")
        span.module-card__badge {{ module.badge }}
        h3 {{ module.title }}
        p {{ module.desc }}

  section.flows
    .section-head
      h2 使用與演進方式
      p
        | 平台以「先建立結構，再逐步補齊功能」為原則，
        | 適合在 PoC、內部系統或早期產品中逐步成長。
    .flow-list
      .flow-item(v-for="flow in flows" :key="flow.title")
        h4 {{ flow.title }}
        p {{ flow.detail }}

  section.callout
    .callout__content
      h3 適合正在打造模組化前端架構的團隊
      p
        | 如果你希望在前端階段就建立清楚的平台結構，
        | ModuCore 可以作為一個可持續演進的起點。
      .cta-group
        //- LoginButton
        a.ghost-cta(href="#") 查看技術說明

</template>

<style lang="sass" scoped>
@use '/src/styles/sass/vars' as *
.home-page
  min-height: 100vh
  background: radial-gradient(120% 120% at 20% 20%, color-mix(in srgb, $primaryColor 8%, transparent), transparent), radial-gradient(100% 100% at 80% 0%, color-mix(in srgb, $sys_6 8%, transparent), transparent), $bgColor
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
  background: linear-gradient(135deg, color-mix(in srgb, $primaryColor 16%, transparent), color-mix(in srgb, $sys_4 8%, transparent))
  filter: blur(48px)
  opacity: 0.7
  pointer-events: none

.hero__content
  position: relative
  max-width: 1080px
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
  font-size: clamp(28px, 5vw, 42px)
  line-height: 1.15

.lead
  margin: 0
  font-size: 18px
  color: $sys_9

.cta-group
  display: flex
  align-items: center
  gap: 12px
  margin-top: 6px

.ghost-cta
  padding: 10px 14px
  border: 1px solid $borderColor
  border-radius: 8px
  color: $txtColor
  transition: all 0.2s ease

.ghost-cta:hover
  border-color: $primaryColor
  color: $primaryColor
  transform: translateY(-1px)

.stats
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr))
  gap: 12px
  margin-top: 12px

.stat
  padding: 14px 16px
  border: 1px solid $borderColor
  border-radius: 12px
  background: color-mix(in srgb, $bgColor 60%, transparent)
  backdrop-filter: blur(6px)
  box-shadow: 0 10px 30px color-mix(in srgb, $txtColor 6%, transparent)

.stat__value
  font-size: 22px
  font-weight: 700

.stat__label
  color: $sys_9
  margin-top: 4px

.section-head
  max-width: 960px
  margin: 0 auto 24px auto
  text-align: center

.section-head h2
  margin: 0 0 8px 0
  font-size: 24px

.section-head p
  margin: 0
  color: $sys_9

.pillar-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 16px
  max-width: 1080px
  margin: 0 auto

.pillar-card
  padding: 18px
  border: 1px solid $borderColor
  border-radius: 14px
  background: color-mix(in srgb, $bgColor 70%, transparent)
  box-shadow: 0 12px 32px color-mix(in srgb, $txtColor 6%, transparent)
  transition: transform 0.2s ease, box-shadow 0.2s ease

.pillar-card:hover
  transform: translateY(-4px)
  box-shadow: 0 16px 40px color-mix(in srgb, $txtColor 8%, transparent)

.pillar-card h3
  margin: 0 0 8px 0
  font-size: 18px

.pillar-card p
  margin: 0
  color: $sys_9

.modules
  background: linear-gradient(180deg, color-mix(in srgb, $primaryColor 4%, transparent), transparent)

.module-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr))
  gap: 14px
  max-width: 1100px
  margin: 0 auto

.module-card
  padding: 18px
  border: 1px solid $borderColor
  border-radius: 16px
  background: $bgColor
  box-shadow: 0 12px 32px color-mix(in srgb, $txtColor 6%, transparent)
  transition: border-color 0.2s ease, transform 0.2s ease

.module-card:hover
  border-color: $primaryColor
  transform: translateY(-3px)

.module-card__badge
  display: inline-block
  margin-bottom: 10px
  padding: 6px 10px
  border-radius: 999px
  background: color-mix(in srgb, $primaryColor 12%, transparent)
  color: $primaryColor
  font-size: 12px
  font-weight: 600

.module-card h3
  margin: 0 0 8px 0
  font-size: 18px

.module-card p
  margin: 0
  color: $sys_9

.flows
  background: linear-gradient(180deg, transparent, color-mix(in srgb, $sys_6 5%, transparent))

.flow-list
  max-width: 940px
  margin: 0 auto
  display: grid
  gap: 12px

.flow-item
  padding: 16px 18px
  border-radius: 14px
  border: 1px solid $borderColor
  background: $bgColor
  box-shadow: 0 10px 28px color-mix(in srgb, $txtColor 6%, transparent)
  transition: transform 0.2s ease

.flow-item:hover
  transform: translateY(-2px)

.flow-item h4
  margin: 0 0 6px 0

.flow-item p
  margin: 0
  color: $sys_9

.callout
  padding: 64px 8vw 96px
  background: radial-gradient(80% 80% at 50% 0%, color-mix(in srgb, $primaryColor 12%, transparent), transparent), $bgColor

.callout__content
  max-width: 880px
  margin: 0 auto
  padding: 28px
  border-radius: 18px
  border: 1px solid $borderColor
  background: linear-gradient(135deg, color-mix(in srgb, $primaryColor 12%, transparent), color-mix(in srgb, $sys_6 8%, transparent))
  box-shadow: 0 18px 48px color-mix(in srgb, $txtColor 8%, transparent)
  display: grid
  gap: 10px
  text-align: center

.callout__content h3
  margin: 0
  font-size: 22px

.callout__content p
  margin: 0
  color: $txtColor

@media (max-width: 768px)
  section
    padding: 56px 6vw

  .cta-group
    flex-direction: column
    align-items: flex-start

  .stats
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))
</style>
