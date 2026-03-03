<script setup>
import { computed, reactive, watch } from 'vue'
import world from '@/world.js'

const auditCloseStore = world.store('dineCoreAuditCloseStore')
const state = computed(() => auditCloseStore.state)
const form = reactive({
  closeReasonType: 'daily_close',
  closeReason: '',
  unlockReasonType: 'correction',
  unlockReason: ''
})

const statusLabelMap = {
  open: '未關帳',
  closed: '已關帳',
  reopened: '已解鎖'
}

const scopeLabelMap = {
  orders: '訂單狀態',
  payments: '付款狀態'
}

const reasonTypeLabelMap = {
  daily_close: '正常日結',
  shift_handover: '交班結束',
  correction: '資料修正',
  dispute: '帳務爭議',
  manual_override: '管理者覆核',
  general: '一般備註'
}

watch(
  () => state.value.selectedDate,
  () => {
    auditCloseStore.load()
  },
  { immediate: true }
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
    p.eyebrow 關帳與稽核
    h2 營業日關帳控制台
    p.lead 這裡負責營業日關帳、鎖定與解鎖紀錄。關帳後，該營業日的訂單狀態與付款狀態調整應被 API 阻擋。

  section.filter-card
    label.field-card
      span.info-label 營業日
      input.field-input(
        type="date"
        :value="state.selectedDate"
        @input="auditCloseStore.setSelectedDate($event.target.value)"
      )
    span.filter-meta(v-if="state.lastLoadedAt") {{ `最近更新 ${state.lastLoadedAt}` }}

  section.loading-card(v-if="state.loading")
    p 載入關帳資料中...

  section.error-card(v-else-if="state.error && !state.closingSummary.businessDate")
    p {{ `關帳資料載入失敗：${state.error}` }}

  template(v-else)
    section.error-card(v-if="state.error")
      p {{ state.error }}

    section.stat-grid
      article.info-card
        span.info-label 狀態
        strong.info-value {{ statusLabelMap[state.closingSummary.closeStatus] || state.closingSummary.closeStatus }}
      article.info-card
        span.info-label 訂單數
        strong.info-value {{ state.closingSummary.orderCount }}
      article.info-card
        span.info-label 未完成訂單
        strong.info-value {{ state.closingSummary.unfinishedOrderCount }}
      article.info-card
        span.info-label 總營收
        strong.info-value {{ `NT$ ${state.closingSummary.grossSales}` }}
      article.info-card
        span.info-label 已付款
        strong.info-value {{ `NT$ ${state.closingSummary.paidAmount}` }}
      article.info-card
        span.info-label 未付款
        strong.info-value {{ `NT$ ${state.closingSummary.unpaidAmount}` }}
      article.info-card
        span.info-label 鎖定範圍
        strong.info-value {{ state.lockState.lockedScopes.length > 0 ? state.lockState.lockedScopes.map(scope => scopeLabelMap[scope] || scope).join(' / ') : '目前未鎖定' }}

    section.status-card
      p.status-card__line(v-if="state.lockState.isLocked")
        strong 目前狀態：
        | {{ ` ${state.selectedDate} 已關帳，訂單與付款修改會被 API 拒絕。` }}
      p.status-card__line(v-else-if="state.closingSummary.closeStatus === 'reopened'")
        strong 目前狀態：
        |  這個營業日已被解鎖，可進行必要修正，但應保留稽核紀錄。
      p.status-card__line(v-else)
        strong 目前狀態：
        |  這個營業日仍可編輯，若要結束作業可在完成檢查後執行關帳。

    section.issue-card(v-if="state.blockingIssues.length > 0")
      h3.issue-card__title 關帳阻塞項目
      .issue-row(v-for="issue in state.blockingIssues" :key="issue.type")
        .issue-row__main
          strong {{ issue.label }}
          span {{ `${issue.count} 筆` }}
        small.issue-row__meta {{ issue.orderIds.join(', ') }}
    section.empty-card(v-else)
      p 目前沒有阻塞項目，可以執行關帳。

    section.action-grid
      article.action-card
        h3.action-card__title 執行關帳
        p.action-card__lead 當阻塞項目為 0 時，店長可將目前營業日標記為已關帳並鎖定修改。
        label.action-field
          span.info-label 原因分類
          select.field-input(v-model="form.closeReasonType")
            option(value="daily_close") 正常日結
            option(value="shift_handover") 交班結束
            option(value="manual_override") 管理者覆核
        textarea.action-textarea(
          v-model="form.closeReason"
          placeholder="可填寫關帳備註（非必填）"
        )
        button.action-button(
          type="button"
          :disabled="state.closeActionLoading || state.blockingIssues.length > 0 || state.lockState.isLocked"
          @click="submitClose()"
        ) {{ state.closeActionLoading ? '關帳中...' : '執行關帳' }}

      article.action-card
        h3.action-card__title 解鎖營業日
        p.action-card__lead 已關帳資料若需修正，只能由店長解鎖，且必須填寫原因。
        label.action-field
          span.info-label 原因分類
          select.field-input(v-model="form.unlockReasonType")
            option(value="correction") 資料修正
            option(value="dispute") 帳務爭議
            option(value="manual_override") 管理者覆核
        textarea.action-textarea(
          v-model="form.unlockReason"
          placeholder="請填寫解鎖原因"
        )
        button.action-button.is-secondary(
          type="button"
          :disabled="state.unlockActionLoading || !state.lockState.isLocked || !form.unlockReason.trim()"
          @click="submitUnlock()"
        ) {{ state.unlockActionLoading ? '解鎖中...' : '執行解鎖' }}

    section.history-card(v-if="state.closeHistory.length > 0")
      .history-card__head
        h3.history-card__title 關帳歷史
        span.history-card__meta {{ `${state.closeHistory.length} 筆` }}
      .history-row(v-for="entry in state.closeHistory" :key="entry.id")
        .history-row__main
          strong {{ entry.action === 'close' ? '關帳' : '解鎖' }}
          span {{ `${entry.actorName}｜${entry.actorRole}` }}
          small.history-row__reason-type {{ reasonTypeLabelMap[entry.reasonType] || entry.reasonType }}
        .history-row__meta
          span {{ entry.createdAt }}
          small(v-if="entry.affectedScopes.length > 0") {{ `影響：${entry.affectedScopes.map(scope => scopeLabelMap[scope] || scope).join(' / ')}` }}
          small(v-if="entry.beforeStatus || entry.afterStatus") {{ `狀態：${statusLabelMap[entry.beforeStatus] || entry.beforeStatus} -> ${statusLabelMap[entry.afterStatus] || entry.afterStatus}` }}
          small {{ entry.reason || '無備註' }}
    section.empty-card(v-else)
      p 目前尚無關帳歷史。
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
