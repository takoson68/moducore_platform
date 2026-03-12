<script setup>
import { computed, watch } from 'vue'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'

const visitorStatsStore = world.store('dineCoreVisitorStatsStore')
const staffAuth = useDineCoreStaffAuth()

const state = computed(() => visitorStatsStore.state)
const authStatus = staffAuth.status
const isSuperAdmin = staffAuth.isSuperAdmin

watch(
  [() => authStatus.value, () => isSuperAdmin.value, () => state.value.range],
  ([status, superAdmin, range]) => {
    if (status !== 'auth' || !superAdmin) return
    visitorStatsStore.load(range)
  },
  { immediate: true }
)

function sourceTagLabel(sourceTag) {
  return sourceTag === 'tagged' ? '指定入口' : '直接流量'
}
</script>

<template lang="pug">
.desk-page
  section.panel-card
    .panel-card__head
      .panel-card__copy
        p.eyebrow 每日IP訪客統計
        h2 每日IP訪客統計
        p.lead 僅顯示指定入口頁的每日訪客紀錄，依日期與最後進站時間排序。

  section.error-card(v-if="!isSuperAdmin")
    p 目前帳號沒有查看每日 IP 訪客統計的權限。

  template(v-else)
    section.range-tabs
      button.range-chip(
        type="button"
        :class="{ 'is-active': state.range === 'today' }"
        @click="visitorStatsStore.setRange('today')"
      ) 今日
      button.range-chip(
        type="button"
        :class="{ 'is-active': state.range === '7d' }"
        @click="visitorStatsStore.setRange('7d')"
      ) 近 7 日
      button.range-chip(
        type="button"
        :class="{ 'is-active': state.range === '30d' }"
        @click="visitorStatsStore.setRange('30d')"
      ) 近 30 日
      span.range-tabs__meta(v-if="state.lastLoadedAt") {{ `最後更新 ${state.lastLoadedAt}` }}

    section.loading-card(v-if="state.loading")
      p 載入每日 IP 訪客統計中...

    section.error-card(v-else-if="state.error")
      p {{ state.error }}

    section.table-card(v-else-if="state.rows.length > 0")
      .visitor-table
        .visitor-table__head
          span 日期
          span IP
          span 頁面
          span 來源
          span 次數
          span 首次進站
          span 最後進站
        .visitor-table__row(v-for="row in state.rows" :key="`${row.visitDate}-${row.ipAddress}-${row.path}-${row.sourceTag}`")
          strong {{ row.visitDate }}
          code {{ row.ipAddress }}
          code {{ row.path }}
          span {{ sourceTagLabel(row.sourceTag) }}
          strong {{ row.visitCount }}
          span {{ row.firstVisitedAt }}
          span {{ row.lastVisitedAt }}

    section.empty-card(v-else)
      p 目前查詢範圍內還沒有訪客紀錄。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .loading-card, .error-card, .empty-card, .table-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.9)
  border: 1px solid rgba(140, 90, 31, 0.12)

.eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.panel-card__head
  display: flex
  justify-content: space-between
  gap: 12px

.panel-card__copy
  display: grid
  gap: 8px

.panel-card__copy h2
  margin: 0
  color: #243a3e

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

.range-tabs
  display: flex
  flex-wrap: wrap
  gap: 10px
  align-items: center

.range-chip
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.range-chip.is-active
  background: #17383f
  color: #fff

.range-tabs__meta
  color: #6e8083
  font-size: 13px

.visitor-table
  display: grid
  gap: 10px

.visitor-table__head,
.visitor-table__row
  display: grid
  grid-template-columns: 110px 150px 140px 90px 70px 160px 160px
  gap: 12px
  align-items: center

.visitor-table__head
  color: #6e8083
  font-size: 12px
  font-weight: 700

.visitor-table__row
  padding: 14px 0
  border-top: 1px solid rgba(109, 180, 177, 0.18)
  color: #243a3e

.visitor-table__row code
  font-size: 12px
  color: #315b62

@media (max-width: 1180px)
  .visitor-table
    overflow-x: auto

  .visitor-table__head,
  .visitor-table__row
    min-width: 920px
</style>
