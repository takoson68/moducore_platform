<!-- // src/components/LoginButton.vue -->
<script setup>
import { ref, computed } from "vue";
import LoginModal from "@/components/LoginModal.vue";
import { container } from "@/app/container";
import { useRouter } from "vue-router";

const showLogin = ref(false);
const auth = container.resolve("auth");

// 統一透過 container 取得登入狀態
const isLoggedIn = computed(() => auth.isLoggedIn());
const user = computed(() => auth.get()?.user);
const router = useRouter();

function openLogin() {
  showLogin.value = true;
}

function closeLogin() {
  showLogin.value = false;
}

function logout() {
  auth.logout();
  router.replace("/");
}
</script>

<template lang="pug">
.login-btn-wrapper
  //- 未登入
  button.login-btn(
    v-if="!isLoggedIn"
    type="button"
    @click="openLogin"
  ) 登入

  //- 已登入
  .user-box(v-else)
    span.user-name {{ user?.name || user?.username }}
    button.logout-btn(type="button" @click="logout") 登出

  LoginModal(
    v-model="showLogin"
    @login-success="closeLogin"
  )
</template>

<style lang="sass" scoped>
.login-btn-wrapper
  display: inline-flex
  align-items: center
  gap: 10px

.login-btn
  padding: 0.6em 1.1em
  background-color: $sys_3
  color: white
  border: none
  border-radius: 6px
  cursor: pointer
  font-weight: 600
  transition: transform 0.2s ease, box-shadow 0.2s ease

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 10px 24px rgba(37,99,235,0.28)

  &:active
    transform: translateY(1px)

.user-box
  display: inline-flex
  align-items: center
  gap: 8px
  font-weight: 600

.user-name
  color: var(--text)

.logout-btn
  padding: 0.45em 0.8em
  background: transparent
  border: 1px solid var(--border)
  border-radius: 6px
  cursor: pointer
  font-size: 0.9em
  transition: all 0.2s ease
  color: $sys_2
  &:hover
    border-color: var(--primary)
    color: var(--primary)
</style>
