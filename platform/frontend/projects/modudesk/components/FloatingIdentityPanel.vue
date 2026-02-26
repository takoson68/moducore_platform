<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useIdentity } from '@project/composables/useIdentity.js'

const expanded = ref(false)
const displayName = ref('')
const localError = ref('')
const anchorEl = ref(null)
const panelPosition = ref({ top: 72, right: 24 })
const {
  identity,
  isLoggedIn,
  loading,
  error,
  ensureHydrated,
  login,
  logout
} = useIdentity()

const mergedError = computed(() => localError.value || error.value)

onMounted(async () => {
  await ensureHydrated()
  if (identity.value?.displayName) {
    displayName.value = identity.value.displayName
  }

  window.addEventListener('resize', updatePanelPosition)
  window.addEventListener('scroll', updatePanelPosition, true)
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', updatePanelPosition)
  window.removeEventListener('scroll', updatePanelPosition, true)
})

async function handleLogin() {
  localError.value = ''
  try {
    await login({ displayName: displayName.value })
    expanded.value = false
  } catch (err) {
    localError.value = err instanceof Error ? err.message : '登入失敗'
  }
}

async function handleLogout() {
  localError.value = ''
  try {
    await logout()
  } catch (err) {
    localError.value = err instanceof Error ? err.message : '登出失敗'
  }
}

function togglePanel() {
  expanded.value = !expanded.value
  if (!displayName.value && identity.value?.displayName) {
    displayName.value = identity.value.displayName
  }

  if (expanded.value) {
    nextTick(() => {
      updatePanelPosition()
    })
  }
}

function updatePanelPosition() {
  if (!anchorEl.value) return

  const rect = anchorEl.value.getBoundingClientRect()
  const viewportWidth = window.innerWidth || 0
  const gap = 8
  const fallbackRight = 12

  panelPosition.value = {
    top: Math.round(rect.bottom + gap),
    right: Math.max(fallbackRight, Math.round(viewportWidth - rect.right))
  }
}
</script>

<template lang="pug">
.floating-identity(:class="{ 'is-open': expanded }")
  button.status-chip(
    ref="anchorEl"
    type="button"
    @click="togglePanel"
    :aria-expanded="expanded"
    :aria-label="isLoggedIn ? '開啟身份面板' : '開啟登入面板'"
  ) {{ isLoggedIn ? (identity?.displayName || '已登入') : '登入' }}
  .identity-panel(v-if="expanded" :style="{ top: `${panelPosition.top}px`, right: `${panelPosition.right}px` }")
    .identity-panel-head
      p.identity-panel-title 專案登入元件
      button.identity-close-btn(type="button" @click="expanded = false") ×
    p.identity-state-line(v-if="isLoggedIn") 目前身份：{{ identity?.displayName }}
    p.identity-state-line(v-else) 尚未登入（可在任何頁面操作）
    label.identity-field
      span.identity-label 顯示名稱
      input.identity-input(
        v-model="displayName"
        type="text"
        placeholder="輸入名稱"
        :disabled="loading"
        @keydown.enter.prevent="handleLogin"
      )
    p.identity-error(v-if="mergedError") {{ mergedError }}
    .identity-actions
      button.identity-btn(type="button" :disabled="loading" @click="handleLogin") 登入
      button.identity-btn.identity-btn-secondary(type="button" :disabled="loading" @click="handleLogout") 登出
</template>

<style lang="sass">
.floating-identity
  display: grid
  justify-items: end
  gap: 0.35rem
  position: relative
  z-index: 5

.status-chip
  border: 1px solid rgba(36, 42, 54, 0.06)
  background: rgba(244, 245, 249, 0.9)
  color: #70788c
  border-radius: 999px
  padding: 0.45rem 0.85rem
  font-size: 0.9rem
  box-shadow: 0 6px 18px rgba(32, 39, 56, 0.08)
  cursor: pointer
  transition: background-color 120ms ease, color 120ms ease

.status-chip:hover
  background: rgba(236, 238, 244, 0.95)
  color: #5d6578

.identity-panel
  position: fixed
  width: min(22rem, calc(100vw - 2rem))
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(36, 42, 54, 0.08)
  border-radius: 1rem
  padding: 0.9rem
  display: grid
  gap: 0.65rem
  box-shadow: 0 16px 36px rgba(32, 39, 56, 0.18)
  backdrop-filter: blur(12px)
  transform-origin: top right
  margin-top: 0.15rem

.identity-panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 0.5rem

.identity-panel-title
  margin: 0
  font-weight: 700
  color: #2a3040

.identity-close-btn
  width: 1.8rem
  height: 1.8rem
  border-radius: 999px
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: #fff
  cursor: pointer

.identity-state-line
  margin: 0
  color: #6c7387
  font-size: 0.875rem

.identity-field
  display: grid
  gap: 0.35rem

.identity-label
  font-size: 0.8rem
  font-weight: 600
  color: #4b5367

.identity-input
  width: 100%
  border: 1px solid rgba(36, 42, 54, 0.09)
  background: rgba(255, 255, 255, 0.86)
  border-radius: 0.8rem
  padding: 0.65rem 0.8rem
  font: inherit

.identity-error
  margin: 0
  color: #b42318
  font-size: 0.85rem

.identity-actions
  display: flex
  flex-wrap: wrap
  gap: 0.5rem

.identity-btn
  border: 0
  background: linear-gradient(135deg, #c7b4e2, #b59bda)
  color: #fff
  border-radius: 999px
  padding: 0.5rem 0.85rem
  cursor: pointer
  box-shadow: 0 8px 18px rgba(181, 155, 218, 0.2)

.identity-btn-secondary
  background: rgba(255, 255, 255, 0.9)
  color: #283044
  border: 1px solid rgba(36, 42, 54, 0.08)
  box-shadow: none

.identity-btn:disabled
  opacity: 0.6
  cursor: not-allowed

@media (max-width: 640px)
  .status-chip
    font-size: 0.82rem
    padding: 0.4rem 0.75rem

  .identity-panel
    width: min(20rem, calc(100vw - 1.5rem))
</style>
