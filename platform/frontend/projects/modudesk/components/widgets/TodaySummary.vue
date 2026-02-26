<script setup>
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useTasks } from '@project/modules/tasks/composables/useTasks.js'
import { useTasksView } from '@project/composables/context/tasksViewContext.js'

const router = useRouter()
const { load, getTodaySummary } = useTasks()
const { setTasksViewMode } = useTasksView()

onMounted(() => {
  load().catch(() => {})
})

const summary = computed(() => getTodaySummary())

async function handleOpenOverdue() {
  setTasksViewMode('overdue')
  await router.push('/tasks')
}
</script>

<template lang="pug">
.today-summary-widget.notes-card
  .summary-head
    h3.notes-title Today Summary
    span.summary-date {{ summary.today }}
  .summary-grid
    .summary-item
      span.summary-label 今日新增
      strong.summary-value {{ summary.createdToday }}
    .summary-item
      span.summary-label 今日完成
      strong.summary-value {{ summary.doneToday }}
    .summary-item
      span.summary-label 今日待辦
      strong.summary-value {{ summary.dueTodayActive }}
    .summary-item(:class="{ 'is-alert': summary.overdue > 0 }")
      span.summary-label 逾期
      strong.summary-value {{ summary.overdue }}
  p.summary-meta 目前未完成總數：{{ summary.activeTotal }}
  button.summary-action(
    v-if="summary.overdue > 0"
    type="button"
    @click="handleOpenOverdue"
  ) 查看逾期
</template>

<style lang="sass">
.today-summary-widget
  display: grid
  gap: 0.7rem

.summary-head
  display: flex
  justify-content: space-between
  align-items: baseline
  gap: 0.5rem

.summary-date
  color: #7a8194
  font-size: 0.8rem

.summary-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 0.45rem

.summary-item
  border: 1px solid rgba(36, 42, 54, 0.06)
  background: rgba(255, 255, 255, 0.76)
  border-radius: 0.8rem
  padding: 0.55rem 0.65rem
  display: grid
  gap: 0.15rem

.summary-item.is-alert
  border-color: rgba(180, 35, 24, 0.16)
  background: rgba(180, 35, 24, 0.04)

.summary-label
  color: #7a8194
  font-size: 0.75rem

.summary-value
  color: #2a3040
  font-size: 1.05rem

.summary-item.is-alert .summary-value
  color: #b42318

.summary-meta
  margin: 0
  color: #6c7387
  font-size: 0.85rem

.summary-action
  justify-self: start
  border: 0
  border-radius: 999px
  background: rgba(180, 35, 24, 0.1)
  color: #b42318
  padding: 0.45rem 0.75rem
  cursor: pointer
</style>

