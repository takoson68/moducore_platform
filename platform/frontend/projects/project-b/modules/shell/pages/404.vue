<template lang="pug">
.error-page.is-404
  .orb.orb--one
  .orb.orb--two
  .error-card
    .pill-row
      span.pill 錯誤代碼
      span.code-badge 404
    h1 找不到這個頁面
    p.lead 看起來這個模組路徑已經被搬走，或是網址有一點小錯字。

    .hints
      .hint-card
        h3 可以這樣試試：
        ul
          li 檢查網址拼寫或重新整理
          li 回到首頁重新導航
          li 如需協助，聯絡站點管理員
      .hint-card
        h3 熱門捷徑
        .chips
          router-link.chip(to="/") 首頁
          router-link.chip(to="/") 登入/切換帳號

    .actions
      router-link.primary-cta(to="/") 回到首頁
      router-link.ghost-cta(to="/") 轉往登入
    .note
      span.tag 模組提示
      span 系統會記錄這次 404，幫助我們整理遺失的路徑。
</template>

<style lang="sass" scoped>
@use '@project/styles/sass/vars' as *
.error-page
  position: relative
  min-height: 100vh
  display: grid
  place-items: center
  padding: 48px 18px
  background: radial-gradient(120% 120% at 12% 10%, color-mix(in srgb, $primaryColor 10%, transparent), transparent), radial-gradient(120% 120% at 90% 6%, color-mix(in srgb, $sys_6 8%, transparent), transparent), $bgColor
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
  box-shadow: 0 20px 60px color-mix(in srgb, $primaryColor 12%, transparent)
  backdrop-filter: blur(16px)
  display: grid
  gap: 14px

.pill-row
  display: inline-flex
  align-items: center
  gap: 10px
  padding: 6px 10px
  background: color-mix(in srgb, $primaryColor 10%, transparent)
  border-radius: 999px
  width: fit-content

.pill
  font-weight: 600
  color: $primaryColor

.code-badge
  display: inline-flex
  align-items: center
  justify-content: center
  padding: 6px 12px
  background: $primaryColor
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

.hints
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr))
  gap: 12px
  margin-top: 4px

.hint-card
  padding: 16px
  border-radius: 14px
  border: 1px solid color-mix(in srgb, $borderColor 70%, transparent)
  background: linear-gradient(135deg, color-mix(in srgb, $primaryColor 10%, transparent), color-mix(in srgb, $sys_4 6%, transparent))
  color: $txtColor
  box-shadow: inset 0 1px 0 color-mix(in srgb, $primaryColor 18%, transparent)

.hint-card h3
  margin: 0 0 8px 0
  font-size: 16px

.hint-card ul
  margin: 0
  padding-left: 18px
  display: grid
  gap: 6px
  color: $sys_9

.chips
  display: flex
  flex-wrap: wrap
  gap: 8px

.chip
  padding: 8px 12px
  border-radius: 999px
  border: 1px solid color-mix(in srgb, $borderColor 80%, transparent)
  background: color-mix(in srgb, $bgColor 90%, transparent)
  color: $primaryColor
  font-weight: 600
  text-decoration: none
  transition: all 0.2s ease

.chip:hover
  border-color: $primaryColor
  box-shadow: 0 8px 20px color-mix(in srgb, $primaryColor 16%, transparent)

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
  background: $primaryColor
  color: $sys_1
  border: 1px solid $primaryColor

.primary-cta:hover
  transform: translateY(-1px)
  box-shadow: 0 12px 30px color-mix(in srgb, $primaryColor 26%, transparent)

.ghost-cta
  border: 1px solid $borderColor
  color: $txtColor
  background: color-mix(in srgb, $bgColor 90%, transparent)

.ghost-cta:hover
  border-color: $primaryColor
  color: $primaryColor
  transform: translateY(-1px)

.note
  display: inline-flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  border-radius: 10px
  border: 1px dashed color-mix(in srgb, $borderColor 70%, transparent)
  background: color-mix(in srgb, $primaryColor 6%, transparent)
  color: $sys_9
  width: fit-content

.tag
  display: inline-flex
  align-items: center
  padding: 4px 10px
  border-radius: 999px
  background: color-mix(in srgb, $primaryColor 12%, transparent)
  color: $primaryColor
  font-weight: 700
  font-size: 12px

.orb
  position: absolute
  border-radius: 999px
  filter: blur(60px)
  opacity: 0.7
  animation: floaty 12s ease-in-out infinite alternate

.orb--one
  width: 380px
  height: 380px
  top: -80px
  left: -120px
  background: color-mix(in srgb, $primaryColor 32%, transparent)

.orb--two
  width: 320px
  height: 320px
  bottom: -60px
  right: -90px
  background: color-mix(in srgb, $sys_4 22%, transparent)
  animation-duration: 14s

@keyframes floaty
  from
    transform: translateY(0px) scale(1)
  to
    transform: translateY(12px) scale(1.02)
</style>
