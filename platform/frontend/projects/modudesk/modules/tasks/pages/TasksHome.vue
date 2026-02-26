<script setup>
import { computed, onMounted, ref } from 'vue'
import { useIdentity } from '@project/composables/useIdentity.js'
import { useSelectedDate } from '@project/composables/context/dateContext.js'
import { useTasksView } from '@project/composables/context/tasksViewContext.js'
import { useTasks } from '../composables/useTasks.js'
import { normalizeDueDate, todayStr } from '../utils/date.js'

const newTitle = ref('')
const formError = ref('')
const { isLoggedIn, identity, ensureHydrated } = useIdentity()
const { viewMode, setTasksViewMode } = useTasksView()
const { selectedDate, setSelectedDate } = useSelectedDate()
const {
  loading,
  error,
  loaded,
  isOverdue,
  getTasksByDate,
  getOverdueTasks,
  splitTasksByDone,
  load,
  addTask,
  toggleTask,
  removeTask,
  clearDoneTasks,
  updateTaskPriority,
  updateTaskDueDate,
} = useTasks()

const mergedError = computed(() => formError.value || error.value)
const visibleTasks = computed(() => (
  viewMode.value === 'overdue'
    ? getOverdueTasks()
    : getTasksByDate(selectedDate.value)
))
const visibleBuckets = computed(() => splitTasksByDone(visibleTasks.value))
const activeTasks = computed(() => visibleBuckets.value.active)
const doneTasks = computed(() => visibleBuckets.value.done)
const total = computed(() => visibleTasks.value.length)
const done = computed(() => doneTasks.value.length)
const active = computed(() => activeTasks.value.length)
const viewTitle = computed(() => (
  viewMode.value === 'overdue'
    ? '逾期任務'
    : `${selectedDate.value} 任務`
))
const isOverdueView = computed(() => viewMode.value === 'overdue')

onMounted(async () => {
  setSelectedDate(selectedDate.value)
  await Promise.allSettled([ensureHydrated(), load()])
})

async function handleAdd() {
  formError.value = ''
  try {
    await addTask({
      title: newTitle.value,
      dueDate: viewMode.value === 'date' ? selectedDate.value : todayStr(),
    })
    newTitle.value = ''
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '新增 Task 失敗'
  }
}

async function handleToggle(id) {
  formError.value = ''
  try {
    await toggleTask(id)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '切換 Task 失敗'
  }
}

async function handleRemove(id) {
  formError.value = ''
  try {
    await removeTask(id)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '刪除 Task 失敗'
  }
}

async function handleClearDone() {
  formError.value = ''
  try {
    await clearDoneTasks()
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '清空已完成失敗'
  }
}

async function handlePriorityChange(id, event) {
  formError.value = ''
  try {
    await updateTaskPriority(id, event.target.value)
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '更新優先級失敗'
  }
}

async function handleDueDateChange(id, event) {
  formError.value = ''
  try {
    await updateTaskDueDate(id, normalizeDueDate(event.target.value))
  } catch (err) {
    formError.value = err instanceof Error ? err.message : '更新日期失敗'
  }
}

function priorityLabel(priority) {
  if (priority === 'high') return '高'
  if (priority === 'low') return '低'
  return '中'
}

function switchToToday() {
  setTasksViewMode('date')
  setSelectedDate(todayStr())
}

function switchToOverdue() {
  setTasksViewMode('overdue')
}

function switchToDateMode() {
  setTasksViewMode('date')
}
</script>

