<script setup>
import { computed } from 'vue'
import { container } from '@/app/container'
import { memberService } from '../services/memberService.js'

const memberStore = container.resolve('memberStore')
// 預防舊模板殘留 emit 呼叫，明確宣告（實際不對外派發）
const emit = defineEmits([])

const members = computed(() => {
  const keyword = memberStore.state.search.trim().toLowerCase()
  if (!keyword) return memberStore.state.members
  return memberStore.state.members.filter(m =>
    m.name.toLowerCase().includes(keyword) ||
    m.company.toLowerCase().includes(keyword) ||
    m.email.toLowerCase().includes(keyword)
  )
})

const statusTokens = {
  Active: '--sys-6',
  Inactive: '--sys-8',
  Prospect: '--primary'
}

const permissionTokens = {
  admin: '--sys-7',
  editor: '--sys-3',
  viewer: '--sys-9'
}

function chipStyle(status) {
  const token = statusTokens[status] || '--sys-5'
  const base = `var(${token})`
  return {
    background: `color-mix(in srgb, ${base} 15%, transparent)`,
    color: status === 'Inactive' ? 'var(--sys-8)' : 'var(--sys-2)',
    border: `1px solid ${base}`
  }
}

function permissionStyle(permission) {
  const token = permissionTokens[permission] || '--sys-5'
  const base = `var(${token})`
  return {
    background: `color-mix(in srgb, ${base} 12%, transparent)`,
    color: 'var(--text)',
    border: `1px solid ${base}`
  }
}

function avatarInitial(name) {
  return name?.trim().charAt(0).toUpperCase() || '?'
}

function handleEdit(member) {
  memberStore.startEdit(member)
}

async function handleDelete(member) {
  const ok = confirm(`確認刪除 ${member?.name || '這位會員'} 嗎？`)
  if (!ok) return
  try {
    await memberService.remove(member.id)
  } catch (err) {
    console.error('[memberTable] delete failed', err)
    alert('刪除失敗，請稍後再試')
  }
}
</script>

<template lang="pug">
.table
  .thead
    .cell.checkbox
      input(type="checkbox")
    .cell Name
    .cell Title
    .cell Company Name
    .cell Email Address
    .cell Lead Source
    .cell Permission
    .cell Status
    .cell Actions

  .tbody
    .row(v-for="m in members" :key="m.id")
      .cell.checkbox
        input(type="checkbox")
      .cell.name
        .avatar(:class="{ initial: !m.avatar }")
          img(v-if="m.avatar" :src="m.avatar" alt="avatar")
          span(v-else) {{ avatarInitial(m.name) }}
          span.dot(:class="{ online: m.online }")
        .info
          p.title {{ m.name }}
          p.handle {{ m.title }}
      .cell {{ m.title }}
      .cell {{ m.company }}
      .cell {{ m.email }}
      .cell {{ m.source }}
      .cell
        span.chip(:style="permissionStyle(m.permission)") {{ m.permission || 'viewer' }}
      .cell
        span.chip(:style="chipStyle(m.status)") {{ m.status }}
      .cell.more
        button.icon-btn(@click="handleEdit(m)" title="編輯") ✎
        button.icon-btn.danger(@click="handleDelete(m)" title="刪除") 🗑
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

* 
  box-sizing: border-box
.table
  width: 100%
  border: 1px solid $borderColor
  border-radius: 16px
  background: $sys_1
  box-shadow: 0 10px 28px rgba(16,40,89,0.08)
  overflow: auto

.thead, .row
  display: grid
  grid-template-columns: 60px 1.5fr 1.2fr 1.2fr 1.6fr 1fr 0.9fr 1fr 0.9fr
  align-items: center

.thead
  background: $sysBg
  color: $sys_9
  font-weight: 700
  padding: 14px 18px
  position: sticky
  top: 0
  z-index: 2
  border-bottom: 1px solid $primaryColor
  color: $primaryColor
.tbody
  display: flex
  flex-direction: column

.row
  padding: 14px 18px
  border-top: 1px solid $borderColor
  color: $txtColor
  font-size: 14px

  &:hover
    background: $sysBg

.cell
  display: flex
  align-items: center
  gap: 10px
  padding: .25em

.cell.checkbox
  justify-content: center

.cell.name
  gap: 12px

.avatar
  position: relative
  width: 42px
  height: 42px
  border-radius: 12px
  overflow: hidden
  background: linear-gradient(145deg, $primaryColor, $sys_4)
  color: $sys_1
  display: grid
  place-items: center
  font-weight: 700

.avatar img
  width: 100%
  height: 100%
  object-fit: cover

.avatar.initial
  background: $sysBg
  color: $txtColor

.dot
  position: absolute
  width: 10px
  height: 10px
  border-radius: 50%
  background: $sys_9
  border: 2px solid $sys_1
  bottom: 2px
  right: 2px

.dot.online
  background: $sys_6

.info
  display: flex
  flex-direction: column
  gap: 3px

.info .title
  margin: 0
  font-weight: 700
  color: $txtColor

.info .handle
  margin: 0
  color: $sys_9
  font-size: 13px

.chip
  padding: 6px 10px
  border-radius: 10px
  font-weight: 700
  font-size: 12px

.more
  justify-content: center
  gap: 6px

.icon-btn
  width: 32px
  height: 32px
  border-radius: 10px
  border: 1px solid $borderColor
  background: $sysBg
  cursor: pointer
  display: grid
  place-items: center
  padding: 0
  line-height: 1
  font-size: 13px
  color: $txtColor

.icon-btn.danger
  color: $sys_8
  border-color: $sys_8
  background: color-mix(in srgb, var(--sys-8) 12%, var(--sys-1))
</style>
