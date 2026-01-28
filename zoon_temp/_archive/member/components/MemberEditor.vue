<script setup>
import { computed, reactive, watch } from 'vue'
import { container } from '@/app/container'
import { memberService } from '../services/memberService.js'

const memberStore = container.resolve('memberStore')
const authStore = container.resolve('auth')

const open = computed(() => memberStore.state.editorOpen)
const editingMember = computed(() => memberStore.state.editingMember)
const allowAdmin = computed(() => authStore.state.user?.role === 'admin')

const form = reactive({
  name: '',
  title: '',
  company: '',
  email: '',
  source: '',
  status: 'Active',
  avatar: '',
  online: false,
  permission: 'viewer'
})

const statusOptions = ['Active', 'Inactive', 'Prospect']
const permissionOptions = ['admin', 'editor', 'viewer']

const titleText = computed(() => editingMember.value ? '編輯會員' : '新增會員')
const actionLabel = computed(() => editingMember.value ? '儲存變更' : '新增會員')
const onlineId = computed(() => `online-${editingMember.value?.id ?? 'new'}`)

function syncForm(member) {
  const base = {
    name: '',
    title: '',
    company: '',
    email: '',
    source: '',
    status: 'Active',
    avatar: '',
    online: false,
    permission: 'viewer'
  }

  const data = member
    ? { ...base, ...member, avatar: member.avatar || '' }
    : base

  Object.assign(form, data)
}

watch(
  () => editingMember.value,
  (member) => {
    if (open.value) syncForm(member)
  },
  { immediate: true }
)

watch(
  () => open.value,
  (isOpen) => {
    if (isOpen) syncForm(editingMember.value)
  }
)

async function handleSubmit() {
  if (!form.name.trim() || !form.email.trim()) {
    alert('請輸入名稱與 Email')
    return
  }

  if (form.permission === 'admin' && !allowAdmin.value) {
    alert('僅管理員可設定 Admin 權限')
    return
  }

  const payload = {
    ...form,
    id: editingMember.value?.id,
    name: form.name.trim(),
    title: form.title.trim(),
    company: form.company.trim(),
    email: form.email.trim(),
    source: form.source.trim(),
    avatar: form.avatar?.trim() || ''
  }

  try {
    if (payload.id) {
      const { id, ...body } = payload
      await memberService.update(id, body)
    } else {
      const { id, ...body } = payload
      await memberService.create(body)
    }
    memberStore.closeEditor()
  } catch (err) {
    console.error('[memberEditor] save failed', err)
    alert('儲存失敗，請稍後再試')
  }
}

function close() {
  memberStore.closeEditor()
}
</script>

<template lang="pug">
.editor-wrap(v-if="open" @click.self="close")
  .panel
    .panel-header
      .titles
        p.kicker Member Center
        h3 {{ titleText }}
        p.subtitle 管理客戶資料，維護列表同步
      button.close-btn(type="button" @click="close") X

    form.panel-body(@submit.prevent="handleSubmit")
      .form-grid
        label.field
          span.label 姓名
          input(v-model="form.name" type="text" placeholder="輸入姓名")
        label.field
          span.label 職稱
          input(v-model="form.title" type="text" placeholder="例：Product Manager")
        label.field
          span.label 公司
          input(v-model="form.company" type="text" placeholder="輸入公司名稱")
        label.field
          span.label Email
          input(v-model="form.email" type="email" placeholder="name@email.com")
        label.field
          span.label 來源
          input(v-model="form.source" type="text" placeholder="例如 Linkedin 或 Website")
        label.field
          span.label 狀態
          select(v-model="form.status")
            option(v-for="s in statusOptions" :key="s" :value="s") {{ s }}
        label.field
          span.label 權限
          select(v-model="form.permission")
            option(v-for="p in permissionOptions" :key="p" :value="p" :disabled="p === 'admin' && !allowAdmin")
              | {{ p === 'admin' ? '最高權限(Admin)' : p === 'editor' ? '編輯者' : '檢視者' }}
        label.field
          span.label 頭像網址
          input(v-model="form.avatar" type="url" placeholder="可留空或填入圖片連結")
        .field.switch
          span.label 在線狀態
          .toggle
            input(:id="onlineId" type="checkbox" v-model="form.online")
            label(:for="onlineId")
              span.circle
              span.text {{ form.online ? 'Online' : 'Offline' }}

      .footer
        button.ghost(type="button" @click="close") 取消
        button.primary(type="submit") {{ actionLabel }}
