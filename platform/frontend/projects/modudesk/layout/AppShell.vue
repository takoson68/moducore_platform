<script setup>
import { computed, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import world from '@/world.js'
import { useIdentity } from '@project/composables/useIdentity.js'
import FloatingIdentityPanel from '@project/components/FloatingIdentityPanel.vue'

const router = useRouter()
const route = useRoute()
const projectTitle = computed(() => world.projectConfig()?.title || 'ModuDesk')
const features = computed(() => world.projectConfig()?.features || {})
const isTaskEnabled = computed(() => features.value?.task?.enabled === true)
const {
  identity,
  isLoggedIn,
  error,
  ensureHydrated,
} = useIdentity()

onMounted(() => {
  ensureHydrated()
})

const navItems = computed(() => ([
  { label: 'Sticky Board', path: '/sticky' },
  { label: '行事曆', path: '/calendar' },
  ...(isTaskEnabled.value ? [{ label: '任務', path: '/tasks' }] : []),
]))
const showPromptStrip = computed(() => route.path !== '/sticky')
</script>

<template lang="pug">
.modudesk-shell
  .wallpaper-blur
  .desktop-frame
    aside.left-rail
      .brand-block
        .brand-logo MD
        .brand-meta
          p.brand-name {{ projectTitle }}
          p.brand-sub Local-first workspace
      .profile-card
        .avatar {{ (identity?.displayName || '訪').slice(0, 1) }}
        .profile-copy
          p.profile-name {{ identity?.displayName || '訪客模式' }}
          p.profile-desc {{ isLoggedIn ? '已登入' : '未登入' }}
      nav.side-nav(aria-label="ModuDesk navigation")
        button.nav-item(
          v-for="item in navItems"
          :key="`${item.label}-${item.path}`"
          type="button"
          :class="{ 'is-active': route.path === item.path }"
          @click="router.push(item.path)"
        ) {{ item.label }}
    .workspace
      //- header.shell-topbar
        .title-wrap
          p.eyebrow 嗨，{{ identity?.displayName || '歡迎使用 ModuDesk' }}
          h1.title Local-first 時間 / 空間操作台
        FloatingIdentityPanel
      //- p.banner-error(v-if="error") {{ error }}
      .workspace-grid
        //- .main-pane
          //- .prompt-strip(v-if="showPromptStrip")
            .prompt-icon ✦
            p.prompt-copy 以 Sticky Board 佈局空間，以 Calendar 對照日期節奏。
            button.prompt-action(type="button" @click="router.push('/sticky')") 前往 Sticky Board
          main.shell-main
        RouterView
</template>

<style lang="sass">
.modudesk-shell
  --space-1: 0.5rem
  --space-2: 0.75rem
  --space-3: 1rem
  --space-4: 1.25rem
  --space-5: 1.75rem
  --space-6: 2.25rem
  --radius-1: 0.75rem
  --radius-2: 1rem
  --radius-3: 1.25rem
  --border-color: rgba(36, 42, 54, 0.08)
  --surface: rgba(255, 255, 255, 0.72)
  --surface-solid: #f6f7fb
  --surface-card: rgba(255, 255, 255, 0.78)
  --text-main: #1f2230
  --text-soft: #6c7387
  --accent: #b79bd5
  --accent-strong: #9b79c7
  --danger-bg: #fff1f0
  --danger-text: #b42318
  position: relative
  min-height: 100vh
  background: radial-gradient(circle at 12% 90%, rgba(96, 208, 255, 0.85), transparent 42%), radial-gradient(circle at 88% 84%, rgba(255, 88, 126, 0.75), transparent 38%), radial-gradient(circle at 50% 8%, rgba(255, 193, 181, 0.9), transparent 48%), linear-gradient(135deg, #b8c9f0 0%, #f6d0c3 48%, #f2e7d8 100%)
  color: var(--text-main)
  overflow: hidden

.wallpaper-blur
  position: absolute
  inset: 0
  backdrop-filter: blur(10px)
  opacity: 0.35
  pointer-events: none

.desktop-frame
  position: relative
  z-index: 1
  margin: 2rem
  height: calc(100dvh - 4rem)
  background: rgba(251, 252, 255, 0.74)
  border: 1px solid rgba(255, 255, 255, 0.5)
  border-radius: 1.5rem
  box-shadow: 0 28px 80px rgba(45, 56, 88, 0.18), 0 6px 20px rgba(58, 62, 77, 0.12)
  display: grid
  grid-template-columns: 13.5rem minmax(0, 1fr)
  overflow: hidden

.left-rail
  background: rgba(247, 248, 252, 0.88)
  border-right: 1px solid rgba(35, 40, 52, 0.06)
  padding: var(--space-4)
  display: grid
  align-content: start
  gap: var(--space-4)

.brand-block
  display: flex
  align-items: center
  gap: var(--space-2)

.brand-logo
  width: 2rem
  height: 2rem
  border-radius: 0.75rem
  display: grid
  place-items: center
  font-weight: 700
  font-size: 0.75rem
  color: #fff
  background: linear-gradient(135deg, #ff8f6b, #e56363)

.brand-meta
  display: grid
  gap: 0.125rem

.brand-name
  margin: 0
  font-weight: 700
  font-size: 0.95rem

.brand-sub
  margin: 0
  font-size: 0.75rem
  color: var(--text-soft)

.profile-card
  display: flex
  align-items: center
  gap: var(--space-2)
  background: rgba(255, 255, 255, 0.9)
  border: 1px solid var(--border-color)
  border-radius: var(--radius-2)
  padding: var(--space-2)

.avatar
  width: 2rem
  height: 2rem
  border-radius: 999px
  display: grid
  place-items: center
  background: linear-gradient(135deg, #dbe4ff, #ffd9e4)
  color: #4e4566
  font-weight: 700

.profile-copy
  display: grid
  gap: 0.125rem
  min-width: 0

.profile-name, .profile-desc
  margin: 0
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.profile-name
  font-size: 0.875rem
  font-weight: 600

.profile-desc
  font-size: 0.75rem
  color: var(--text-soft)

.side-nav
  display: grid
  gap: 0.375rem

.nav-item
  border: 0
  background: transparent
  color: #454c5f
  text-align: left
  border-radius: 0.65rem
  padding: 0.625rem 0.75rem
  cursor: pointer
  transition: background-color 120ms ease, color 120ms ease

.nav-item:hover
  background: rgba(183, 155, 213, 0.12)

.nav-item.is-active
  background: rgba(183, 155, 213, 0.2)
  color: #3b3550
  font-weight: 600

.workspace
  display: grid
  grid-template-rows: auto auto 1fr
  min-width: 0

.shell-topbar
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: var(--space-3)
  padding: var(--space-5) var(--space-5) var(--space-3)

.title-wrap
  display: grid
  gap: 0.35rem

.eyebrow
  margin: 0
  color: var(--text-soft)
  font-size: 0.85rem
  font-weight: 600

.title
  margin: 0
  font-size: clamp(1.35rem, 1.6vw + 1rem, 2rem)
  line-height: 1.15

.banner-error
  margin: 0 var(--space-5)
  padding: var(--space-2) var(--space-3)
  background: var(--danger-bg)
  color: var(--danger-text)
  border: 1px solid #f2c7c4
  border-radius: var(--radius-1)

.workspace-grid
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 0
  padding: var(--space-3) var(--space-5) var(--space-5)
  min-height: 0
  overflow: hidden

.main-pane
  min-width: 0
  min-height: 0
  display: grid
  grid-template-rows: auto 1fr
  gap: var(--space-3)

.prompt-strip
  display: grid
  grid-template-columns: auto minmax(0, 1fr) auto
  align-items: center
  gap: var(--space-2)
  padding: 0.85rem 1rem
  background: rgba(255, 255, 255, 0.78)
  border: 1px solid var(--border-color)
  border-radius: var(--radius-2)
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.6)

.prompt-icon
  width: 1.75rem
  height: 1.75rem
  border-radius: 0.65rem
  display: grid
  place-items: center
  color: var(--accent-strong)
  background: rgba(183, 155, 213, 0.12)

.prompt-copy
  margin: 0
  color: var(--text-soft)
  font-size: 0.9rem

.prompt-action
  border: 0
  border-radius: 999px
  background: rgba(183, 155, 213, 0.18)
  color: #5c4f7a
  padding: 0.45rem 0.75rem
  cursor: pointer

.shell-main
  display: flex
  flex-direction: column
  min-width: 0
  min-height: 0
  overflow: auto
  padding-right: 0.25rem

.shell-main > *
  flex: 1 1 auto
  min-height: 0

@media (max-width: 1100px)
  .desktop-frame
    grid-template-columns: 1fr

  .left-rail
    grid-template-columns: repeat(2, minmax(0, 1fr))
    align-items: start
    gap: var(--space-3)
    border-right: 0
    border-bottom: 1px solid rgba(35, 40, 52, 0.06)

  .side-nav
    grid-column: 1 / -1
    grid-template-columns: repeat(2, minmax(0, 1fr))

@media (max-width: 720px)
  .desktop-frame
    margin: 1rem
    height: calc(100dvh - 2rem)

  .shell-topbar
    flex-direction: column
    align-items: flex-start
    padding: var(--space-4)

  .workspace-grid
    padding: var(--space-3) var(--space-4) var(--space-4)

  .prompt-strip
    grid-template-columns: 1fr
    align-items: start

  .left-rail
    grid-template-columns: 1fr

  .side-nav
    grid-template-columns: 1fr
</style>
