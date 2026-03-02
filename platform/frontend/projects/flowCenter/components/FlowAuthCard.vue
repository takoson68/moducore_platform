<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const open = ref(false)
const form = reactive({
  username: 'fc_employee_a',
  password: 'flow1234'
})

const roleLabelMap = {
  employee: '員工',
  manager: '主管'
}

const companyLabelMap = {
  'company-a': '公司 A',
  'company-b': '公司 B'
}

const currentUser = computed(() => {
  if (!auth.isLoggedIn.value) {
    return {
      name: '尚未登入',
      role: '訪客',
      company: '未指定'
    }
  }

  return {
    name: auth.displayName.value || auth.user.value?.name || auth.user.value?.username || '使用者',
    role: roleLabelMap[auth.role.value] || auth.role.value,
    company: companyLabelMap[auth.companyId.value] || auth.companyId.value
  }
})

async function handleLogin() {
  if (auth.state.loggingIn) return

  const result = await auth.login({
    username: form.username,
    password: form.password
  })

  if (result.ok) {
    open.value = false
  }
}

async function handleLogout() {
  if (auth.state.loading) return
  await auth.logout()
  open.value = false
}

onMounted(() => {
  auth.restoreSession()
})
</script>

<template lang="pug">
.auth-card.flow-glass
  .auth-copy
    p.auth-label 目前登入狀態
    strong.auth-name {{ currentUser.name }}
    p.auth-meta {{ currentUser.role }} ｜ {{ currentUser.company }}
  button.auth-action(v-if="!auth.isLoggedIn.value" type="button" @click="open = !open") {{ auth.state.loggingIn ? '登入中' : '登入' }}
  button.auth-action(v-else type="button" @click="handleLogout") {{ auth.state.loading ? '登出中' : '登出' }}
  Teleport(to="body")
    .auth-overlay(v-if="open && !auth.isLoggedIn.value" @click.self="open = false")
      .auth-popover.flow-glass
        h3.popover-title Flow Center 登入
        p.popover-subtitle 使用已建立的測試帳號登入後端 API
        form.auth-form(@submit.prevent="handleLogin")
          label.auth-field
            span 帳號
            input(v-model="form.username" type="text" autocomplete="username")
          label.auth-field
            span 密碼
            input(v-model="form.password" type="password" autocomplete="current-password")
          p.auth-hint 可用帳號：fc_employee_a / fc_manager_a / fc_employee_b / fc_manager_b
          p.auth-error(v-if="auth.state.error") {{ auth.state.error }}
          .auth-actions
            button.auth-secondary(type="button" @click="open = false") 取消
            button.auth-primary(type="submit" :disabled="auth.state.loggingIn") {{ auth.state.loggingIn ? '登入中' : '登入' }}
</template>

<style lang="sass">
.auth-card
  min-width: 220px
  padding: 14px 16px
  border-radius: 18px
  display: grid
  grid-template-columns: 1fr auto
  gap: 14px
  align-items: center

.auth-copy
  display: grid
  gap: 4px

.auth-label
  margin: 0
  font-size: 12px
  color: rgba(90, 79, 116, 0.58)

.auth-name
  color: #241b31
  font-size: 15px

.auth-meta
  margin: 0
  color: rgba(63, 54, 79, 0.68)
  font-size: 13px

.auth-action, .auth-primary, .auth-secondary
  border: 0
  border-radius: 999px
  padding: 10px 14px
  font-weight: 700
  cursor: pointer

.auth-action, .auth-primary
  background: linear-gradient(135deg, #ff9d7d 0%, #f477a7 100%)
  color: #fff

.auth-secondary
  background: rgba(255, 255, 255, 0.8)
  color: #241b31

.auth-overlay
  position: fixed
  inset: 0
  background: rgba(36, 27, 49, 0.2)
  display: grid
  place-items: start end
  padding: 96px 40px 40px
  z-index: 50

.auth-popover
  width: min(340px, calc(100vw - 32px))
  border-radius: 24px
  padding: 22px
  display: grid
  gap: 14px

.popover-title
  margin: 0
  font-size: 20px
  color: #241b31

.popover-subtitle
  margin: 0
  color: rgba(63, 54, 79, 0.68)

.auth-form
  display: grid
  gap: 12px

.auth-field
  display: grid
  gap: 8px

.auth-field span
  font-size: 13px
  font-weight: 600
  color: rgba(63, 54, 79, 0.76)

.auth-field input
  border: 0
  border-radius: 16px
  padding: 14px 16px
  background: rgba(255, 255, 255, 0.82)
  color: #241b31
  outline: none

.auth-hint
  margin: 0
  font-size: 12px
  color: rgba(90, 79, 116, 0.62)

.auth-error
  margin: 0
  font-size: 13px
  color: #b91c1c

.auth-actions
  display: flex
  justify-content: flex-end
  gap: 10px

@media (max-width: 960px)
  .auth-card
    width: 100%

  .auth-overlay
    padding: 84px 16px 16px
</style>
