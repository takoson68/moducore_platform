<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { container } from '@/app/container'

const router = useRouter()
const auth = container.resolve('auth')
const platformConfig = container.resolve('platformConfig')

// 模擬展示，預設為單租戶系統
const isAdmin = computed(() => auth.state.user?.role === 'admin')
const name = computed(() => auth.state.user?.name || '-')
const tenantId = computed(() => auth.state.user?.tenantId || '-')

// 1) 取得啟用模組：讀取 platformConfig.state.modules
const enabledModules = computed(() => {
  const mods = platformConfig?.state?.modules || []
  return Array.isArray(mods) ? mods : []
})

// 2) 讀取容器資訊：container.list()
//    目前 list() 回傳：{ stores:[], instances:[], services:[] }
const containerInfo = computed(() => {
  return typeof container.list === 'function'
    ? container.list()
    : { stores: [], instances: [], services: [] }
})

// 平台預設 stores（不算模組）
const platformStores = new Set([
  'platformConfig',
  'auth',
  'token',
  'module',
  'lifecycle',
  'uiShell'
])

// 從 container.stores 推算模組索引
const detectedModules = computed(() => {
  const stores = Array.isArray(containerInfo.value.stores)
    ? containerInfo.value.stores
    : []

  const found = new Set()

  for (const s of stores) {
    if (!s || platformStores.has(s)) continue

    // 例：memberStore -> member
    if (s.endsWith('Store')) {
      found.add(s.slice(0, -'Store'.length))
      continue
    }

    // 例：moduleTemp -> moduleTemp（本身就是模組索引）
    found.add(s)
  }

  return Array.from(found).sort()
})

// 3) 交叉比對：設定啟用 / 容器偵測
const missing = computed(() => {
  const det = new Set(detectedModules.value)
  return enabledModules.value.filter(m => !det.has(m))
})

const extra = computed(() => {
  const en = new Set(enabledModules.value)
  return detectedModules.value.filter(m => !en.has(m))
})

// Snapshot：設定模組的即時快照
const snapshot = computed(() => ({
  tenantId: tenantId.value,
  operator: name.value,
  modules: enabledModules.value
}))

// 系統資訊：設定、偵測結果、提醒（只讀）
const notices = computed(() => {
  const out = []

  out.push({
    title: '啟用模組（平台設定）',
    desc: enabledModules.value.length ? enabledModules.value.join(', ') : '（無）',
    time: '今日'
  })

  out.push({
    title: '容器偵測模組（stores 索引）',
    desc: detectedModules.value.length ? detectedModules.value.join(', ') : '（無）',
    time: '今日'
  })

  if (missing.value.length) {
    out.push({
      title: '設定啟用但容器未偵測（提醒）',
      desc: missing.value.join(', '),
      time: '今日'
    })
  } else {
    out.push({
      title: '檢查通過',
      desc: '啟用清單均可在容器中對應到模組索引。',
      time: '今日'
    })
  }

  if (extra.value.length) {
    out.push({
      title: '容器存在但未設定啟用（提醒）',
      desc: extra.value.join(', '),
      time: '今日'
    })
  }

  return out
})

function goDashboard() {
  router.replace('/dashboard')
}
</script>

<template lang="pug">
.admin-console
  //==================================================
  // Admin Banner（固定露出，作為核心）
  //==================================================
  header.banner
    .left
      h1.title 管理控制台
      p.sub 這裡提供管理者的操作入口，集中檢視平台狀態與啟用模組。
    .right
      button.back(@click="goDashboard") 返回儀表板

  //==================================================
  // 非管理者：僅展示提示，不含 RBAC 討論
  //==================================================
  section.guard(v-if="!isAdmin")
    .guard-card
      h2 需要管理者權限
      p 您目前非管理者，因此僅顯示提示頁面。
      button.primary(@click="goDashboard") 返回儀表板

  //==================================================
  // 管理內容：版面排滿即可
  //==================================================
  section.grid(v-else)
    article.card
      h2.card-title 租戶概要（唯讀）
      ul.kv
        li
          span.k 租戶
          span.v {{ snapshot.tenantId }}
        li
          span.k 操作者
          span.v {{ snapshot.operator }}
        li
          span.k 啟用模組
          span.v
            span.tag(v-for="m in snapshot.modules" :key="m") {{ m }}

    article.card
      h2.card-title 系統資訊（唯讀）
      ul.notice
        li.item(v-for="(n, i) in notices" :key="i")
          .row
            .t {{ n.title }}
            .time {{ n.time }}
          .desc {{ n.desc }}
</template>

<style lang="sass" scoped>
@use '/src/styles/sass/vars' as *
.admin-console
  padding: 32px
  width: 100%
  margin: 0 auto
  font-family: system-ui, sans-serif

.banner
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 20px
  margin-bottom: 22px
  padding: 16px
  border-radius: 14px
  border: 1px solid #f3c6c6
  background: #fff5f5

  .title
    margin: 0 0 6px
    font-size: 22px
    color: #7f1d1d

  .sub
    margin: 0
    opacity: .8
    line-height: 1.5

  .back
    padding: 10px 14px
    border-radius: 8px
    border: 1px solid #e5b5b5
    background: #7f1d1d
    color: #fff
    cursor: pointer
    white-space: nowrap

    &:hover
      opacity: .92

.guard
  margin-top: 12px

.guard-card
  padding: 16px
  border-radius: 12px
  border: 1px solid #eee
  background: #fff

  h2
    margin: 0 0 8px
    font-size: 16px

  p
    margin: 0 0 12px
    opacity: .7
    line-height: 1.5

  .primary
    padding: 10px 14px
    border-radius: 8px
    border: 1px solid #ccc
    background: #111
    color: #fff
    cursor: pointer

    &:hover
      opacity: .92

.grid
  display: grid
  grid-template-columns: 1fr 1fr
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
    font-weight: 700
    display: flex
    flex-wrap: wrap
    gap: 8px

.tag
  font-size: 12px
  padding: 4px 10px
  border-radius: 999px
  border: 1px solid #eee
  background: $sys_10
  font-weight: 600

.notice
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
    font-weight: 800

  .time
    font-size: 12px
    opacity: .6
    white-space: nowrap

  .desc
    font-size: 12px
    opacity: .75
</style>
