<script setup>
import { computed, onMounted, reactive, watch } from 'vue'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'

const auditCloseStore = world.store('dineCoreAuditCloseStore')
const state = computed(() => auditCloseStore.state)
const staffAuth = useDineCoreStaffAuth()
const form = reactive({
  closeReasonType: 'daily_close',
  closeReason: '',
  unlockReasonType: 'correction',
  unlockReason: ''
})

const statusLabelMap = {
  open: '尚未關帳',
  closed: '已完成關帳',
  reopened: '已重新開放'
}

const scopeLabelMap = {
  orders: '訂單',
  payments: '付款'
}

const reasonTypeLabelMap = {
  daily_close: '日結關帳',
  shift_handover: '交班交接',
  correction: '資料修正',
  dispute: '爭議處理',
  manual_override: '人工覆寫',
  general: '一般說明'
}

async function loadAuditClose() {
  if (!staffAuth.isAuthenticated.value) return
  await auditCloseStore.load()
}

onMounted(async () => {
  await loadAuditClose()
})

watch(
  () => state.value.selectedDate,
  () => {
    loadAuditClose()
  },
  { immediate: false }
)

watch(
  () => staffAuth.isAuthenticated.value,
  isAuthenticated => {
    if (!isAuthenticated) return
    loadAuditClose()
  }
)

async function submitClose() {
  await auditCloseStore.close({
    reason: form.closeReason,
    reasonType: form.closeReasonType
  })
  form.closeReasonType = 'daily_close'
  form.closeReason = ''
}

async function submitUnlock() {
  await auditCloseStore.unlock({
    reason: form.unlockReason,
    reasonType: form.unlockReasonType
  })
  form.unlockReasonType = 'correction'
  form.unlockReason = ''
}
</script>

<template lang="pug">
.desk-page
  section.panel-card
    p.eyebrow 關帳作業
    h2 關帳作業
    p.lead 檢查當日訂單與付款是否已收斂，確認無阻塞項目後完成日結；若需修正，也可保留解鎖紀錄。

  section.filter-card
    label.field-card
      span.info-label 營業日期
      input.field-input(
        type="date"
        :value="state.selectedDate"
        @input="auditCloseStore.setSelectedDate($event.target.value)"
      )
    span.filter-meta(v-if="state.lastLoadedAt") {{ `最後更新 ${state.lastLoadedAt}` }}

  section.loading-card(v-if="state.loading")
    p 關帳資料載入中...

  section.error-card(v-else-if="state.error && !state.closingSummary.businessDate")
    p {{ `關帳資料載入失敗：${state.error}` }}

  template(v-else)
    section.error-card(v-if="state.error")
      p {{ state.error }}

    section.stat-grid
      article.info-card
        span.info-label 目前狀態
        strong.info-value {{ statusLabelMap[state.closingSummary.closeStatus] || state.closingSummary.closeStatus }}
      article.info-card
        span.info-label 訂單數
        strong.info-value {{ state.closingSummary.orderCount }}
      article.info-card
        span.info-label 未完成訂單
        strong.info-value {{ state.closingSummary.unfinishedOrderCount }}
      article.info-card
        span.info-label 訂單總額
        strong.info-value {{ `NT$ ${state.closingSummary.grossSales}` }}
      article.info-card
        span.info-label 已付款金額
        strong.info-value {{ `NT$ ${state.closingSummary.paidAmount}` }}
      article.info-card
        span.info-label 未付款金額
        strong.info-value {{ `NT$ ${state.closingSummary.unpaidAmount}` }}
      article.info-card
        span.info-label 已鎖定範圍
        strong.info-value {{ state.lockState.lockedScopes.length > 0 ? state.lockState.lockedScopes.map(scope => scopeLabelMap[scope] || scope).join(' / ') : '尚未鎖定' }}

    section.status-card
      p.status-card__line(v-if="state.lockState.isLocked")
        strong 已鎖定
        | {{ ` ${state.selectedDate} 已鎖定訂單與付款資料。` }}
      p.status-card__line(v-else-if="state.closingSummary.closeStatus === 'reopened'")
        strong 已重新開放
        |  此營業日曾關帳後再解鎖，目前可進行補單或修正，再重新關帳。
      p.status-card__line(v-else)
        strong 尚未關帳
        |  完成前請先確認未完成訂單與未付款金額都已處理完畢。

    section.issue-card(v-if="state.blockingIssues.length > 0")
      h3.issue-card__title 阻塞項目
      .issue-row(v-for="issue in state.blockingIssues" :key="issue.type")
        .issue-row__main
          strong {{ issue.label }}
          span {{ `${issue.count} 筆` }}
        small.issue-row__meta {{ issue.orderIds.join(', ') }}
    section.empty-card(v-else)
      p 目前沒有阻塞項目，可以進行關帳。

    section.action-grid
      article.action-card
        h3.action-card__title 執行關帳
        p.action-card__lead 只有當未完成訂單與未付款金額都已清空時，才建議進行正式關帳。
        label.action-field
          span.info-label 關帳原因類型
          select.field-input(v-model="form.closeReasonType")
            option(value="daily_close") 日結關帳
            option(value="shift_handover") 交班交接
            option(value="manual_override") 人工覆寫
        textarea.action-textarea(
          v-model="form.closeReason"
          placeholder="可補充本次關帳的備註或交班說明"
        )
        button.action-button(
          type="button"
          :disabled="state.closeActionLoading || state.blockingIssues.length > 0 || state.lockState.isLocked"
          @click="submitClose()"
        ) {{ state.closeActionLoading ? '關帳處理中...' : '確認關帳' }}

      article.action-card
        h3.action-card__title 解鎖營業日
        p.action-card__lead 已關帳的營業日若需補單、修正付款或處理爭議，請填寫原因後再解鎖。
        label.action-field
          span.info-label 解鎖原因類型
          select.field-input(v-model="form.unlockReasonType")
            option(value="correction") 資料修正
            option(value="shift_handover") 交班交接
            option(value="dispute") 爭議處理
            option(value="manual_override") 人工覆寫
        textarea.action-textarea(
          v-model="form.unlockReason"
          placeholder="請說明本次解鎖原因，這段內容會進入歷程紀錄"
        )
        button.action-button.is-secondary(
          type="button"
          :disabled="state.unlockActionLoading || !state.lockState.isLocked || !form.unlockReason.trim()"
          @click="submitUnlock()"
        ) {{ state.unlockActionLoading ? '解鎖處理中...' : '確認解鎖' }}

    section.history-card(v-if="state.closeHistory.length > 0")
      .history-card__head
        h3.history-card__title 關帳歷程
        span.history-card__meta {{ `${state.closeHistory.length} 筆` }}
      .history-row(v-for="entry in state.closeHistory" :key="entry.id")
        .history-row__main
          strong {{ entry.action === 'close' ? '關帳' : '解鎖' }}
          span {{ `${entry.actorName} / ${entry.actorRole}` }}
          small.history-row__reason-type {{ reasonTypeLabelMap[entry.reasonType] || entry.reasonType }}
        .history-row__meta
          span {{ entry.createdAt }}
          small(v-if="entry.affectedScopes.length > 0") {{ `影響範圍：${entry.affectedScopes.map(scope => scopeLabelMap[scope] || scope).join(' / ')}` }}
          small(v-if="entry.beforeStatus || entry.afterStatus") {{ `狀態變更：${statusLabelMap[entry.beforeStatus] || entry.beforeStatus} -> ${statusLabelMap[entry.afterStatus] || entry.afterStatus}` }}
          small {{ entry.reason || '未填寫說明' }}
    section.empty-card(v-else)
      p 目前沒有關帳歷程。