<template lang="pug">
.tasks-home
  section.hero-board
    .hero-main.panel
      .hero-head
        div
          h2.panel-title 我的任務
          p.panel-desc(v-if="isLoggedIn && identity") {{ identity.displayName }}，今天先完成 1 件最重要的事。
          p.panel-desc(v-else) 未登入也可使用，任務仍會保留在本機。
        span.login-hint 使用右上固定登入元件
      .schedule-row
        label.schedule-field
          span.schedule-label {{ isOverdueView ? '目前檢視' : '目前日期檢視' }}
          .view-tools
            button.view-btn(
              type="button"
              :class="{ 'is-active': !isOverdueView }"
              :disabled="loading"
              @click="switchToDateMode"
            ) Date
            button.view-btn(
              type="button"
              :class="{ 'is-active': isOverdueView }"
              :disabled="loading"
              @click="switchToOverdue"
            ) Overdue
            button.view-btn(type="button" :disabled="loading" @click="switchToToday") Today
        label.schedule-field
          span.schedule-label selectedDate
          input.input(
            :value="selectedDate"
            type="date"
            :disabled="loading"
            @change="switchToDateMode(); setSelectedDate($event.target.value)"
          )
      .composer
        input.input(
          v-model="newTitle"
          type="text"
          :placeholder="isOverdueView ? '新增任務（預設排到今天）...' : '新增一個今天要完成的任務...'"
          :disabled="loading"
          @keydown.enter.prevent="handleAdd"
        )
        button.btn(type="button" :disabled="loading" @click="handleAdd") 新增
      p.error(v-if="mergedError") {{ mergedError }}

    section.panel.stats-panel
      .stats-head
        h3.section-title {{ viewTitle }}
        button.btn.btn-secondary(
          type="button"
          :disabled="loading || done === 0"
          @click="handleClearDone"
        ) 清空已完成
      ul.stats
        li.stat-item
          span.label total
          strong.value {{ total }}
        li.stat-item
          span.label active
          strong.value {{ active }}
        li.stat-item
          span.label done
          strong.value {{ done }}

  .dashboard-grid
    section.panel.list-panel
      .panel-bar
        h3.section-title 未完成
        span.panel-badge {{ activeTasks.length }}
      p.empty(v-if="loaded && activeTasks.length === 0") 目前沒有未完成任務。
      ul.task-list(v-else)
        li.task-item(:class="[`priority-${task.priority}`]" v-for="task in activeTasks" :key="task.id")
          .task-main
            label.checkbox-wrap
              input(
                type="checkbox"
                :checked="task.done"
                :disabled="loading"
                @change="handleToggle(task.id)"
              )
              span.task-title {{ task.title }}
            .task-meta
              span.meta-pill(:class="`pill-${task.priority}`") 優先級：{{ priorityLabel(task.priority) }}
              span.meta-pill(v-if="task.dueDate") 到期：{{ task.dueDate }}
              span.meta-pill.is-muted(v-else) 未排期
              span.meta-pill.is-danger(v-if="isOverdue(task)") 已逾期
          .task-controls
            select.select(
              :value="task.priority"
              :disabled="loading"
              @change="handlePriorityChange(task.id, $event)"
            )
              option(value="high") high
              option(value="normal") normal
              option(value="low") low
            input.date-input(
              :value="task.dueDate || ''"
              type="date"
              :disabled="loading"
              @change="handleDueDateChange(task.id, $event)"
            )
            button.icon-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除

    section.panel.list-panel
      .panel-bar
        h3.section-title 已完成
        span.panel-badge.is-soft {{ doneTasks.length }}
      p.empty(v-if="loaded && doneTasks.length === 0") 目前沒有已完成任務。
      ul.task-list(v-else)
        li.task-item.is-done(:class="[`priority-${task.priority}`]" v-for="task in doneTasks" :key="task.id")
          .task-main
            label.checkbox-wrap
              input(
                type="checkbox"
                :checked="task.done"
                :disabled="loading"
                @change="handleToggle(task.id)"
              )
              span.task-title {{ task.title }}
            .task-meta
              span.meta-pill(:class="`pill-${task.priority}`") 優先級：{{ priorityLabel(task.priority) }}
              span.meta-pill(v-if="task.dueDate") 到期：{{ task.dueDate }}
              span.meta-pill.is-muted(v-else) 未排期
              span.meta-pill(v-if="task.doneAt") 完成：{{ task.doneAt }}
          .task-controls
            select.select(
              :value="task.priority"
              :disabled="loading"
              @change="handlePriorityChange(task.id, $event)"
            )
              option(value="high") high
              option(value="normal") normal
              option(value="low") low
            input.date-input(
              :value="task.dueDate || ''"
              type="date"
              :disabled="loading"
              @change="handleDueDateChange(task.id, $event)"
            )
            button.icon-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除

    section.panel.mini-panel
      h3.section-title 使用說明
      p.note-line(v-if="isLoggedIn && identity") 已登入身分：{{ identity.displayName }}
      p.note-line(v-else) 尚未登入，可先在右上角登入元件操作。
      p.note-line 新增／勾選／刪除／清空已完成都會即時寫入 local-first storage。
      p.note-line 重新整理頁面後，Tasks 與 Identity（未登出時）都會保留。
      p.note-line MiniCalendar 可跨頁切換 selectedDate（在行事曆頁不顯示）。
      p.note-line 本階段不依賴後端 API，僅透過 `world.services.storage()`。
