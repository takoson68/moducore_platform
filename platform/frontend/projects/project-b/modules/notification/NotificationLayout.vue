<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { container } from "@/app/container";

const router = useRouter();
const authStore = container.resolve("auth");
const userName = computed(() => authStore.state.user?.name || "");

function logout() {
  authStore.logout();
  router.replace("/");
}
</script>

<template lang="pug">
.notification-layout
  header.header
    .left
      img.logo(src="/assets/icons/notification.svg")
      .titles
        h1 通知中心
        p.subtitle 跨模組事件、推播系統訊息
    .actions
      slot(name="actions")
      button.ghost(@click="logout") {{ userName }} / 登出

  .body
    slot

</template>

<style scoped lang="sass">
.notification-layout
  width: 100%
  height: 100%
  display: flex
  flex-direction: column
  background: linear-gradient(135deg, #f7f9ff, #eef2fb)
  position: relative
  box-sizing: border-box
.header
  display: flex
  justify-content: space-between
  align-items: center
  padding: 16px 20px
  background: rgba(255,255,255,0.85)
  border-bottom: 1px solid #e5e8f2
  box-shadow: 0 8px 18px rgba(23, 47, 98, 0.08)
  backdrop-filter: blur(10px)

.left
  display: flex
  align-items: center
  gap: 12px

.logo
  width: 34px
  height: 34px
  padding: 6px
  border-radius: 12px
  background: #0c1c3a

.titles h1
  margin: 0
  font-size: 20px
  color: #0b1a33

.subtitle
  margin: 4px 0 0 0
  font-size: 13px
  color: #66748f

.actions
  display: flex
  gap: 10px
  align-items: center

.body
  flex: 1
  overflow: auto

.ghost
  padding: 9px 14px
  border-radius: 12px
  border: 1px solid #d4daea
  background: #fff
  color: #1e2c4b
  cursor: pointer
  transition: 0.15s ease

  &:hover
    background: #f1f4fb


</style>
