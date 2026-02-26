<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useSelectedDate } from '@project/composables/context/dateContext.js'
import { useTasks } from '@project/modules/tasks/composables/useTasks.js'
import {
  addMonths,
  getMonthGrid,
  monthLabelFromKey,
  parseYearMonthKey,
  todayStr,
  toYearMonthKey,
} from '@project/modules/tasks/utils/date.js'

const newTitle = ref('')
const newPriority = ref('normal')
const localError = ref('')

const { selectedDate, setSelectedDate } = useSelectedDate()
const {
  loading,
  error,
  loaded,
  load,
  addTask,
  toggleTask,
  removeTask,
  updateTaskPriority,
  getTasksByDate,
  splitTasksByDone,
  getMonthPreview,
  getDayStatus,
} = useTasks()

const monthCursor = ref(new Date(`${selectedDate.value}T00:00:00`))

watch(selectedDate, (next) => {
  const parsed = new Date(`${next}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return
  if (toYearMonthKey(parsed) !== toYearMonthKey(monthCursor.value)) {
    monthCursor.value = parsed
  }
})

onMounted(async () => {
  await load().catch(() => {})
})

const monthKey = computed(() => toYearMonthKey(monthCursor.value))
const monthParts = computed(() => parseYearMonthKey(monthKey.value) || { year: 1970, month: 1 })
const monthLabel = computed(() => monthLabelFromKey(monthKey.value))
const monthCells = computed(() => getMonthGrid(monthParts.value.year, monthParts.value.month))
const monthPreview = computed(() => getMonthPreview(monthKey.value))

const selectedDateTasks = computed(() => getTasksByDate(selectedDate.value))
const selectedBuckets = computed(() => splitTasksByDone(selectedDateTasks.value))
const selectedActiveTasks = computed(() => selectedBuckets.value.active)
const selectedDoneTasks = computed(() => selectedBuckets.value.done)
const mergedError = computed(() => localError.value || error.value)

const stats = computed(() => ({
  total: selectedDateTasks.value.length,
  done: selectedDoneTasks.value.length,
  active: selectedActiveTasks.value.length,
}))

function priorityClass(priority) {
  return `priority-${priority || 'normal'}`
}

function previewItemsForDate(dateStr) {
  return (monthPreview.value.get(dateStr) || []).slice(0, 3)
}

function previewOverflowCount(dateStr) {
  const count = (monthPreview.value.get(dateStr) || []).length
  return count > 3 ? count - 3 : 0
}

function statusForDate(dateStr) {
  return getDayStatus(dateStr)
}

function goMonth(delta) {
  monthCursor.value = addMonths(monthCursor.value, delta)
}

function goToday() {
  const today = todayStr()
  setSelectedDate(today)
  monthCursor.value = new Date(`${today}T00:00:00`)
}

function pickDate(dateStr) {
  setSelectedDate(dateStr)
}

async function handleAdd() {
  localError.value = ''
  try {
    await addTask({
      title: newTitle.value,
      dueDate: selectedDate.value,
      priority: newPriority.value,
    })
    newTitle.value = ''
    newPriority.value = 'normal'
  } catch (e) {
    localError.value = e instanceof Error ? e.message : '新增失敗'
  }
}

async function handleToggle(id) {
  localError.value = ''
  try {
    await toggleTask(id)
  } catch (e) {
    localError.value = e instanceof Error ? e.message : '切換失敗'
  }
}

async function handleRemove(id) {
  localError.value = ''
  try {
    await removeTask(id)
  } catch (e) {
    localError.value = e instanceof Error ? e.message : '刪除失敗'
  }
}

async function handlePriorityChange(id, event) {
  localError.value = ''
  try {
    await updateTaskPriority(id, event.target.value)
  } catch (e) {
    localError.value = e instanceof Error ? e.message : '更新優先級失敗'
  }
}
</script>

<template lang="pug">
.calendar-home
  section.panel.calendar-board
    .calendar-header
      .header-title
        h2.page-title 行事曆
        p.page-sub 以日期檢視任務與完成紀錄
      .header-actions
        button.ctl-btn(type="button" @click="goMonth(-1)") 上一月
        button.ctl-btn(type="button" @click="goToday") Today
        button.ctl-btn(type="button" @click="goMonth(1)") 下一月
        span.month-badge {{ monthLabel }}

    .calendar-layout
      section.panel.month-panel
        .week-head
          span.week-label(v-for="week in ['一','二','三','四','五','六','日']" :key="week") {{ week }}
        .month-grid
          button.day-cell(
            v-for="cell in monthCells"
            :key="cell.key"
            type="button"
            :class="{ 'is-muted': !cell.inCurrentMonth, 'is-today': cell.isToday, 'is-selected': cell.dateStr === selectedDate }"
            @click="pickDate(cell.dateStr)"
          )
            .day-top
              span.day-num {{ cell.day }}
              .status-dots
                span.status-dot.dot-overdue(v-if="statusForDate(cell.dateStr).hasOverdue")
                span.status-dot.dot-todo(v-if="statusForDate(cell.dateStr).hasTodo")
                span.status-dot.dot-done(v-if="statusForDate(cell.dateStr).hasDone")
            ul.preview-list(v-if="previewItemsForDate(cell.dateStr).length > 0")
              li.preview-item(
                v-for="task in previewItemsForDate(cell.dateStr)"
                :key="task.id"
                :class="priorityClass(task.priority)"
              )
                span.preview-bar
                span.preview-text {{ task.title }}
            p.preview-more(v-if="previewOverflowCount(cell.dateStr) > 0") +{{ previewOverflowCount(cell.dateStr) }}

      section.panel.day-panel
        .day-panel-head
          div
            h3.section-title {{ selectedDate }}
            p.panel-desc 當天任務工作區（dueDate = selectedDate）
          .day-stats
            span.stat-pill total {{ stats.total }}
            span.stat-pill active {{ stats.active }}
            span.stat-pill done {{ stats.done }}

        .day-composer
          input.task-input(
            v-model="newTitle"
            type="text"
            :disabled="loading"
            placeholder="新增任務到選取日期..."
            @keydown.enter.prevent="handleAdd"
          )
          select.priority-input(v-model="newPriority" :disabled="loading")
            option(value="high") high
            option(value="normal") normal
            option(value="low") low
          button.add-btn(type="button" :disabled="loading" @click="handleAdd") 新增

        p.inline-error(v-if="mergedError") {{ mergedError }}

        .day-scroll
          .day-list-block
            h4.bucket-title 未完成
            p.empty(v-if="loaded && selectedActiveTasks.length === 0") 此日期沒有未完成任務。
            ul.day-task-list(v-else)
              li.day-task(v-for="task in selectedActiveTasks" :key="task.id" :class="priorityClass(task.priority)")
                label.day-task-check
                  input(type="checkbox" :checked="task.done" :disabled="loading" @change="handleToggle(task.id)")
                  span.day-task-title {{ task.title }}
                .day-task-tools
                  select.row-priority(
                    :value="task.priority"
                    :disabled="loading"
                    @change="handlePriorityChange(task.id, $event)"
                  )
                    option(value="high") high
                    option(value="normal") normal
                    option(value="low") low
                  button.row-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除

          .day-list-block
            h4.bucket-title 已完成
            p.empty(v-if="loaded && selectedDoneTasks.length === 0") 此日期沒有已完成任務。
            ul.day-task-list(v-else)
              li.day-task.is-done(v-for="task in selectedDoneTasks" :key="task.id" :class="priorityClass(task.priority)")
                label.day-task-check
                  input(type="checkbox" :checked="task.done" :disabled="loading" @change="handleToggle(task.id)")
                  span.day-task-title {{ task.title }}
                .day-task-tools
                  select.row-priority(
                    :value="task.priority"
                    :disabled="loading"
                    @change="handlePriorityChange(task.id, $event)"
                  )
                    option(value="high") high
                    option(value="normal") normal
                    option(value="low") low
                  button.row-btn(type="button" :disabled="loading" @click="handleRemove(task.id)") 刪除
</template>

<style lang="sass">
.calendar-home
  display: flex
  flex-direction: column
  gap: 1rem
  min-height: 0
  height: 100%
  overflow: hidden

.panel
  background: rgba(255, 255, 255, 0.76)
  border: 1px solid rgba(36, 42, 54, 0.08)
  border-radius: 1rem
  padding: 1rem
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.75)

.calendar-board
  display: flex
  flex-direction: column
  gap: 1rem
  min-height: 0
  flex: 1 1 auto
  overflow: hidden

.calendar-header
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 0.75rem
  flex: 0 0 auto

.header-title
  display: flex
  flex-direction: column
  gap: 0.2rem

.page-title
  margin: 0
  color: #242938

.page-sub
  margin: 0
  color: #6c7387
  font-size: 0.9rem

.header-actions
  display: flex
  flex-wrap: wrap
  justify-content: flex-end
  gap: 0.45rem

.ctl-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.88)
  color: #46506a
  border-radius: 999px
  padding: 0.4rem 0.75rem
  cursor: pointer

.month-badge
  display: inline-flex
  align-items: center
  border-radius: 999px
  padding: 0.4rem 0.75rem
  background: rgba(183, 155, 213, 0.15)
  color: #5e4f7f
  font-size: 0.85rem

.calendar-layout
  display: flex
  gap: 1rem
  align-items: stretch
  min-height: 0
  flex: 1 1 auto
  overflow: hidden

.month-panel
  display: flex
  flex-direction: column
  gap: 0.75rem
  flex: 0 1 40%
  min-width: 0
  min-height: 0

.week-head
  display: grid
  grid-template-columns: repeat(7, minmax(0, 1fr))
  gap: 0.35rem
  flex: 0 0 auto

.week-label
  text-align: center
  color: #7b8398
  font-size: 0.8rem
  font-weight: 600

.month-grid
  display: grid
  grid-template-columns: repeat(7, minmax(0, 1fr))
  gap: 0.35rem
  flex: 0 0 auto

.day-cell
  min-height: 8vh
  max-height: 8vh
  overflow: hidden
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.72)
  border-radius: 0.9rem
  padding: 0.35rem
  display: flex
  flex-direction: column
  gap: 0.22rem
  text-align: left
  cursor: pointer
  min-width: 0

.day-cell.is-muted
  opacity: 0.5

.day-cell.is-today
  border-color: rgba(183, 155, 213, 0.5)

.day-cell.is-selected
  box-shadow: inset 0 0 0 1px rgba(183, 155, 213, 0.3)
  background: rgba(183, 155, 213, 0.08)

.day-top
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.35rem

.day-num
  color: #31384a
  font-weight: 600
  font-size: 0.82rem

.status-dots
  display: inline-flex
  gap: 0.18rem
  align-items: center

.status-dot
  width: 0.35rem
  height: 0.35rem
  border-radius: 999px

.dot-overdue
  background: #df4a49

.dot-todo
  background: #e0b348

.dot-done
  background: #54b487

.preview-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: 0.2rem

.preview-item
  display: flex
  align-items: center
  gap: 0.28rem
  min-width: 0

.preview-bar
  width: 0.22rem
  min-width: 0.22rem
  height: 0.62rem
  border-radius: 999px
  background: #b59bda

.preview-item.priority-high .preview-bar
  background: #e35d6a

.preview-item.priority-normal .preview-bar
  background: #b59bda

.preview-item.priority-low .preview-bar
  background: #76b5a0

.preview-text
  flex: 1 1 auto
  min-width: 0
  color: #586076
  font-size: 0.68rem
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.preview-more
  margin: 0
  color: #7b8398
  font-size: 0.68rem

.day-panel
  display: flex
  flex-direction: column
  gap: 0.8rem
  min-height: 0
  flex: 1 1 60%
  min-width: 0
  overflow: hidden
  height: 64vh
  max-height: 64vh

.day-panel-head
  display: flex
  flex-direction: column
  gap: 0.45rem
  flex: 0 0 auto

.section-title
  margin: 0
  color: #242938

.panel-desc
  margin: 0.15rem 0 0
  color: #6c7387
  font-size: 0.85rem

.day-stats
  display: flex
  flex-wrap: wrap
  gap: 0.35rem

.stat-pill
  display: inline-flex
  align-items: center
  gap: 0.25rem
  min-height: 1.5rem
  border-radius: 999px
  padding: 0 0.5rem
  color: #5f6679
  background: rgba(36, 42, 54, 0.05)
  font-size: 0.75rem

.day-composer
  display: flex
  align-items: center
  flex-wrap: wrap
  gap: 0.45rem
  flex: 0 0 auto

.task-input
  width: 100%
  flex: 1 1 14rem
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.86)
  border-radius: 0.8rem
  padding: 0.65rem 0.8rem
  font: inherit

.priority-input, .row-priority
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.86)
  color: #475068
  border-radius: 0.8rem
  padding: 0.4rem 0.55rem
  font: inherit

.priority-input
  min-width: 5.8rem
  flex: 0 0 auto

.add-btn
  border: 0
  border-radius: 999px
  background: linear-gradient(135deg, #c7b4e2, #b59bda)
  color: #fff
  padding: 0.5rem 0.85rem
  cursor: pointer
  flex: 0 0 auto

.inline-error
  margin: 0
  color: #b42318
  font-size: 0.85rem
  flex: 0 0 auto

.day-scroll
  display: flex
  flex-direction: column
  gap: 0.8rem
  flex: 1 1 auto
  min-height: 0
  overflow-y: auto
  overflow-x: hidden
  padding-right: 0.2rem

.day-list-block
  display: flex
  flex-direction: column
  gap: 0.45rem
  flex: 0 0 auto

.bucket-title
  margin: 0
  color: #2a3040
  font-size: 0.95rem

.empty
  margin: 0
  color: #7a8193
  font-size: 0.85rem

.day-task-list
  list-style: none
  margin: 0
  padding: 0
  display: flex
  flex-direction: column
  gap: 0.45rem

.day-task
  border: 1px solid rgba(36, 42, 54, 0.06)
  background: rgba(255, 255, 255, 0.82)
  border-radius: 0.85rem
  padding: 0.55rem 0.65rem
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.4rem
  border-left: 4px solid #b59bda

.day-task.priority-high
  border-left-color: #e35d6a

.day-task.priority-normal
  border-left-color: #b59bda

.day-task.priority-low
  border-left-color: #76b5a0

.day-task.is-done .day-task-title
  text-decoration: line-through
  color: #81889a

.day-task-check
  display: flex
  align-items: center
  gap: 0.45rem
  min-width: 0
  flex: 1 1 auto

.day-task-title
  min-width: 0
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.day-task-tools
  display: inline-flex
  align-items: center
  gap: 0.35rem
  flex: 0 0 auto

.row-priority
  min-width: 5.2rem
  border-radius: 999px
  padding: 0.25rem 0.5rem
  font-size: 0.78rem

.row-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.86)
  color: #475068
  border-radius: 999px
  padding: 0.35rem 0.55rem
  cursor: pointer

@media (max-width: 1200px)
  .calendar-layout
    flex-direction: column
    overflow: visible

  .month-panel, .day-panel
    flex: 1 1 auto
    min-height: auto

  .day-panel
    overflow: visible
    height: auto
    max-height: none

  .day-scroll
    overflow: visible
    min-height: auto
    padding-right: 0

@media (max-width: 720px)
  .calendar-header
    flex-direction: column

  .header-actions
    justify-content: flex-start

  .day-cell
    min-height: 7vh
    max-height: 7vh

  .day-composer
    flex-direction: column
    align-items: stretch

  .day-task
    flex-direction: column
    align-items: stretch

  .day-task-tools
    justify-content: flex-start
    flex-wrap: wrap

  .day-panel
    height: 52vh
    max-height: 52vh
</style>