</template>

<style scoped lang="sass">
@use '/src/styles/sass/vars' as *

* 
  box-sizing: border-box

.editor-wrap
  position: fixed
  inset: 0
  background: color-mix(in srgb, var(--text) 18%, transparent)
  backdrop-filter: blur(2px)
  display: flex
  justify-content: flex-end
  z-index: 20

.panel
  width: min(520px, 90vw)
  height: 100%
  background: linear-gradient(175deg, var(--sys-1), color-mix(in srgb, var(--primary) 18%, var(--sys-1)))
  color: $txtColor
  box-shadow: -16px 0 28px rgba(12, 27, 61, 0.35)
  border-left: 1px solid $borderColor
  display: flex
  flex-direction: column
  animation: slide-in .25s ease

@keyframes slide-in
  from
    transform: translateX(12px)
    opacity: 0
  to
    transform: translateX(0)
    opacity: 1

.panel-header
  display: flex
  align-items: flex-start
  justify-content: space-between
  padding: 24px
  border-bottom: 1px solid $borderColor

.titles h3
  margin: 4px 0 6px 0
  font-size: 22px

.titles .kicker
  margin: 0
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $primaryColor
  font-size: 12px
  font-weight: 700

.subtitle
  margin: 0
  color: $sys_9
  opacity: 0.86
  font-size: 13px

.close-btn
  border: none
  background: color-mix(in srgb, var(--primary) 10%, transparent)
  color: $txtColor
  width: 32px
  height: 32px
  border-radius: 10px
  cursor: pointer

.panel-body
  flex: 1
  padding: 20px 24px 24px
  display: flex
  flex-direction: column
  gap: 16px
  overflow-y: auto

.form-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr))
  gap: 14px 12px

.field
  display: flex
  flex-direction: column
  gap: 6px
  color: $txtColor

.label
  font-size: 13px
  color: $sys_9

input, select
  width: 100%
  padding: 10px 12px
  border-radius: 10px
  border: 1px solid $borderColor
  background: color-mix(in srgb, var(--sys-1) 92%, var(--primary) 8%)
  color: $txtColor
  outline: none
  transition: border 0.15s ease

input:focus, select:focus
  border-color: $primaryColor

.switch .toggle
  display: inline-flex
  align-items: center
  gap: 10px

.toggle input
  display: none

.toggle label
  position: relative
  width: 70px
  height: 32px
  border-radius: 999px
  background: color-mix(in srgb, var(--sys-1) 90%, var(--primary) 10%)
  border: 1px solid $borderColor
  cursor: pointer
  display: flex
  align-items: center
  padding: 0 10px
  gap: 8px
  color: $txtColor
  font-weight: 700
  font-size: 12px

.toggle .circle
  position: absolute
  left: 6px
  width: 20px
  height: 20px
  border-radius: 50%
  background: $sysBg
  transition: transform .18s ease

.toggle input:checked + label
  background: linear-gradient(135deg, $sys_6, color-mix(in srgb, var(--sys-6) 70%, var(--sys-1)))
  border-color: $sys_6

.toggle input:checked + label .circle
  transform: translateX(32px)
  background: $sys_1

.toggle .text
  margin-left: 6em

.footer
  display: flex
  justify-content: flex-end
  gap: 10px
  padding-top: 10px
  border-top: 1px solid $borderColor

.ghost, .primary
  border-radius: 12px
  padding: 10px 16px
  cursor: pointer
  border: 1px solid transparent
  font-weight: 700

.ghost
  background: transparent
  color: $txtColor
  border-color: $borderColor

.primary
  background: linear-gradient(135deg, $primaryColor, color-mix(in srgb, var(--primary) 70%, var(--sys-4)))
  color: $sys_1
  border: none

.ghost:hover, .primary:hover
  opacity: 0.92
</style>
