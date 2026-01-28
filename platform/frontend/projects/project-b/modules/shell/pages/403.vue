<template lang="pug">
.error-page.is-403
  .orb.orb--one
  .orb.orb--two
  .error-card
    .pill-row
      span.pill 錯誤代碼
      span.code-badge 403
    h1 沒有存取權限
    p.lead 這個區塊需要額外授權或角色，請確認帳號與權限設定。

    .status-grid
      .status-card
        h3 為何會看到這個畫面？
        ul
          li 尚未登入或登入逾時
          li 帳號缺少對應的角色或租戶授權
          li 連結指向了受限的模組測試環境
      .status-card
        h3 下一步建議
        ul
          li 重新登入或切換正確租戶
          li 聯絡系統管理員開通權限
          li 回首頁從導覽入口進入

    .actions
      router-link.primary-cta(to="/") 回首頁
      router-link.ghost-cta(to="/") 回到首頁
    .note
      span.tag 權限提示
      span 成功登入後，系統會自動帶你回到上一個請求的模組。
</template>

<style lang="sass" scoped>
@use '@project/styles/sass/vars' as *
.error-page
  position: relative
  min-height: 100vh
  display: grid
  place-items: center
  padding: 48px 18px
  background: radial-gradient(120% 120% at 14% 8%, color-mix(in srgb, $sys_4 10%, transparent), transparent), radial-gradient(120% 120% at 88% 14%, color-mix(in srgb, $sys_8 8%, transparent), transparent), $bgColor
  color: $txtColor
  font-family: "SF Pro Display", "Segoe UI", system-ui, -apple-system, sans-serif
  overflow: hidden

.error-card
  position: relative
  width: min(920px, 100%)
  padding: clamp(28px, 4vw, 48px)
  border-radius: 18px
  border: 1px solid color-mix(in srgb, $borderColor 70%, transparent)
  background: color-mix(in srgb, $bgColor 82%, transparent)
  box-shadow: 0 20px 60px color-mix(in srgb, $sys_4 12%, transparent)
  backdrop-filter: blur(16px)
  display: grid
  gap: 14px

.pill-row
  display: inline-flex
  align-items: center
  gap: 10px
  padding: 6px 10px
  background: color-mix(in srgb, $sys_4 10%, transparent)
  border-radius: 999px
  width: fit-content

.pill
  font-weight: 600
  color: $sys_4

.code-badge
  display: inline-flex
  align-items: center
  justify-content: center
  padding: 6px 12px
  background: $sys_4
  color: $sys_1
  border-radius: 999px
  font-weight: 800
  letter-spacing: 0.06em

h1
  margin: 0
  font-size: clamp(30px, 5vw, 40px)
  line-height: 1.1

.lead
  margin: 0
  color: $sys_9
  font-size: 17px

.status-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
  gap: 12px
  margin-top: 4px

.status-card
  padding: 16px
  border-radius: 14px
  border: 1px solid color-mix(in srgb, $borderColor 70%, transparent)
  background: linear-gradient(135deg, color-mix(in srgb, $sys_4 10%, transparent), color-mix(in srgb, $sys_8 6%, transparent))
  color: $txtColor
  box-shadow: inset 0 1px 0 color-mix(in srgb, $sys_4 18%, transparent)

.status-card h3
  margin: 0 0 8px 0
  font-size: 16px

.status-card ul
  margin: 0
  padding-left: 18px
  display: grid
  gap: 6px
  color: $sys_9

.actions
  display: flex
  flex-wrap: wrap
  gap: 10px
  margin-top: 6px

.primary-cta, .ghost-cta
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 8px
  padding: 12px 18px
  border-radius: 12px
  font-weight: 700
  text-decoration: none
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease, color 0.2s ease

.primary-cta
  background: $sys_4
  color: $sys_1
  border: 1px solid $sys_4

.primary-cta:hover
  transform: translateY(-1px)
  box-shadow: 0 12px 30px color-mix(in srgb, $sys_4 26%, transparent)

.ghost-cta
  border: 1px solid $borderColor
  color: $txtColor
  background: color-mix(in srgb, $bgColor 90%, transparent)

.ghost-cta:hover
  border-color: $sys_4
  color: $sys_4
  transform: translateY(-1px)

.note
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  border-radius: 10px
  border: 1px dashed color-mix(in srgb, $borderColor 70%, transparent)
  background: color-mix(in srgb, $sys_4 6%, transparent)
  color: $sys_9
  width: fit-content

.tag
  display: inline-flex
  align-items: center
  padding: 4px 10px
  border-radius: 999px
  background: color-mix(in srgb, $sys_4 12%, transparent)
  color: $sys_4
  font-weight: 700
  font-size: 12px

.orb
  position: absolute
  border-radius: 999px
  filter: blur(60px)
  opacity: 0.72
  animation: floaty 12s ease-in-out infinite alternate

.orb--one
  width: 360px
  height: 360px
  top: -70px
  left: -110px
  background: color-mix(in srgb, $sys_4 30%, transparent)

.orb--two
  width: 320px
  height: 320px
  bottom: -50px
  right: -90px
  background: color-mix(in srgb, $sys_8 20%, transparent)
  animation-duration: 14s

@keyframes floaty
  from
    transform: translateY(0px) scale(1)
  to
    transform: translateY(12px) scale(1.02)
</style>
