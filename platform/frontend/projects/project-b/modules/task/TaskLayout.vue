<script setup>
import { computed } from "vue";
import { useRouter } from "vue-router";
import { container } from "@/app/container";

const router = useRouter();
const auth = container.resolve("auth");
const user = computed(() => auth.state.user || {});


</script>

<template lang="pug">
.task-layout
  //- header.header
    .brand()
      img.logo(src="/assets/icons/task.svg")
      .titles
        span.title 任務工作台
        span.subtitle 協作、追蹤與進度

  .module-body
    slot
</template>

<style scoped lang="sass">
.task-layout
  width: 100%
  height: 100%
  display: flex
  flex-direction: column
  // background: linear-gradient(135deg, #f7f9ff, #eef2fb)
  overflow: hidden

.header
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0 20px
  background: rgba(255,255,255,0.78)
  backdrop-filter: blur(10px)
  border-bottom: 1px solid #e7e9f2
  box-shadow: 0 8px 20px rgba(34,65,121,0.08)

.brand
  display: flex
  align-items: center
  gap: 12px
  cursor: pointer

.logo
  width: 34px
  height: 34px
  padding: 6px
  border-radius: 12px
  background: #0c1c3a

.titles
  display: flex
  flex-direction: column
  gap: 4px

.title
  font-size: 20px
  font-weight: 700
  color: #0b1a33

.subtitle
  font-size: 13px
  color: #62718a

.actions
  display: flex
  gap: 10px
  align-items: center

.rounded
  border: none
  padding: 10px 16px
  border-radius: 12px
  background: linear-gradient(135deg, #0f1b3d, #1c3f8c)
  color: #fff
  font-weight: 600
  cursor: pointer
  box-shadow: 0 10px 24px rgba(12,27,61,0.25)
  transition: transform .15s ease, box-shadow .15s ease

  &:hover
    transform: translateY(-1px)
    box-shadow: 0 12px 26px rgba(28,63,140,0.28)

  &:active
    transform: translateY(0)

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

.module-body
  flex: 1
  display: flex
  overflow: hidden
</style>
