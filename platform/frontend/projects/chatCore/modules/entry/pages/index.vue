<script setup>
import { RouterLink } from 'vue-router'
</script>

<template lang="pug">
main.chatcore-page.chatcore-entry
  header.chatcore-header
    RouterLink.chatcore-brand(to="/") chatCore
    span.chatcore-header__tag 技術實驗

  section.chatcore-hero
    p.chatcore-eyebrow PRIVATE CHAT EXPERIMENT
    h1 私人聊天室實驗
    p.chatcore-lead
      | chatCore 是獨立的實驗 Project，用來逐步驗證私人文字聊天室、裝置連線與本機聊天紀錄。
    p.chatcore-note
      | 目前僅提供實驗入口與控制台，不含登入、會員資料或可用聊天室。
    RouterLink.chatcore-button(to="/console") 前往控制台

  footer.chatcore-footer
    span ModuCore Project · chatCore
    span 實驗功能依里程碑逐階段開放
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
  letter-spacing: .02em
  text-decoration: none

.chatcore-header__tag, .chatcore-eyebrow
  color: #4168a0
  font-size: 12px
  font-weight: 700
  letter-spacing: .13em

.chatcore-hero
  display: grid
  justify-items: start
  max-width: 760px
  margin: clamp(72px, 13vh, 140px) auto 0

.chatcore-hero h1
  margin: 14px 0
  font-size: clamp(38px, 7vw, 68px)
  line-height: 1.14
  letter-spacing: -.04em

.chatcore-lead
  max-width: 650px
  color: #43556b
  font-size: clamp(17px, 2vw, 21px)
  line-height: 1.8

.chatcore-note
  margin: 14px 0 28px
  color: #69788a
  font-size: 14px
  line-height: 1.7

.chatcore-button
  display: inline-flex
  min-height: 48px
  align-items: center
  padding: 0 22px
  border-radius: 12px
  color: white
  background: #285ca8
  font-weight: 700
  text-decoration: none
  box-shadow: 0 8px 20px #285ca82b

.chatcore-button:hover
  background: #1e4d92

.chatcore-footer
  display: flex
  flex-wrap: wrap
  justify-content: space-between
  gap: 10px
  max-width: 1080px
  margin: clamp(88px, 17vh, 180px) auto 0
  padding-top: 18px
  border-top: 1px solid #d8e0ea
  color: #758396
  font-size: 12px
</style>
