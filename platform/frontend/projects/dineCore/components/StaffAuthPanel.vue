<script setup>
import { reactive } from 'vue'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'

const props = defineProps({
  demoTableCode: {
    type: String,
    default: 'A01'
  },
  demoQrImageUrl: {
    type: String,
    default: ''
  },
  demoEntryPath: {
    type: String,
    default: ''
  },
  demoEntryUrl: {
    type: String,
    default: ''
  }
})

const staffAuth = useDineCoreStaffAuth()
const loginForm = reactive({
  account: '',
  password: ''
})

const demoAccount = 'manager'
const demoPassword = 'manager123'

async function submitStaffLogin() {
  await staffAuth.signIn({
    account: loginForm.account,
    password: loginForm.password
  })
}

function clearLoginError() {
  staffAuth.clearError()
}

function fillDemoCredentials() {
  loginForm.account = demoAccount
  loginForm.password = demoPassword
  clearLoginError()
}
</script>

<template lang="pug">
.staff-auth-full
  .staff-auth-full__panel
    .staff-auth-copy
      p.staff-auth-copy__eyebrow 員工登入
      h1.staff-auth-copy__title DineCore 後台登入
      p.staff-auth-copy__lead QRC 點餐系統 DEMO，使用 PHP + MySQL + Vue.js 建構。請使用 manager 帳號登入後台操作。
        //- br 
        small( style="color: #aaa;") 若要測試點餐流程，請使用下方連結或右上角手機 QR Code 進入點餐頁面。
        br
        a(
          :href="props.demoEntryPath"
          style="color: #007bff; text-decoration: underline;"
          target="_blank"
          rel="noopener noreferrer"
        ) {{ `桌號 ${props.demoTableCode} 點餐入口` }}
    form.staff-auth-form(@submit.prevent="submitStaffLogin()")
      label.staff-auth-form__field
        span.staff-auth-form__label 帳號
        input.staff-auth-form__input(
          v-model="loginForm.account"
          type="text"
          autocomplete="username"
          placeholder="請輸入員工帳號"
          @input="clearLoginError()"
        )
      label.staff-auth-form__field
        span.staff-auth-form__label 密碼
        input.staff-auth-form__input(
          v-model="loginForm.password"
          type="password"
          autocomplete="current-password"
          placeholder="請輸入登入密碼"
          @input="clearLoginError()"
        )
      p.staff-auth-form__error(v-if="staffAuth.state.errorMessage") {{ staffAuth.state.errorMessage }}
      button.staff-auth-form__submit(type="submit" :disabled="staffAuth.state.isSubmitting")
        | {{ staffAuth.state.isSubmitting ? '登入中...' : '登入' }}
      .staff-auth-form__hint
        span 測試帳號：
        button.staff-auth-form__demo-fill(type="button" @click="fillDemoCredentials()")
          code {{ `${demoAccount} / ${demoPassword}` }}
          span （點擊填入資料）
  .staff-demo-qr.staff-demo-qr--floating
    h2.staff-demo-qr__title 桌號 {{ props.demoTableCode }} 手機點餐入口
    img.staff-demo-qr__image(
      :src="props.demoQrImageUrl"
      :alt="`桌號 ${props.demoTableCode} QR`"
    )
    a.staff-demo-qr__link(:href="props.demoEntryPath" target="_blank" rel="noopener noreferrer") {{ props.demoEntryUrl }}
</template>
