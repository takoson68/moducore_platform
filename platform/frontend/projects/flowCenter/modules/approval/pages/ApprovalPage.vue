<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const approvalStore = world.store('flowCenterApprovalStore')
const state = approvalStore.state
const decisionForm = state.decisionForm

const activeFilter = computed({
  get: () => state.activeFilter,
  set: (value) => approvalStore.setFilter(value)
})

const selectedId = computed({
  get: () => state.selectedId,
  set: (value) => approvalStore.selectRecord(value)
})

const summary = computed(() => {
  const total = state.records.length
  const leave = state.records.filter((item) => item.source_type === 'leave').length
  const purchase = state.records.filter((item) => item.source_type === 'purchase').length
  return { total, leave, purchase }
})

const filteredRecords = computed(() => {
  if (activeFilter.value === 'all') return state.records
  return state.records.filter((item) => item.source_type === activeFilter.value)
})

const selectedRecord = computed(() =>
  state.records.find((item) => item.source_id === selectedId.value) || state.records[0] || null
)

function sourceTypeLabel(value) {
  return value === 'leave' ? '請假' : '採購'
}

function loadApprovals() {
  return approvalStore.load()
}

function submitDecision() {
  return approvalStore.submitDecision()
}

onMounted(loadApprovals)
watch(() => [auth.isLoggedIn.value, auth.role.value].join(':'), loadApprovals)
</script>

<template lang="pug">
.approval-page
  .hero.flow-glass
    .hero-copy
      p.eyebrow Approval Module
      h2 主管審核
      p.summary-text approval 已改接後端 `pending / decide` API，且只負責提交決策，不直接持有 leave / purchase 的狀態機。
    .hero-note
      span.note-label manager
      strong.note-value only
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.form-note 請先登入主管帳號才能進入審核頁。
  .panel.flow-glass(v-else-if="auth.role.value !== 'manager'")
    .panel-head
      h3 無法進入
      span.panel-meta role blocked
    p.form-note approval API 只允許 manager。
  template(v-else)
    .summary-grid
      article.summary-card.flow-glass
        p.card-label 待審總數
        p.card-value {{ summary.total }}
      article.summary-card.flow-glass
        p.card-label 請假待審
        p.card-value {{ summary.leave }}
      article.summary-card.flow-glass
        p.card-label 採購待審
        p.card-value {{ summary.purchase }}
    .content-grid
      section.panel.flow-glass
        .panel-head
          h3 待審清單
          span.panel-meta {{ state.loading ? 'loading' : 'list' }}
        .filter-group
          button.filter-chip(
            v-for="type in ['all', 'leave', 'purchase']"
            :key="type"
            type="button"
            :class="{ 'is-active': activeFilter === type }"
            @click="activeFilter = type"
          ) {{ type === 'all' ? '全部' : sourceTypeLabel(type) }}
        p.form-note(v-if="!filteredRecords.length") 目前沒有待審資料。
        .record-list(v-else)
          button.record-row(
            v-for="record in filteredRecords"
            :key="`${record.source_type}-${record.source_id}`"
            type="button"
            :class="{ 'is-active': selectedId === record.source_id }"
            @click="selectedId = record.source_id"
          )
            .record-main
              strong {{ record.title }}
              span {{ sourceTypeLabel(record.source_type) }} ｜ 申請人 {{ record.applicant_user_id }}
            .record-side
              span.status-chip.is-submitted 待審核
              span.code {{ record.source_type }}-{{ record.source_id }}
      section.panel.flow-glass(v-if="selectedRecord")
        .panel-head
          h3 送出決策
          span.panel-meta {{ `${selectedRecord.source_type} #${selectedRecord.source_id}` }}
        .detail-grid
          .detail-item
            span.detail-label 類型
            strong {{ sourceTypeLabel(selectedRecord.source_type) }}
          .detail-item
            span.detail-label 申請人
            strong {{ selectedRecord.applicant_user_id }}
          .detail-item
            span.detail-label 摘要
            strong {{ selectedRecord.summary }}
          .detail-item
            span.detail-label 建立時間
            strong {{ selectedRecord.created_at }}
        .decision-form
          label.field
            span.label 決策
            select(v-model="decisionForm.decision")
              option(value="approve") 核准
              option(value="reject") 退回
          label.field
            span.label 評語
            textarea(rows="5" v-model="decisionForm.comment")
        p.form-note(v-if="state.error") {{ state.error }}
        .form-actions
          button.action-button(type="button" @click="submitDecision" :disabled="state.saving") 送出決策
</template>

<style lang="sass">
.approval-page
  display: grid
  gap: 20px

.hero, .panel
  border-radius: 26px
  padding: 22px

.hero
  display: flex
  justify-content: space-between
  gap: 20px

.hero-copy
  max-width: 64ch

.eyebrow
  margin: 0 0 8px
  font-size: 12px
  letter-spacing: 0.08em
  text-transform: uppercase
  color: rgba(90, 79, 116, 0.58)

.hero-copy h2
  margin: 0 0 10px
  font-size: 32px

.summary-text
  margin: 0
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.7

.hero-note
  min-width: 146px
  padding: 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(243, 236, 255, 0.98))
  display: grid
  gap: 8px

.summary-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 18px

.summary-card
  border-radius: 24px
  padding: 20px
  display: grid
  gap: 8px

.content-grid
  display: grid
  grid-template-columns: 1fr 1.05fr
  gap: 20px

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
  margin-bottom: 16px

.filter-group
  display: flex
  gap: 10px
  margin-bottom: 16px

.filter-chip
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: rgba(255, 255, 255, 0.68)
  cursor: pointer

.filter-chip.is-active
  background: linear-gradient(135deg, #9f8cff 0%, #c689f2 100%)
  color: #fff

.record-list
  display: grid
  gap: 12px

.record-row
  border: 0
  width: 100%
  text-align: left
  border-radius: 18px
  padding: 16px
  background: rgba(255, 255, 255, 0.62)
  display: flex
  align-items: center
  justify-content: space-between
  gap: 16px
  cursor: pointer

.record-row.is-active
  box-shadow: inset 0 0 0 1px rgba(159, 140, 255, 0.35)
  background: rgba(255, 255, 255, 0.88)

.record-main
  display: grid
  gap: 6px

.record-side
  display: grid
  justify-items: end
  gap: 8px

.status-chip
  padding: 6px 10px
  border-radius: 999px
  font-size: 12px
  font-weight: 700

.status-chip.is-submitted
  background: rgba(254, 249, 195, 0.9)
  color: #854d0e

.detail-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px
  margin-bottom: 16px

.detail-item, .field
  display: grid
  gap: 8px
  padding: 14px 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.62)

.field
  padding: 0
  background: transparent

.field select, .field textarea
  width: 100%
  border: 0
  border-radius: 16px
  padding: 14px 16px
  background: rgba(255, 255, 255, 0.72)

.decision-form
  display: grid
  gap: 14px

.form-actions
  margin-top: 18px
  display: flex
  gap: 12px

.action-button
  border: 0
  border-radius: 999px
  padding: 12px 18px
  background: linear-gradient(135deg, #9f8cff 0%, #c689f2 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.form-note
  margin: 0
  color: rgba(63, 54, 79, 0.66)

@media (max-width: 960px)
  .hero, .content-grid, .summary-grid, .detail-grid
    grid-template-columns: 1fr
</style>
