<!-- projects/project-a/components/PlatformLoginPanel.vue -->
<script setup>
import { computed, onMounted, ref } from 'vue'
import { container } from '@app/container'
import { authApi } from '@app/api'

const authStore = container.resolve('auth')
const username = ref('admin')
const password = ref('5678')
const loading = ref(false)
const error = ref('')
const isOpen = ref(false)

const user = computed(() => authStore.state.user)
const isLoggedIn = computed(() => authStore.isLoggedIn())

async function restoreSession() {
  loading.value = true
  error.value = ''

  const { ok, data } = await authApi.restoreSession()
  if (!ok) {
    error.value = 'Session 取得失敗'
    loading.value = false
    return
  }

  loading.value = false
}

async function handleLogin() {
  if (loading.value) return
  loading.value = true
  error.value = ''

  const payload = { username: username.value, password: password.value }
  const { ok, data } = await authApi.login(payload)

  if (!ok || data.success === false) {
    error.value = data.message || '登入失敗'
    loading.value = false
    return
  }

  isOpen.value = false
  loading.value = false
}

async function handleLogout() {
  if (loading.value) return
  loading.value = true
  error.value = ''

  await authApi.logout()
  loading.value = false
}

onMounted(() => {
  restoreSession()
})
</script>

<template lang="pug">
.platform-login-panel
  //- .panel-status
    //- span.status-pill(:class="{ active: isLoggedIn }")
      | {{ isLoggedIn ? '已登入' : '未登入' }}
    span.status-text(v-if="user") {{ user.name }}

  .panel-actions
    .login-anchor
      button.action-btn(
        v-if="!isLoggedIn"
        type="button"
        @click="isOpen = !isOpen"
        :disabled="loading"
      ) 登入
      button.action-btn.outline(
        v-else
        type="button"
        @click="handleLogout"
        :disabled="loading"
      ) 
        span.status-text(v-if="user") {{ user.name }} 
        |{{ loading ? ' 登出中...' : ' / 登出' }}

    Teleport(to="body")
      .login-popover(v-if="isOpen && !isLoggedIn")
        h3.login-title 平台登入
        p.login-subtitle 使用測試帳密進行登入（帳號 demo / 密碼 demo123）
        form.login-form(@submit.prevent="handleLogin")
          input.input-field(
            v-model="username"
            type="text"
            autocomplete="username"
            placeholder="帳號"
          )
          input.input-field(
            v-model="password"
            type="password"
            autocomplete="current-password"
            placeholder="密碼"
          )
          .login-actions
            button.action-btn.outline(type="button" @click="isOpen = false") 關閉
            button.action-btn(type="submit" :disabled="loading")
              | {{ loading ? '登入中...' : '登入' }}
        p.panel-message.error(v-if="error") {{ error }}

  
      .login-overlay(v-if="isOpen && !isLoggedIn" @click.self="isOpen = false")

</template>

<style scoped lang="sass">
.platform-login-panel
  display: flex
  gap: 8px
  align-items: center
  justify-content: end
  // min-width: 220px
  flex-direction: row

.panel-status
  display: flex
  align-items: center
  gap: 8px

.status-pill
  padding: 4px 10px
  border-radius: 999px
  border: 1px solid #e2e8f0
  background: #f8fafc
  font-size: 11px
  font-weight: 700
  color: #475569

.status-pill.active
  border-color: #0f172a
  background: #0f172a
  color: #fff

.status-text
  font-size: 12px
  color: #334155
  font-weight: 600

.panel-form
  display: grid
  grid-template-columns: minmax(120px, 1fr) minmax(120px, 1fr) auto
  gap: 6px
  align-items: center

.input-field
  padding: 8px 10px
  border-radius: 10px
  border: 1px solid #e2e8f0
  background: #fff
  font-size: 12px

.action-btn
  padding: 8px 12px
  border-radius: 10px
  border: 1px solid #0f172a
  background: #0f172a
  color: #fff
  font-size: 12px
  font-weight: 700
  cursor: pointer

.action-btn.outline
  background: transparent
  color: #0f172a

.action-btn:disabled
  opacity: 0.6
  cursor: not-allowed

.panel-actions
  display: flex
  justify-content: flex-end

.panel-message
  margin: 0
  font-size: 11px

.panel-message.error
  color: #b91c1c

.panel-message.info
  color: #1d4ed8

.login-anchor
  position: relative
  z-index: 10001

.login-overlay
  position: fixed
  inset: 0
  background: rgba(15, 23, 42, 0.45)
  z-index: 10000

.login-popover
  position: fixed
  top: 64px
  right: 16px
  width: min(320px, 92vw)
  height: 30%
  max-height: 70vh
  display: flex
  flex-direction: column
  gap: 12px
  padding: 16px
  border-radius: 16px
  border: 1px solid rgba(15, 23, 42, 0.12)
  background: #fff
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.16)
  overflow: auto
  z-index: 10002

.login-title
  margin: 0
  font-size: 18px
  font-weight: 700
  color: #0f172a

.login-subtitle
  margin: 0
  font-size: 12px
  color: #64748b

.login-form
  display: flex
  flex-direction: column
  gap: 10px

.login-form input
  width: 100%
  min-height: 40px

.login-actions
  display: flex
  justify-content: flex-end
  gap: 8px
</style>
