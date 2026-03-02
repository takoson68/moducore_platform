<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const leaveStore = world.store('flowCenterLeaveStore')
const state = leaveStore.state
const leaveForm = state.form

const selectedId = computed({
  get: () => state.selectedId,
  set: (value) => leaveStore.selectRecord(value)
})

const leaveTypeLabelMap = {
  annual: '特休',
  sick: '病假',
  personal: '事假',
  marriage: '婚假'
}

const statusLabelMap = {
  draft: '草稿',
  submitted: '待審核',
  approved: '已核准',
  rejected: '已退回'
}

const statusSummary = computed(() => {
  const total = state.records.length
  const pending = state.records.filter((item) => item.status === 'submitted').length
  const approved = state.records.filter((item) => item.status === 'approved').length
  const drafts = state.records.filter((item) => item.status === 'draft').length
  return { total, pending, approved, drafts }
})

const selectedRecord = computed(() =>
  state.records.find((item) => item.id === selectedId.value) || state.records[0] || null
)

const isEditing = computed(() => Boolean(state.editingId))

function normalizeRecord(record) {
  return {
    ...record,
    leaveTypeLabel: leaveTypeLabelMap[record.leave_type] || record.leave_type,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

function loadLeave() {
  return leaveStore.load()
}

function submitLeave(status) {
  return leaveStore.submit(status)
}

function resetForm() {
  return leaveStore.clearForm()
}

onMounted(loadLeave)
watch(() => [auth.isLoggedIn.value, auth.role.value].join(':'), loadLeave)
</script>

<template lang="pug">
.leave-page
  .hero.flow-glass
    .hero-copy
      p.eyebrow Leave Module
      h2 請假申請
      p.summary 已改接後端 leave API。只有 employee 可建立與查看自己的請假單，審核結果會由 approval 模組回寫。
    .hero-note
      span.note-label 權限
      strong.note-value employee
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.form-note 請先登入 employee 帳號才能操作請假模組。
  .panel.flow-glass(v-else-if="auth.role.value !== 'employee'")
    .panel-head
      h3 無法進入
      span.panel-meta role blocked
    p.form-note 主管角色不可直接使用請假申請頁。
  template(v-else)
    .summary-grid
      article.summary-card.flow-glass
        p.card-label 全部申請
        p.card-value {{ statusSummary.total }}
      article.summary-card.flow-glass
        p.card-label 待審核
        p.card-value {{ statusSummary.pending }}
      article.summary-card.flow-glass
        p.card-label 已核准
        p.card-value {{ statusSummary.approved }}
      article.summary-card.flow-glass
        p.card-label 草稿
        p.card-value {{ statusSummary.drafts }}
    .content-grid
      section.panel.flow-glass
        .panel-head
          h3 {{ isEditing ? '編輯請假單' : '新增請假單' }}
          span.panel-meta {{ isEditing ? 'update' : 'create' }}
        .form-grid
          label.field
            span.label 假別
            select(v-model="leaveForm.leaveType")
              option(value="annual") 特休
              option(value="sick") 病假
              option(value="personal") 事假
              option(value="marriage") 婚假
          label.field
            span.label 開始日期
            input(type="date" v-model="leaveForm.startDate")
          label.field
            span.label 結束日期
            input(type="date" v-model="leaveForm.endDate")
          label.field
            span.label 代理人
            input(type="text" v-model="leaveForm.delegate")
          label.field.is-wide
            span.label 原因
            textarea(rows="4" v-model="leaveForm.reason")
        p.form-note(v-if="state.error") {{ state.error }}
        .form-actions
          button.action-button(type="button" @click="submitLeave('draft')" :disabled="state.submitting")
            | {{ isEditing ? '更新草稿' : '儲存草稿' }}
          button.action-button.secondary(type="button" @click="submitLeave('submitted')" :disabled="state.submitting")
            | {{ isEditing ? '更新並送出' : '送出申請' }}
          button.action-button.secondary(type="button" @click="resetForm" :disabled="state.submitting") 切換為新增
      section.panel.flow-glass
        .panel-head
          h3 請假清單
          span.panel-meta {{ state.loading ? 'loading' : 'list' }}
        p.form-note(v-if="!state.records.length") 目前沒有請假資料。
        .record-list(v-else)
          button.record-row(
            v-for="record in state.records"
            :key="record.id"
            type="button"
            :class="{ 'is-active': selectedId === record.id }"
            @click="selectedId = record.id"
          )
            .record-main
              strong {{ record.leaveTypeLabel }}
              span {{ record.start_date }} ｜ {{ record.end_date }}
            .record-side
              span.status-chip(:class="`is-${record.status}`") {{ record.statusLabel }}
              span.days {{ record.days }} 天
    section.detail-panel.flow-glass(v-if="selectedRecord")
      .panel-head
        h3 申請明細
        span.panel-meta {{ `#${selectedRecord.id}` }}
      .detail-grid
        .detail-item
          span.detail-label 假別
          strong {{ selectedRecord.leaveTypeLabel }}
        .detail-item
          span.detail-label 狀態
          strong {{ selectedRecord.statusLabel }}
        .detail-item
          span.detail-label 代理人
          strong {{ selectedRecord.delegate_name || '未指定' }}
        .detail-item
          span.detail-label 日期
          strong {{ selectedRecord.start_date }} ～ {{ selectedRecord.end_date }}
        .detail-item
          span.detail-label 天數
          strong {{ selectedRecord.days }} 天
        .detail-item
          span.detail-label 建立時間
          strong {{ selectedRecord.created_at }}
      .detail-reason
        span.detail-label 原因
        p {{ selectedRecord.reason || '未填寫' }}
</template>

<style lang="sass">
.leave-page
  display: grid
  gap: 20px

.hero, .panel, .detail-panel
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

.summary
  margin: 0
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.7

.hero-note
  min-width: 132px
  padding: 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(232, 246, 255, 0.98))
  display: grid
  gap: 8px

.summary-grid
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 18px

.summary-card
  border-radius: 24px
  padding: 20px
  display: grid
  gap: 8px

.card-label, .note-label, .detail-label, .panel-meta
  color: rgba(90, 79, 116, 0.58)

.card-value, .note-value
  font-size: 28px
  color: #241b31

.content-grid
  display: grid
  grid-template-columns: 1.2fr 1fr
  gap: 20px

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  margin-bottom: 16px

.form-grid, .detail-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px

.field, .detail-item
  display: grid
  gap: 8px

.field.is-wide
  grid-column: 1 / -1

.field input, .field select, .field textarea
  width: 100%
  border: 0
  border-radius: 16px
  padding: 14px 16px
  background: rgba(255, 255, 255, 0.72)

.form-actions
  margin-top: 18px
  display: flex
  gap: 12px

.action-button
  border: 0
  border-radius: 999px
  padding: 12px 18px
  background: linear-gradient(135deg, #ff8f78 0%, #f477a7 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.action-button.secondary
  background: linear-gradient(135deg, #7fa7ff 0%, #6c7ff3 100%)

.form-note
  margin: 0
  color: rgba(63, 54, 79, 0.66)

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
  box-shadow: inset 0 0 0 1px rgba(255, 126, 167, 0.3)
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
  background: rgba(255, 233, 171, 0.5)
  color: #8a5b00

.status-chip.is-approved
  background: rgba(209, 250, 229, 0.8)
  color: #166534

.status-chip.is-draft
  background: rgba(226, 232, 240, 0.8)
  color: #475569

.status-chip.is-rejected
  background: rgba(254, 226, 226, 0.9)
  color: #b91c1c

.detail-item, .detail-reason
  padding: 14px 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.62)

.detail-reason p
  margin: 10px 0 0

@media (max-width: 1080px)
  .summary-grid
    grid-template-columns: repeat(2, minmax(0, 1fr))
  .content-grid
    grid-template-columns: 1fr

@media (max-width: 720px)
  .hero
    flex-direction: column
  .summary-grid, .form-grid, .detail-grid
    grid-template-columns: 1fr
</style>
