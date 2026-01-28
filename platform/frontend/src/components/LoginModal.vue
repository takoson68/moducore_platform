<script setup>
import { reactive, ref } from "vue";
import { container } from "@/app/container";
import { useRouter } from 'vue-router'
const router = useRouter()

const props = defineProps({
  modelValue: { type: Boolean, default: false },
});

const emit = defineEmits(["update:modelValue", "login-success"]);

const form = reactive({
  email: "admin@company.com",
  password: "1234",
  tenant: "admin",
});

const loading = ref(false);
const error = ref("");

const checkList = [
  "密碼至少 10 碼，含大小寫與符號",
  "設定登入提示通知並寫下備註",
  "在個人設定開啟二步驗證（MFA）",
];

const authStore = container.resolve("auth");

function close() {
  emit("update:modelValue", false);
}

async function submit() {
  if (loading.value) return;
  loading.value = true;
  error.value = "";

  try {
    await authStore.login({
      username: form.email,
      password: form.password,
      tenant: form.tenant,
    });

    emit("login-success");
    close();
    // window.location.assign('/dashboard')
    router.push('/dashboard')
  } catch (err) {
    console.error("[LoginModal] login failed", err);
    error.value = err.message || "登入失敗，請檢查帳號密碼";
  } finally {
    loading.value = false;
  }
}


</script>

<template lang="pug">
Teleport(to="body")
  transition(name="fade")
    .login-overlay(v-if="modelValue" @click.self="close")
      transition(name="scale-in")
        .login-modal(v-if="modelValue")
          .modal-head
            .meta
              h2 登入 ModuCore
            button.close-btn(type="button" aria-label="關閉登入" @click="close") ×
          form(@submit.prevent="submit")
            label.form-field
              span Email
              input(type="email" name="email" placeholder="you@company.com" v-model="form.email" required)
            label.form-field
              span 密碼
              input(type="password" name="password" placeholder="••••••••" v-model="form.password" required)
              a.forgot(href="#") 忘記密碼？
            label.form-field
              span 租戶代碼（選填）
              input(type="text" name="tenant" placeholder="ex: acme-prod" v-model="form.tenant")
            button.primary-btn(type="submit" :disabled="loading") {{ loading ? "登入中..." : "立即登入" }}
          .divider
            span 或
          .oauth-btns
            button.secondary-btn(type="button") 使用 SSO
            button.secondary-btn(type="button") Magic Link
          .checklist
            h4 登入小提醒
            ul
              li(v-for="item in checkList" :key="item") {{ item }}
</template>

<style lang="sass" scoped>
.login-overlay
  position: fixed
  inset: 0
  background: rgba(0, 0, 0, 0.5)
  display: flex
  align-items: center
  justify-content: center
  padding: 24px
  z-index: 9999

.login-modal
  width: min(540px, 100%)
  padding: 24px
  border-radius: 16px
  border: 1px solid var(--border)
  background: var(--surface)
  box-shadow: 0 18px 48px rgba(0,0,0,0.16)
  display: grid
  gap: 16px

.modal-head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: start

.muted
  margin: 0
  color: #4b5563

.close-btn
  background: transparent
  border: 1px solid var(--border)
  border-radius: 50%
  width: 34px
  height: 34px
  display: grid
  place-items: center
  font-size: 16px
  cursor: pointer
  transition: border-color 0.2s ease, transform 0.2s ease

.close-btn:hover
  border-color: var(--primary)
  transform: scale(1.04)

form
  display: grid
  gap: 12px

.form-field
  display: grid
  gap: 6px
  font-size: 14px
  color: #4b5563

.form-field input
  width: 100%
  padding: 12px
  border-radius: 10px
  border: 1px solid var(--border)
  background: #fff
  color: var(--text)
  transition: border-color 0.2s ease, box-shadow 0.2s ease

.form-field input:focus
  outline: none
  border-color: var(--primary)
  box-shadow: 0 0 0 4px rgba(37,99,235,0.16)

.forgot
  justify-self: flex-end
  font-size: 13px
  color: var(--primary)

.primary-btn
  width: 100%
  padding: 12px
  border: none
  border-radius: 10px
  background: var(--primary)
  color: #fff
  font-weight: 700
  cursor: pointer
  transition: transform 0.2s ease, box-shadow 0.2s ease

.primary-btn:hover:enabled
  transform: translateY(-1px)
  box-shadow: 0 10px 24px rgba(37,99,235,0.3)

.primary-btn:disabled
  opacity: 0.7
  cursor: not-allowed

.divider
  position: relative
  text-align: center
  color: #6b7280
  font-size: 13px
  margin-top: -4px

.divider::before, .divider::after
  content: ''
  position: absolute
  top: 50%
  width: 40%
  height: 1px
  background: var(--border)

.divider::before
  left: 0

.divider::after
  right: 0

.oauth-btns
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr))
  gap: 10px

.secondary-btn
  padding: 11px
  border-radius: 10px
  border: 1px solid var(--border)
  background: var(--surface)
  cursor: pointer
  transition: border-color 0.2s ease, transform 0.2s ease

.secondary-btn:hover
  border-color: var(--primary)
  transform: translateY(-1px)

.checklist
  padding: 12px
  border-radius: 10px
  background: rgba(16,185,129,0.06)
  border: 1px solid rgba(16,185,129,0.2)
  color: #065f46
  display: grid
  gap: 8px

.checklist h4
  margin: 0

.checklist ul
  margin: 0
  padding-left: 18px
  display: grid
  gap: 4px

.checklist li
  line-height: 1.4

.fade-enter-active, .fade-leave-active
  transition: opacity 0.2s ease

.fade-enter-from, .fade-leave-to
  opacity: 0

.scale-in-enter-active, .scale-in-leave-active
  transition: transform 0.2s ease, opacity 0.2s ease

.scale-in-enter-from, .scale-in-leave-to
  transform: scale(0.97)
  opacity: 0

@media (max-width: 640px)
  .login-modal
    padding: 20px
</style>
