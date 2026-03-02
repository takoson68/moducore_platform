<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const purchaseStore = world.store('flowCenterPurchaseStore')
const state = purchaseStore.state
const purchaseForm = state.form

const selectedId = computed({
  get: () => state.selectedId,
  set: (value) => purchaseStore.selectRecord(value)
})

const statusLabelMap = {
  draft: '草稿',
  submitted: '待審核',
  approved: '已核准',
  rejected: '已退回'
}

const summary = computed(() => {
  const total = state.records.length
  const pending = state.records.filter((item) => item.status === 'submitted').length
  const approvedAmount = state.records
    .filter((item) => item.status === 'approved')
    .reduce((sum, item) => sum + Number(item.amount || 0), 0)
  const draft = state.records.filter((item) => item.status === 'draft').length
  return { total, pending, approvedAmount, draft }
})

const selectedRecord = computed(() =>
  state.records.find((item) => item.id === selectedId.value) || state.records[0] || null
)

const isEditing = computed(() => Boolean(state.editingId))

function normalizeRecord(record) {
  return {
    ...record,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

function formatCurrency(value) {
  return new Intl.NumberFormat('zh-TW', {
    style: 'currency',
    currency: 'TWD',
    maximumFractionDigits: 0
  }).format(Number(value || 0))
}

function loadPurchase() {
  return purchaseStore.load()
}

function submitPurchase(status) {
  return purchaseStore.submit(status)
}

function resetForm() {
  return purchaseStore.clearForm()
}

onMounted(loadPurchase)
watch(() => [auth.isLoggedIn.value, auth.role.value, auth.companyId.value].join(':'), loadPurchase)
</script>

<template lang="pug">
.purchase-page
  .hero.flow-glass
    .hero-copy
      p.eyebrow Purchase Module
      h2 採購申請
      p.summary-text 採購模組已改接後端 purchase API。company-b 在後端會固定視為 disabled，因此前端只會顯示錯誤或空狀態。
    .hero-note
      span.note-label module gate
      strong.note-value {{ auth.companyId.value === 'company-b' ? 'disabled' : 'enabled' }}
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.form-note 請先登入 employee 帳號才能操作採購申請。
  .panel.flow-glass(v-else-if="auth.role.value !== 'employee'")
    .panel-head
      h3 無法進入
      span.panel-meta role blocked
    p.form-note 主管角色不可直接使用採購申請頁。
  .panel.flow-glass(v-else-if="auth.companyId.value === 'company-b'")
    .panel-head
      h3 模組未啟用
      span.panel-meta purchase disabled
    p.form-note company-b 的 purchase module 已在後端停用，API 會回傳 404。
  template(v-else)
    .summary-grid
      article.summary-card.flow-glass
        p.card-label 全部申請
        p.card-value {{ summary.total }}
      article.summary-card.flow-glass
        p.card-label 待審核
        p.card-value {{ summary.pending }}
      article.summary-card.flow-glass
        p.card-label 已核准金額
        p.card-value {{ formatCurrency(summary.approvedAmount) }}
      article.summary-card.flow-glass
        p.card-label 草稿
        p.card-value {{ summary.draft }}
    .content-grid
      section.panel.flow-glass
        .panel-head
          h3 {{ isEditing ? '編輯採購單' : '新增採購單' }}
          span.panel-meta {{ isEditing ? 'update' : 'create' }}
        .form-grid
          label.field
            span.label 採購項目
            input(type="text" v-model="purchaseForm.itemName")
          label.field
            span.label 金額
            input(type="number" min="0" step="100" v-model="purchaseForm.amount")
          label.field
            span.label 供應商
            input(type="text" v-model="purchaseForm.vendor")
          label.field.is-wide
            span.label 採購用途
            textarea(rows="4" v-model="purchaseForm.purpose")
        p.form-note(v-if="state.error") {{ state.error }}
        .form-actions
          button.action-button(type="button" @click="submitPurchase('draft')" :disabled="state.submitting")
            | {{ isEditing ? '更新草稿' : '儲存草稿' }}
          button.action-button.secondary(type="button" @click="submitPurchase('submitted')" :disabled="state.submitting")
            | {{ isEditing ? '更新並送出' : '送出申請' }}
          button.action-button.secondary(type="button" @click="resetForm" :disabled="state.submitting") 切換為新增
      section.panel.flow-glass
        .panel-head
          h3 採購清單
          span.panel-meta {{ state.loading ? 'loading' : 'list' }}
        p.form-note(v-if="!state.records.length") 目前沒有採購資料。
        .record-list(v-else)
          button.record-row(
            v-for="record in state.records"
            :key="record.id"
            type="button"
            :class="{ 'is-active': selectedId === record.id }"
            @click="selectedId = record.id"
          )
            .record-main
              strong {{ record.item_name }}
              span {{ formatCurrency(record.amount) }}
            .record-side
              span.status-chip(:class="`is-${record.status}`") {{ record.statusLabel }}
              span.code {{ `#${record.id}` }}
    section.detail-panel.flow-glass(v-if="selectedRecord")
      .panel-head
        h3 採購明細
        span.panel-meta {{ `#${selectedRecord.id}` }}
      .detail-grid
        .detail-item
          span.detail-label 項目
          strong {{ selectedRecord.item_name }}
        .detail-item
          span.detail-label 狀態
          strong {{ selectedRecord.statusLabel }}
        .detail-item
          span.detail-label 金額
          strong {{ formatCurrency(selectedRecord.amount) }}
        .detail-item
          span.detail-label 供應商
          strong {{ selectedRecord.vendor_name || '未指定' }}
        .detail-item
          span.detail-label 建立時間
          strong {{ selectedRecord.created_at }}
        .detail-item
          span.detail-label company
          strong {{ auth.companyId.value }}
      .detail-reason
        span.detail-label 採購用途
        p {{ selectedRecord.purpose || '未填寫' }}
</template>

<style lang="sass">
.purchase-page
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

.summary-text
  margin: 0
  color: rgba(63, 54, 79, 0.72)
  line-height: 1.7

.hero-note
  min-width: 132px
  padding: 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(255, 240, 232, 0.98))
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

.card-value, .note-value
  font-size: 28px
  color: #241b31

.card-label, .note-label, .detail-label, .panel-meta
  color: rgba(90, 79, 116, 0.58)

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

.field input, .field textarea
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
  background: linear-gradient(135deg, #ff9d7d 0%, #ff7e9c 100%)
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
  box-shadow: inset 0 0 0 1px rgba(255, 126, 125, 0.3)
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
