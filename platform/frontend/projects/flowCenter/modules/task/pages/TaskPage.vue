<script setup>
import { computed, onMounted, watch } from 'vue'
import world from '@/world.js'
import { useFlowCenterAuth } from '@project/services/flowCenterAuthService.js'

const auth = useFlowCenterAuth()
const taskStore = world.store('flowCenterTaskStore')
const state = taskStore.state
const form = state.form

const selectedId = computed({
  get: () => state.selectedId,
  set: (value) => taskStore.selectRecord(value)
})

const priorityLabelMap = {
  high: '高',
  medium: '中',
  low: '低'
}

const statusLabelMap = {
  todo: '待處理',
  doing: '進行中',
  done: '已完成'
}

const summary = computed(() => {
  const total = state.records.length
  const todo = state.records.filter((item) => item.status === 'todo').length
  const doing = state.records.filter((item) => item.status === 'doing').length
  const done = state.records.filter((item) => item.status === 'done').length
  return { total, todo, doing, done }
})

const selectedRecord = computed(() =>
  state.records.find((item) => item.id === selectedId.value) || state.records[0] || null
)

const isEditing = computed(() => Boolean(state.editingId))

function normalizeRecord(record) {
  return {
    ...record,
    priorityLabel: priorityLabelMap[record.priority] || record.priority,
    statusLabel: statusLabelMap[record.status] || record.status
  }
}

function loadTasks() {
  return taskStore.load()
}

function submitTask() {
  return taskStore.submit()
}

function deleteTask() {
  return taskStore.removeSelected()
}

function resetForm() {
  return taskStore.clearForm()
}

onMounted(loadTasks)
watch(() => auth.isLoggedIn.value, loadTasks)
</script>

<template lang="pug">
.task-page
  .hero.flow-glass
    .hero-copy
      p.eyebrow Task Module
      h2 任務交辦
      p.summary-text 任務頁面已改接後端 task API。employee 與 manager 都可查看；manager 具有更完整的可見與刪除能力。
    .hero-note
      span.note-label role
      strong.note-value {{ auth.role.value || 'guest' }}
  .panel.flow-glass(v-if="!auth.isLoggedIn.value")
    .panel-head
      h3 尚未登入
      span.panel-meta login required
    p.form-note 請先登入才能查看任務內容。
  template(v-else)
    .summary-grid
      article.summary-card.flow-glass
        p.card-label 任務總數
        p.card-value {{ summary.total }}
      article.summary-card.flow-glass
        p.card-label 待處理
        p.card-value {{ summary.todo }}
      article.summary-card.flow-glass
        p.card-label 進行中
        p.card-value {{ summary.doing }}
      article.summary-card.flow-glass
        p.card-label 已完成
        p.card-value {{ summary.done }}
    .content-grid
      section.panel.flow-glass
        .panel-head
          h3 {{ isEditing ? '編輯任務' : '新增任務' }}
          span.panel-meta {{ isEditing ? 'update' : 'create' }}
        .form-grid
          label.field.is-wide
            span.label 任務名稱
            input(type="text" v-model="form.title")
          label.field
            span.label 指派 user_id
            input(type="number" min="1" v-model="form.assigneeUserId")
          label.field
            span.label 截止日期
            input(type="date" v-model="form.dueDate")
          label.field
            span.label 優先度
            select(v-model="form.priority")
              option(value="high") 高
              option(value="medium") 中
              option(value="low") 低
          label.field
            span.label 狀態
            select(v-model="form.status")
              option(value="todo") 待處理
              option(value="doing") 進行中
              option(value="done") 已完成
          label.field.is-wide
            span.label 任務說明
            textarea(rows="5" v-model="form.description")
        p.form-note(v-if="state.error") {{ state.error }}
        .form-actions
          button.action-button(type="button" @click="submitTask" :disabled="state.saving")
            | {{ isEditing ? '更新任務' : '建立任務' }}
          button.action-button.secondary(type="button" @click="resetForm" :disabled="state.saving")
            | 切換為新增
          button.action-button.secondary(type="button" @click="deleteTask" :disabled="!selectedRecord || state.saving") 刪除選取任務
      section.panel.flow-glass
        .panel-head
          h3 任務清單
          span.panel-meta {{ state.loading ? 'loading' : 'list' }}
        p.form-note(v-if="!state.records.length") 目前沒有任務資料。
        .record-list(v-else)
          button.record-row(
            v-for="record in state.records"
            :key="record.id"
            type="button"
            :class="{ 'is-active': selectedId === record.id }"
            @click="selectedId = record.id"
          )
            .record-main
              strong {{ record.title }}
              span {{ record.due_date || '未指定日期' }}
            .record-side
              span.priority-chip(:class="`is-${record.priority}`") {{ record.priorityLabel }}
              span.status-chip(:class="`is-${record.status}`") {{ record.statusLabel }}
    section.detail-panel.flow-glass(v-if="selectedRecord")
      .panel-head
        h3 任務明細
        span.panel-meta {{ `#${selectedRecord.id}` }}
      .detail-grid
        .detail-item
          span.detail-label 任務名稱
          strong {{ selectedRecord.title }}
        .detail-item
          span.detail-label 建立者
          strong {{ selectedRecord.creator_user_id }}
        .detail-item
          span.detail-label 指派者
          strong {{ selectedRecord.assignee_user_id || '未指定' }}
        .detail-item
          span.detail-label 優先度
          strong {{ selectedRecord.priorityLabel }}
        .detail-item
          span.detail-label 狀態
          strong {{ selectedRecord.statusLabel }}
        .detail-item
          span.detail-label 截止日期
          strong {{ selectedRecord.due_date || '未指定' }}
      .detail-content
        span.detail-label 任務說明
        p {{ selectedRecord.description || '未填寫' }}
</template>

<style lang="sass">
.task-page
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
  min-width: 140px
  padding: 18px
  border-radius: 24px
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.82), rgba(237, 239, 255, 0.98))
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

.content-grid
  display: grid
  grid-template-columns: 1.1fr 1fr
  gap: 20px

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 12px
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
  background: linear-gradient(135deg, #8aa0ff 0%, #6f87f6 100%)
  color: #fff
  font-weight: 700
  cursor: pointer

.action-button.secondary
  background: rgba(255, 255, 255, 0.84)
  color: #241b31

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
  box-shadow: inset 0 0 0 1px rgba(117, 137, 246, 0.35)
  background: rgba(255, 255, 255, 0.88)

.record-main
  display: grid
  gap: 6px

.record-side
  display: flex
  flex-direction: column
  align-items: flex-end
  gap: 8px

.priority-chip, .status-chip
  padding: 6px 10px
  border-radius: 999px
  font-size: 12px
  font-weight: 700

.priority-chip.is-high
  background: rgba(254, 226, 226, 0.9)
  color: #b91c1c

.priority-chip.is-medium
  background: rgba(254, 249, 195, 0.9)
  color: #854d0e

.priority-chip.is-low
  background: rgba(219, 234, 254, 0.9)
  color: #1d4ed8

.status-chip.is-todo
  background: rgba(226, 232, 240, 0.8)
  color: #475569

.status-chip.is-doing
  background: rgba(224, 231, 255, 0.9)
  color: #4338ca

.status-chip.is-done
  background: rgba(209, 250, 229, 0.8)
  color: #166534

.detail-item, .detail-content
  padding: 14px 16px
  border-radius: 18px
  background: rgba(255, 255, 255, 0.62)

.detail-content p
  margin: 10px 0 0

@media (max-width: 960px)
  .hero, .content-grid, .summary-grid, .form-grid, .detail-grid
    grid-template-columns: 1fr
</style>
