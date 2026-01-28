<script setup>
import { container } from '@/app/container'
import MemberTable from '../components/MemberTable.vue'
import MemberEditor from '../components/MemberEditor.vue'
import { onMounted } from 'vue'
import { memberService } from '../services/memberService.js'

const memberStore = container.resolve('memberStore')

function setSearch(e) {
  memberStore.setSearch(e.target.value)
}

function openCreate() {
  memberStore.startCreate()
}

onMounted(() => {
  memberService.fetchList().catch(err => {
    console.error('[member/list] fetch members failed', err)
  })
})
</script>

<template lang="pug">
.member-page
  .toolbar
    .toolbar-main
      .search
        span.icon Search
        input(type="text" :value="memberStore.state.search" @input="setSearch" placeholder="搜尋會員")
      .pill Active User 950

    .actions
      button.primary(@click="openCreate") 新增會員
      button.icon-btn(title="匯出") ⬇
      button.icon-btn(title="刷新") ↻
      span.page-text 1 of 1
      button.icon-btn(title="上一頁") <
      button.icon-btn(title="下一頁") >

  MemberTable
  MemberEditor
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

.member-page
  padding: 18px
  background: linear-gradient(160deg, $sysBg, color-mix(in srgb, var(--primary) 6%, $sys_1))
  flex: 1
  display: flex
  flex-direction: column
  gap: 14px
  overflow: hidden

.toolbar
  display: flex
  align-items: center
  gap: 12px
  flex-wrap: nowrap
  // overflow-x: auto
  padding-bottom: 4px

.toolbar-main
  display: flex
  align-items: center
  gap: 12px
  flex: 1 1 auto
  min-width: 0
  flex-wrap: nowrap
  align-items: center

.search
  display: flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  min-width: 200px
  max-width: 320px
  flex: 0 1 260px

.search input
  border: none
  outline: none
  font-size: 14px
  flex: 1

.icon
  color: $sys_9

.pill
  padding: 10px 14px
  border-radius: 12px
  background: color-mix(in srgb, var(--sys-6) 12%, var(--sys-1))
  color: $sys_6
  border: 1px solid color-mix(in srgb, var(--sys-6) 40%, var(--sys-1))
  font-weight: 700
  white-space: nowrap

.actions
  display: flex
  align-items: center
  gap: 8px
  flex-wrap: nowrap
  justify-content: flex-end
  margin-left: auto
  padding-left: 6px
  flex-shrink: 0
  overflow-x: auto

.icon-btn
  width: 36px
  min-width: 36px
  max-width: 36px
  height: 36px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  cursor: pointer
  display: grid
  place-items: center
  white-space: nowrap
  padding: 0
  font-size: 14px
  line-height: 1
  color: $txtColor

.page-text
  color: $sys_9
  font-weight: 700

.primary
  height: 36px
  padding: 0 16px
  border-radius: 12px
  border: none
  background: linear-gradient(135deg, $primaryColor, $sys_4)
  color: $sys_1
  font-weight: 700
  cursor: pointer
  display: inline-flex
  align-items: center
  gap: 6px
  white-space: nowrap
  font-size: 13px
  line-height: 1
</style>