</template>

<style lang="sass">
.tasks-home
  --space-1: 0.5rem
  --space-2: 0.75rem
  --space-3: 1rem
  --space-4: 1.25rem
  --space-5: 1.5rem
  --radius-1: 0.9rem
  --radius-2: 1rem
  --border-color: rgba(36, 42, 54, 0.08)
  display: flex
  flex-direction: column
  gap: var(--space-3)
  max-width: 100%
  margin: 0 auto
  min-height: 0

.panel
  background: rgba(255, 255, 255, 0.76)
  border: 1px solid var(--border-color)
  border-radius: var(--radius-2)
  padding: var(--space-4)
  display: flex
  flex-direction: column
  gap: var(--space-2)
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75)

.hero-board
  display: flex
  gap: var(--space-3)
  align-items: stretch
  flex-wrap: wrap

.hero-main
  flex: 1 1 38rem

.stats-panel
  flex: 1 1 20rem

.dashboard-grid
  display: flex
  align-items: stretch
  flex-wrap: wrap
  gap: var(--space-3)
  min-height: 0

.list-panel
  flex: 1 1 21rem
  min-height: 20rem
  max-height: 20rem
  overflow: hidden

.mini-panel
  flex: 0 1 16rem
  gap: 0.65rem
  max-height: 20rem
  overflow: auto
  padding-right: 0.2rem

.hero-head
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: var(--space-3)

.panel-title, .section-title
  margin: 0
  color: #242938

.panel-desc
  margin: 0.25rem 0 0
  color: #6c7387

.login-hint
  color: #6f5d98
  background: rgba(183, 155, 213, 0.14)
  border-radius: 999px
  padding: 0.45rem 0.75rem
  font-size: 0.85rem

.composer
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: var(--space-2)

.schedule-row
  display: flex
  justify-content: space-between
  gap: var(--space-2)
  flex-wrap: wrap

.schedule-field
  display: grid
  gap: 0.35rem

.schedule-label
  color: #6c7387
  font-size: 0.75rem
  text-align: right

.view-tools
  display: flex
  gap: 0.4rem
  flex-wrap: wrap
  justify-content: flex-end

.view-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.84)
  color: #566078
  border-radius: 999px
  padding: 0.35rem 0.65rem
  font-size: 0.78rem
  cursor: pointer

.view-btn.is-active
  color: #5f4f80
  background: rgba(183, 155, 213, 0.16)
  border-color: rgba(183, 155, 213, 0.22)

.input
  width: 100%
  border: 1px solid rgba(36, 42, 54, 0.09)
  background: rgba(255, 255, 255, 0.8)
  border-radius: 0.9rem
  padding: 0.8rem 0.9rem
  font: inherit

.composer .input
  flex: 1 1 14rem

.composer .btn
  flex: 0 0 auto

