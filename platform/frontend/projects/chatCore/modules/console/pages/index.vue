<script setup>
import { RouterLink } from 'vue-router'
import { projectLinks } from '../projectLinks.js'

const plannedCapabilities = [
  { id: 'members', title: '會員管理', description: '等待共用會員身分與 Project 授權能力完成後再規劃。' },
  { id: 'rooms', title: '聊天室管理', description: '房間與成員管理功能尚未開放。' },
  {
    id: 'private-connection',
    title: '一對一私人連線',
    description: 'M1 提供兩個 Peer 的 RTCDataChannel 實驗；會員邀請及正式聊天室尚未開放。',
    route: '/lab'
  }
]
</script>

<template lang="pug">
main.chatcore-page.chatcore-console
  header.chatcore-header
    RouterLink.chatcore-brand(to="/") chatCore
    span.chatcore-header__tag 實驗控制台
    RouterLink.chatcore-back(to="/") 返回入口

  section.console-intro
    p.chatcore-eyebrow EXPERIMENT CONSOLE
    h1 控制台
    p 這裡集中呈現 chatCore 的實驗入口與 Project 導覽。尚未完成的能力會標示狀態，不代表可執行功能。

  section.console-section(aria-labelledby="capabilities-title")
    .section-heading
      div
        p.chatcore-eyebrow CAPABILITIES
        h2#capabilities-title 聊天功能
      span.section-status M1 文字傳輸實驗
    .capability-grid
      article.capability-card(v-for="item in plannedCapabilities" :key="item.id")
        .capability-card__top
          h3 {{ item.title }}
          span.status-pill(v-if="item.route") M1 實驗
          span.status-pill(v-else) 尚未開放
        p {{ item.description }}
        RouterLink.capability-action(v-if="item.route" :to="item.route") 開啟實驗頁

  section.console-section(aria-labelledby="projects-title")
    .section-heading
      div
        p.chatcore-eyebrow PROJECT DIRECTORY
        h2#projects-title 其他 Project
      span.section-status Project 本地設定
    .project-grid
      a.project-card(
        v-for="project in projectLinks"
        :key="project.id"
        :href="project.href"
        target="_blank"
        rel="noopener noreferrer"
      )
        .project-card__top
          h3 {{ project.title }}
          span.project-card__open 另開分頁 ↗
        p {{ project.description }}
        code {{ project.href }}
    p.project-disclaimer
      | 開啟連結不會傳遞 chatCore 或 dineCore 的登入狀態；目標 Project 會自行驗證身分與權限。

  footer.chatcore-footer
    span chatCore · 技術實驗
    span 聊天傳輸供合成測試；未連接會員或歷史服務
</template>

<style lang="sass">
.chatcore-page
  box-sizing: border-box
  min-height: 100vh
  padding: clamp(22px, 5vw, 64px)
  color: #172a3b
  font-family: "Segoe UI", "Noto Sans TC", sans-serif
  background: radial-gradient(ellipse at 85% 5%, #d8e9ff 0, transparent 35%), linear-gradient(145deg, #f7f9fd, #edf3fa)

.chatcore-header
  display: flex
  align-items: center
  gap: 14px
  max-width: 1080px
  margin: 0 auto

.chatcore-brand
  color: inherit
  font-size: 20px
  font-weight: 800
  text-decoration: none

.chatcore-header__tag, .chatcore-eyebrow
  color: #4168a0
  font-size: 12px
  font-weight: 700
  letter-spacing: .13em

.chatcore-back
  margin-left: auto
  color: #45617e
  font-size: 14px
  text-decoration: none

.console-intro, .console-section
  max-width: 1080px
  margin: 0 auto

.console-intro
  margin-top: 60px

.console-intro h1
  margin: 10px 0
  font-size: clamp(34px, 5vw, 48px)
  letter-spacing: -.04em

.console-intro > p:last-child
  max-width: 680px
  color: #596b80
  line-height: 1.75

.console-section
  margin-top: 48px

.section-heading, .capability-card__top, .project-card__top
  display: flex
  align-items: center
  justify-content: space-between
  gap: 14px

.section-heading h2
  margin: 4px 0 0
  font-size: 23px

.section-status, .status-pill
  padding: 7px 10px
  border: 1px solid #d3deed
  border-radius: 999px
  color: #5b6e84
  background: #f9fbfe
  font-size: 12px
  white-space: nowrap

.capability-grid, .project-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr))
  gap: 14px
  margin-top: 18px

.capability-card, .project-card
  min-width: 0
  padding: 20px
  border: 1px solid #dce4ef
  border-radius: 16px
  background: #ffffffd9
  box-shadow: 0 8px 26px #253b580a

.capability-card h3, .project-card h3
  margin: 0
  font-size: 17px

.capability-card p, .project-card p
  margin: 14px 0 0
  color: #64758a
  font-size: 14px
  line-height: 1.65

.capability-action
  display: inline-flex
  margin-top: 14px
  color: #285ca8
  font-size: 13px
  font-weight: 700
  text-decoration: none

.status-pill
  padding: 5px 8px
  background: #f2f5f8

.project-card
  display: block
  color: inherit
  text-decoration: none
  transition: transform .16s ease, border-color .16s ease

.project-card:hover
  transform: translateY(-2px)
  border-color: #9cb8dd

.project-card__open
  color: #285ca8
  font-size: 12px
  white-space: nowrap

.project-card code
  display: block
  overflow-wrap: anywhere
  margin-top: 16px
  color: #59718f
  font-size: 11px

.project-disclaimer
  margin: 16px 0 0
  color: #758396
  font-size: 12px
  line-height: 1.7

.chatcore-footer
  display: flex
  flex-wrap: wrap
  justify-content: space-between
  gap: 10px
  max-width: 1080px
  margin: 64px auto 0
  padding-top: 18px
  border-top: 1px solid #d8e0ea
  color: #758396
  font-size: 12px

@media (max-width: 520px)
  .chatcore-header
    flex-wrap: wrap
  .chatcore-back
    width: 100%
    margin-left: 0
  .section-heading
    align-items: flex-start
    flex-direction: column
</style>