</template>

<style lang="sass">
.desk-page
  display: grid
  gap: 18px

.panel-card, .filter-card, .field-card, .info-card, .issue-card, .action-card, .history-card, .loading-card, .error-card, .empty-card, .status-card
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

.panel-card h2
  margin: 0 0 10px

.lead
  margin: 0
  color: #6f5b43
  line-height: 1.7

.filter-card
  display: flex
  justify-content: space-between
  align-items: end
  gap: 12px

.field-card
  display: grid
  gap: 8px
  padding: 0
  border: 0
  background: transparent

.info-label
  color: #8c7b65
  font-size: 13px

.field-input, .action-textarea
  width: 100%
  border: 0
  border-radius: 14px
  padding: 12px 14px
  background: rgba(121, 214, 207, 0.12)
  color: #2f2416

.action-textarea
  min-height: 110px
  resize: vertical

.filter-meta, .history-card__meta
  color: #7b8d90
  font-size: 12px

.stat-grid
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: 12px

.info-card
  display: grid
  gap: 8px

.info-value
  color: #2f2416

.status-card
  color: #6f5b43

.status-card__line
  margin: 0
  line-height: 1.7

.issue-card__title, .action-card__title, .history-card__title
  margin: 0 0 12px
  color: #243a3e

.issue-row, .history-row
  display: flex
  justify-content: space-between
  gap: 12px
  padding: 12px 0
  border-top: 1px solid rgba(91, 127, 130, 0.12)

.issue-row:first-of-type, .history-row:first-of-type
  border-top: 0

.issue-row__main, .history-row__main
  display: grid
  gap: 4px

.issue-row__meta, .history-row__meta
  display: grid
  gap: 4px
  text-align: right
  color: #6f8083

.history-row__reason-type
  color: #8c5a1f

.action-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 12px

.action-card
  display: grid
  gap: 12px

.action-field
  display: grid
  gap: 8px

.action-card__lead
  margin: 0
  color: #6f5b43
  line-height: 1.6

.action-button
  border: 0
  border-radius: 999px
  padding: 12px 16px
  background: #1f6f68
  color: #fff
  font-weight: 700
  cursor: pointer

.action-button.is-secondary
  background: rgba(140, 90, 31, 0.85)

.action-button:disabled
  opacity: 0.45
  cursor: default

.history-card__head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px
  margin-bottom: 12px

@media (max-width: 960px)
  .filter-card
    display: grid

  .stat-grid, .action-grid
    grid-template-columns: 1fr

  .issue-row, .history-row
    flex-direction: column

  .issue-row__meta, .history-row__meta
    text-align: left
</style>