.btn
  border: 0
  background: linear-gradient(135deg, #c7b4e2, #b59bda)
  color: #fff
  border-radius: 999px
  padding: 0.55rem 0.95rem
  cursor: pointer
  box-shadow: 0 8px 18px rgba(181, 155, 218, 0.24)

.btn:disabled, .icon-btn:disabled
  opacity: 0.6
  cursor: not-allowed

.btn-secondary
  background: rgba(255, 255, 255, 0.85)
  color: #283044
  border: 1px solid var(--border-color)
  box-shadow: none

.error
  margin: 0
  color: #b42318

.stats-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: var(--space-2)

.stats
  list-style: none
  display: grid
  grid-template-columns: repeat(3, minmax(0, 1fr))
  gap: var(--space-2)
  margin: 0
  padding: 0

.stat-item
  border: 1px solid rgba(36, 42, 54, 0.06)
  background: rgba(255, 255, 255, 0.78)
  border-radius: 0.9rem
  padding: 0.85rem
  display: grid
  gap: 0.25rem

.label
  color: #7c8498
  text-transform: uppercase
  font-size: 0.75rem

.value
  font-size: 1.2rem
  color: #2a3040

.panel-bar
  display: flex
  justify-content: space-between
  align-items: center
  gap: var(--space-2)

.panel-badge
  min-width: 1.75rem
  height: 1.75rem
  border-radius: 999px
  display: grid
  place-items: center
  padding: 0 0.45rem
  font-size: 0.8rem
  color: #5e4f7f
  background: rgba(183, 155, 213, 0.18)

.panel-badge.is-soft
  background: rgba(183, 155, 213, 0.1)
  color: #7a7090

.empty
  margin: 0
  color: #7a8193
  overflow: auto

.task-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: var(--space-2)
  min-height: 0
  overflow: auto
  padding-right: 0.2rem

.task-item
  display: flex
  flex-direction: column
  align-items: stretch
  gap: var(--space-2)
  border: 1px solid rgba(36, 42, 54, 0.05)
  background: rgba(255, 255, 255, 0.76)
  border-radius: 0.85rem
  padding: 0.7rem 0.8rem
  border-left-width: 4px

.task-item.priority-high
  border-left-color: #e35d6a

.task-item.priority-normal
  border-left-color: #b59bda

.task-item.priority-low
  border-left-color: #76b5a0

.task-item.is-done .task-title
  text-decoration: line-through
  color: #81889a

.task-main
  min-width: 0
  display: flex
  flex-direction: column
  gap: 0.45rem

.task-meta
  display: flex
  flex-wrap: wrap
  gap: 0.35rem

.meta-pill
  display: inline-flex
  align-items: center
  min-height: 1.35rem
  padding: 0 0.45rem
  border-radius: 999px
  font-size: 0.72rem
  color: #5f6679
  background: rgba(36, 42, 54, 0.05)

.meta-pill.is-muted
  color: #8a90a0

.meta-pill.is-danger
  color: #b42318
  background: rgba(180, 35, 24, 0.09)

.meta-pill.pill-high
  color: #a23a46
  background: rgba(227, 93, 106, 0.12)

.meta-pill.pill-normal
  color: #6f5d98
  background: rgba(183, 155, 213, 0.14)

.meta-pill.pill-low
  color: #3f7e69
  background: rgba(118, 181, 160, 0.14)

.checkbox-wrap
  display: flex
  align-items: center
  gap: var(--space-2)
  min-width: 0
  flex-wrap: nowrap

.checkbox-wrap > input[type="checkbox"]
  margin-top: 0
  flex: 0 0 auto

.task-title
  display: block
  min-width: 0
  white-space: normal
  text-overflow: clip
  overflow: visible
  line-height: 1.35
  overflow-wrap: anywhere
  color: #2e3546

.task-controls
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 0.45rem
  min-width: 0
  width: 100%

.task-controls .select
  flex: 1 1 6.5rem

.task-controls .date-input
  flex: 1 1 8.5rem

.task-controls .icon-btn
  flex: 0 0 auto

.select
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.82)
  color: #394055
  border-radius: 0.6rem
  padding: 0.35rem 0.5rem
  font: inherit
  min-width: 0

.date-input
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.82)
  color: #394055
  border-radius: 0.6rem
  padding: 0.3rem 0.45rem
  font: inherit
  min-width: 0

.icon-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.82)
  color: #394055
  border-radius: 999px
  padding: 0.375rem 0.625rem
  cursor: pointer
  white-space: nowrap

@media (max-width: 900px)
  .task-controls
    flex-direction: column
    align-items: stretch

@media (max-width: 720px)
  .task-meta
    display: grid
    grid-template-columns: 1fr

  .meta-pill
    width: fit-content

.note-line
  margin: 0
  color: #70788c
  line-height: 1.5

@media (max-width: 1100px)
  .hero-board
    flex-direction: column

  .dashboard-grid
    flex-direction: column

  .list-panel, .mini-panel
    max-height: none

@media (max-width: 640px)
  .hero-head
    flex-direction: column

  .composer
    flex-direction: column
    align-items: stretch

  .schedule-row
    justify-content: flex-start

  .schedule-label
    text-align: left

  .view-tools
    justify-content: flex-start

  .stats
    grid-template-columns: 1fr

  .date-input, .select
    width: 100%

  .task-controls
    flex-direction: column
    width: 100%
    align-items: stretch
</style>
