<script setup>
import { computed } from 'vue'
import { container } from '@/app/container'

// 假設已有 authStore（guest / authenticated / admin）
const auth = container.resolve('auth')

// 世界狀態（僅用於顯示）
const world = computed(() => {
  if (auth.state.status === 'guest') return 'GUEST'
  if (auth.state.user?.role === 'admin') return 'ADMIN'
  return 'USER'
})

// 模組顯示狀態（純展示）
const modules = computed(() => ([
  {
    name: 'shell',
    status: 'loaded',
    reason: '平台核心'
  },
  {
    name: 'dashboard',
    status: auth.state.status === 'guest' ? 'disabled' : 'loaded',
    reason: '需登入'
  },
  {
    name: 'profile',
    status: auth.state.status === 'guest' ? 'disabled' : 'loaded',
    reason: '需登入'
  },
  {
    name: 'admin',
    status: auth.state.user?.role === 'admin' ? 'loaded' : 'disabled',
    reason: '僅限管理者'
  }
]))

const futureModules = [
  { name: 'task' },
  { name: 'comment' }
]
</script>



<template lang="pug">
.shell-landing
  //────────────────────────────
  // 世界狀態列
  //────────────────────────────
  header.world-header
    .logo ModuCore
    .world
      span.label 世界
      span.badge(:class="world.toLowerCase()") {{ world }}

  //────────────────────────────
  // 平台定位說明
  //────────────────────────────
  section.statement
    h1 模組化前端平台
    p 用模組組合出不同「世界」的系統架構

  //────────────────────────────
  // 模組插槽顯示
  //────────────────────────────
  section.module-slots
    h2 模組插槽狀態

    ul.list
      li.item(
        v-for="mod in modules"
        :key="mod.name"
        :class="mod.status"
      )
        span.name {{ mod.name }}
        span.status
          | {{ mod.status === 'loaded' ? '已載入' : '未啟用' }}
        span.reason(v-if="mod.status === 'disabled'") （{{ mod.reason }}）

    hr.divider

    //- ul.list.future
    //-   li.item.future(
    //-     v-for="mod in futureModules"
    //-     :key="mod.name"
    //-   )
    //-     span.name {{ mod.name }}
    //-     span.status 即將推出

  //────────────────────────────
  // 世界流程提示
  //────────────────────────────
  section.flow-hint
    p
      | 目前正在以
      strong {{ world === 'GUEST' ? '訪客' : world === 'ADMIN' ? '管理者' : '使用者' }}
      |  身分瀏覽平台
    button.enter
      | 進入下一個世界

</template>


<style lang="sass">

.shell-landing
  padding: 32px
  width: 100%
  max-width: 1250px
  margin: 0 auto
  font-family: system-ui, sans-serif

.world-header
  display: flex
  justify-content: space-between
  align-items: center
  margin-bottom: 32px

  .logo
    font-weight: 700
    font-size: 20px

  .world
    display: flex
    align-items: center
    gap: 8px

    .label
      font-size: 12px
      opacity: .6

    .badge
      padding: 4px 10px
      border-radius: 20px
      font-size: 12px
      font-weight: 600

      &.guest
        background: #eee
        color: #333

      &.user
        background: #dbeafe
        color: #1e40af

      &.admin
        background: #fee2e2
        color: #991b1b

.statement
  margin-bottom: 40px

  h1
    font-size: 24px
    margin-bottom: 6px

  p
    opacity: .7

.module-slots
  margin-bottom: 40px

  h2
    font-size: 18px
    margin-bottom: 16px

  .list
    list-style: none
    padding: 0
    margin: 0

    &.future
      opacity: .5

  .item
    display: grid
    grid-template-columns: 1fr auto auto
    gap: 12px
    padding: 10px 0
    border-bottom: 1px dashed #ddd
    align-items: center

    &.loaded .status
      color: #16a34a

    &.disabled .status
      color: #ca8a04

    &.future .status
      font-style: italic

    .name
      font-weight: 500

    .status
      font-size: 12px

    .reason
      font-size: 12px
      opacity: .6

  .divider
    margin: 24px 0
    border: none
    border-top: 1px solid #eee

.flow-hint
  display: flex
  justify-content: space-between
  align-items: center
  padding-top: 24px
  border-top: 1px solid #eee

  p
    margin: 0

  .enter
    padding: 8px 16px
    border-radius: 6px
    border: 1px solid #ccc
    background: white
    cursor: pointer

    &:hover
      background: #f9f9f9
  
</style>