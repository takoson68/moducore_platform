<!-- src/router/NotFound.vue -->
<script setup>
</script>

<template lang="pug">
.not-found
  .bg-orb.orb-a
  .bg-orb.orb-b
  .card
    .tag 404
    h1.title 迷路了
    p.subtitle 這個路徑不存在或已被移動
    p.body 請回到首頁或使用側邊導覽返回已存在的頁面。
    .actions
      RouterLink.home-link(to="/") 回首頁
</template>

<style scoped lang="sass">
.not-found
  --bg-1: #f6fbff
  --bg-2: #e9f2ff
  --ink: #0f172a
  --muted: #5b6475
  --accent: #0e7490
  --accent-warm: #f97316
  --card: rgba(255, 255, 255, 0.82)
  --border: rgba(15, 23, 42, 0.12)
  min-height: 60vh
  display: grid
  place-items: center
  position: relative
  overflow: hidden
  padding: 24px
  background: radial-gradient(900px 360px at 10% 10%, rgba(14, 116, 144, 0.15), transparent 60%), linear-gradient(180deg, var(--bg-1), var(--bg-2))
  color: var(--ink)
  font-family: "Space Grotesk", "IBM Plex Sans", "Noto Sans TC", sans-serif

.bg-orb
  position: absolute
  border-radius: 999px
  filter: blur(6px)
  opacity: 0.5
  pointer-events: none

.orb-a
  width: 220px
  height: 220px
  left: -40px
  top: 20px
  background: radial-gradient(circle at 30% 30%, rgba(14, 116, 144, 0.35), transparent 70%)

.orb-b
  width: 280px
  height: 280px
  right: -80px
  bottom: -40px
  background: radial-gradient(circle at 60% 40%, rgba(59, 130, 246, 0.2), transparent 70%)

.card
  width: min(560px, 92vw)
  display: grid
  gap: 10px
  padding: 28px
  border-radius: 20px
  background: var(--card)
  border: 1px solid rgba(14, 116, 144, 0.2)
  box-shadow: 0 20px 50px rgba(15, 23, 42, 0.12)
  text-align: left
  animation: fadeUp 220ms ease-out

.tag
  display: inline-flex
  align-items: center
  justify-content: center
  width: fit-content
  padding: 6px 12px
  border-radius: 999px
  background: rgba(249, 115, 22, 0.14)
  color: var(--accent-warm)
  font-weight: 700
  letter-spacing: 0.4px
  font-size: 16px
  border: 1px solid var(--accent-warm)
.title
  margin: 0
  font-size: clamp(36px, 6vw, 52px)
  font-weight: 800

.subtitle
  margin: 0
  font-size: 16px
  color: var(--muted)

.body
  margin: 0
  font-size: 14px
  color: var(--muted)

.actions
  margin-top: 8px

.home-link
  display: inline-flex
  align-items: center
  justify-content: center
  padding: 10px 16px
  border-radius: 12px
  border: 1px solid rgba(14, 116, 144, 0.3)
  background: rgba(14, 116, 144, 0.1)
  color: var(--accent)
  text-decoration: none
  font-weight: 700

@keyframes fadeUp
  from
    opacity: 0
    transform: translateY(8px)
  to
    opacity: 1
    transform: translateY(0)
</style>
