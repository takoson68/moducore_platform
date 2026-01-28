<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { container } from '@/app/container'

const router = useRouter()
const auth = container.resolve('auth')

const status = computed(() => auth.state.status || 'guest')
const role = computed(() => auth.state.user?.role || 'user')
const name = computed(() => auth.state.user?.name || '-')
const tenantId = computed(() => auth.state.user?.tenantId || '-')

const worldLabel = computed(() => {
  if (status.value === 'guest') return '訪客'
  if (role.value === 'admin') return '管理者'
  return '使用者'
})

const primaryCta = computed(() => {
  if (status.value === 'guest') {
    return { label: '立即登入', to: '/login' }
  }
  if (role.value === 'admin') {
    return { label: '前往管理控制台', to: '/admin' }
  }
  return { label: '返回儀表板', to: '/dashboard' }
})

function goPrimary() {
  router.replace(primaryCta.value.to)
}

const steps = computed(() => ([
  { key: 'guest', label: '訪客' },
  { key: 'authenticated', label: '已登入' },
  { key: 'admin', label: '管理者' }
]))

const activeStep = computed(() => {
  if (status.value === 'guest') return 'guest'
  if (role.value === 'admin') return 'admin'
  return 'authenticated'
})
</script>

<template lang="pug">
.profile-page
  header.top
    h1.title 個人檔案
    p.sub 提供登入狀態與基本資料的概況，方便快速確認身分。

  section.grid
    // 身分資訊
    article.card
      h2.card-title 身分資訊
      ul.kv
        li
          span.k 身分類型
          span.v {{ worldLabel }}
        li
          span.k 登入狀態
          span.v {{ status === 'guest' ? '未登入' : '已登入' }}
        li
          span.k 角色
          span.v {{ role === 'admin' ? '管理者' : '一般使用者' }}
        li
          span.k 稱謂
          span.v {{ name }}
        li
          span.k 租戶
          span.v {{ tenantId }}

    // 身分歷程
    article.card
      h2.card-title 身分歷程
      ol.timeline
        li.node(
          v-for="s in steps"
          :key="s.key"
          :class="{ active: s.key === activeStep }"
        )
          .dot
          .label {{ s.label }}

      p.hint
        | 若需調整帳號資料或權限，請與系統管理者聯繫。

  // CTA
  footer.actions
    button.primary(@click="goPrimary") {{ primaryCta.label }}
</template>

<style lang="sass" scoped>
@use '/src/styles/sass/vars' as *

.profile-page
  padding: 32px
  width: 100%
  margin: 0 auto
  font-family: system-ui, sans-serif

.top
  margin-bottom: 24px
  padding-bottom: 18px
  border-bottom: 1px solid #eee

  .title
    margin: 0 0 6px
    font-size: 24px

  .sub
    margin: 0
    opacity: .7

.grid
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 16px
  margin-bottom: 22px

@media (max-width: 900px)
  .grid
    grid-template-columns: 1fr


.card
  border: 1px solid #eee
  border-radius: 12px
  padding: 16px
  background: $sys_10

  .card-title
    margin: 0 0 12px
    font-size: 16px

.kv
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

  li
    display: grid
    grid-template-columns: 90px 1fr
    gap: 12px
    align-items: baseline

  .k
    font-size: 12px
    opacity: .6

  .v
    font-size: 14px
    font-weight: 700

.timeline
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 12px

  .node
    display: flex
    align-items: center
    gap: 10px
    opacity: .55

    &.active
      opacity: 1

      .dot
        border-color: #111
        background: #111

  .dot
    width: 10px
    height: 10px
    border-radius: 999px
    border: 2px solid #bbb
    background: transparent

  .label
    font-weight: 700

.hint
  margin: 12px 0 0
  font-size: 12px
  opacity: .7
  line-height: 1.5

.actions
  display: flex
  justify-content: flex-end
  border-top: 1px solid #eee
  padding-top: 18px

  .primary
    padding: 10px 16px
    border-radius: 8px
    border: 1px solid #ccc
    background: #111
    color: #fff
    cursor: pointer

    &:hover
      opacity: .92
</style>
