<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { container } from '@/app/container'

const router = useRouter()
const auth = container.resolve('auth')

// 為了展示：若尚未取得 user，就顯示預設名稱
const userName = computed(() => auth.state.user?.name || '使用者')

// 可依後續 config / moduleStore 調整
// 先以已知模組作為示意
const availableModules = computed(() => {
  const list = [
    { key: 'profile', title: '個人檔案', desc: '查看基本資料與身分狀態。' },
    { key: 'dashboard', title: '首頁總覽', desc: '登入後的快捷入口與工作起點。' }
  ]

  // 管理者另顯示 admin 模組（僅作示範）
  if (auth.state.user?.role === 'admin') {
    list.unshift({
      key: 'admin',
      title: '管理控制台',
      desc: '集中管理租戶、模組與平台狀態。'
    })
  }

  return list
})

// 固定 3 筆：對應 demo 需要
const activity = computed(() => ([
  { title: '平台環境已建立', meta: '目前可瀏覽 dashboard 與 profile', time: '昨日' },
  { title: '模組清單更新', meta: '依登入身分可見對應入口', time: '1 小時前' },
  { title: '登入狀態確認', meta: '已完成登入流程，隨時可啟用作業', time: '今日' }
]))

function goProfile() {
  router.push('/profile')
}
</script>

<template lang="pug">
.dashboard-home
  header.hero
    .left
      h1.title 歡迎回來，{{ userName }}
      p.subtitle 這裡是登入後的主要入口：提供總覽、導引與快捷操作。
    .right
      button.primary(@click="goProfile") 查看個人檔案

  section.grid
    //==================================================
    // Card 1：Welcome（基礎資訊）
    //==================================================
    article.card
      h2.card-title 你的狀態
      ul.kv
        li
          span.k 所屬環境
          span.v 使用環境
        li
          span.k 角色
          span.v {{ auth.state.user?.role === 'admin' ? '管理者' : '一般使用者' }}
        li
          span.k 租戶
          span.v {{ auth.state.user?.tenantId || '-' }}

    //==================================================
    // Card 2：Available Modules（模組清單）
    //==================================================
    article.card
      h2.card-title 可用模組
      ul.modules
        li.mod(v-for="m in availableModules" :key="m.key")
          .name {{ m.title }}
          .desc {{ m.desc }}

    //==================================================
    // Card 3：Recent Activity（最新動態）
    //==================================================
    article.card
      h2.card-title 最新活動
      ul.activity
        li.item(v-for="(a, i) in activity" :key="i")
          .row
            .t {{ a.title }}
            .time {{ a.time }}
          .meta {{ a.meta }}
</template>

<style lang="sass" scoped>
.dashboard-home
  padding: 32px
  width: 100%
  margin: 0 auto
  font-family: system-ui, sans-serif

.hero
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 24px
  margin-bottom: 28px
  padding-bottom: 20px
  border-bottom: 1px solid #eee

  .title
    font-size: 24px
    margin: 0 0 6px

  .subtitle
    margin: 0
    opacity: .7
    line-height: 1.5

  .primary
    padding: 10px 16px
    border-radius: 8px
    border: 1px solid #ccc
    background: #111
    color: #fff
    cursor: pointer
    white-space: nowrap

    &:hover
      opacity: .92

.grid
  display: grid
  grid-template-columns: 1fr 1fr 1fr
  gap: 16px

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
    font-weight: 600

.modules
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

  .mod
    padding: 10px
    border-radius: 10px
    border: 1px dashed #ddd

    .name
      font-weight: 700
      margin-bottom: 4px

    .desc
      font-size: 12px
      opacity: .7

.activity
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 12px

  .item
    padding: 10px
    border-radius: 10px
    border: 1px solid #ddd

  .row
    display: flex
    justify-content: space-between
    gap: 12px
    margin-bottom: 4px

  .t
    font-weight: 700

  .time
    font-size: 12px
    opacity: .6
    white-space: nowrap

  .meta
    font-size: 12px
    opacity: .7
</style>
