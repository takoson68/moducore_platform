<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useSelectedDate } from '@project/composables/context/dateContext.js'
import { useCalendarEvents } from '@project/composables/useCalendarEvents.js'
import {
  addMonths,
  formatDateTimeInput,
  formatDateTimeLabel,
  getMonthGrid,
  monthLabelFromKey,
  normalizeDateTimeInput,
  parseYearMonthKey,
  todayStr,
  toDayEnd,
  toDayStart,
  toMonthRange,
  toYearMonthKey,
} from '@project/utils/date.js'

const { selectedDate, setSelectedDate } = useSelectedDate()
const {
  loading,
  error,
  loaded,
  load,
  createEvent,
  updateEvent,
  removeEvent,
  listByRange,
  getEventsByDate,
  flushPendingSave,
} = useCalendarEvents()

const monthCursor = ref(new Date(`${selectedDate.value}T00:00:00`))
const localError = ref('')
const isEditorOpen = ref(false)
const editingEventId = ref('')
const eventForm = reactive(createEmptyForm())

function createEmptyForm() {
  const start = `${todayStr()}T09:00`
  const end = `${todayStr()}T10:00`
  return {
    title: '',
    startAt: start,
    endAt: end,
    notes: '',
  }
}

function resetForm(dateStr = selectedDate.value) {
  eventForm.title = ''
  eventForm.startAt = `${dateStr}T09:00`
  eventForm.endAt = `${dateStr}T10:00`
  eventForm.notes = ''
  editingEventId.value = ''
}

watch(selectedDate, (next) => {
  const parsed = new Date(`${next}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return
  if (toYearMonthKey(parsed) !== toYearMonthKey(monthCursor.value)) {
    monthCursor.value = parsed
  }

  if (!editingEventId.value) {
    resetForm(next)
  }
})

onMounted(async () => {
  resetForm(selectedDate.value)
  await load().catch(() => {})
})

onBeforeUnmount(() => {
  flushPendingSave().catch(() => {})
})

const monthKey = computed(() => toYearMonthKey(monthCursor.value))
const monthParts = computed(() => parseYearMonthKey(monthKey.value) || { year: 1970, month: 1 })
const monthLabel = computed(() => monthLabelFromKey(monthKey.value))
const monthCells = computed(() => getMonthGrid(monthParts.value.year, monthParts.value.month))
const weekdayLabel = computed(() => new Intl.DateTimeFormat('zh-TW', { weekday: 'long' }).format(new Date(`${selectedDate.value}T00:00:00`)))
const selectedDateParts = computed(() => selectedDate.value.split('-'))
const mergedError = computed(() => localError.value || error.value)
const selectedDayEvents = computed(() => getEventsByDate(selectedDate.value))
const monthRangeEvents = computed(() => {
  const { start, end } = toMonthRange(monthCursor.value)
  return listByRange({ startAt: start, endAt: end })
})
const monthPreview = computed(() => {
  const bucket = new Map()
  monthRangeEvents.value.forEach((event) => {
    const dayKey = event.startAt.slice(0, 10)
    const list = bucket.get(dayKey) || []
    list.push(event)
    bucket.set(dayKey, list)
  })
  return bucket
})

function openCreateEditor(dateStr = selectedDate.value) {
  localError.value = ''
  isEditorOpen.value = true
  editingEventId.value = ''
  resetForm(dateStr)
}

function openEditEditor(event) {
  localError.value = ''
  isEditorOpen.value = true
  editingEventId.value = event.id
  eventForm.title = event.title
  eventForm.startAt = formatDateTimeInput(event.startAt)
  eventForm.endAt = formatDateTimeInput(event.endAt)
  eventForm.notes = event.notes || ''
}

function closeEditor() {
  isEditorOpen.value = false
  resetForm(selectedDate.value)
}

function buildPayload() {
  const title = typeof eventForm.title === 'string' ? eventForm.title.trim() : ''
  const startAt = normalizeDateTimeInput(eventForm.startAt)
  const endAt = normalizeDateTimeInput(eventForm.endAt)

  if (!title) {
    throw new Error('事件標題不可為空')
  }
  if (!startAt || !endAt) {
    throw new Error('請填寫開始與結束時間')
  }
  if (new Date(endAt).getTime() < new Date(startAt).getTime()) {
    throw new Error('結束時間不得早於開始時間')
  }

  return {
    title,
    startAt,
    endAt,
    notes: typeof eventForm.notes === 'string' ? eventForm.notes.trim() : '',
  }
}

async function handleSubmit() {
  localError.value = ''
  try {
    const payload = buildPayload()
    if (editingEventId.value) {
      await updateEvent(editingEventId.value, payload)
    } else {
      await createEvent(payload)
    }
    setSelectedDate(payload.startAt.slice(0, 10))
    closeEditor()
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '儲存事件失敗'
  }
}

async function handleRemove(id) {
  localError.value = ''
  try {
    await removeEvent(id)
    if (editingEventId.value === id) {
      closeEditor()
    }
  } catch (error) {
    localError.value = error instanceof Error ? error.message : '刪除事件失敗'
  }
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

function eventsForCell(dateStr) {
  return monthPreview.value.get(dateStr) || []
}

function selectedDayRangeLabel() {
  return `${selectedDateParts.value[0]} 年 ${selectedDateParts.value[1]} 月 ${selectedDateParts.value[2]} 日`
}

function startAtLabel(value) {
  return formatDateTimeLabel(value)
}

function dayRangeEvents() {
  return listByRange({
    startAt: toDayStart(`${selectedDate.value}T00:00:00`),
    endAt: toDayEnd(`${selectedDate.value}T00:00:00`),
  })
}
</script>

<template lang="pug">
.calendar-home
  section.panel.calendar-board
    .calendar-header
      .header-title
        h2.page-title 行事曆
        p.page-sub 保留完整事件能力，Task UI 退場但 Calendar 事件管理維持可用。
      .header-actions
        button.ctl-btn(type="button" @click="goMonth(-1)") 上一月
        button.ctl-btn(type="button" @click="goToday") Today
        button.ctl-btn(type="button" @click="goMonth(1)") 下一月
        span.month-badge {{ monthLabel }}
        button.add-btn(type="button" @click="openCreateEditor()") 新增事件

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
              span.day-pill(v-if="eventsForCell(cell.dateStr).length > 0") {{ eventsForCell(cell.dateStr).length }}
            ul.preview-list(v-if="eventsForCell(cell.dateStr).length > 0")
              li.preview-item(v-for="event in eventsForCell(cell.dateStr).slice(0, 2)" :key="event.id")
                span.preview-text {{ event.title }}
            p.preview-more(v-if="eventsForCell(cell.dateStr).length > 2") +{{ eventsForCell(cell.dateStr).length - 2 }}

      section.panel.day-panel
        .day-panel-head
          div
            h3.section-title {{ selectedDate }}
            p.panel-desc {{ weekdayLabel }}，共 {{ dayRangeEvents().length }} 筆事件。
          button.add-btn(type="button" @click="openCreateEditor(selectedDate)") 在此日新增

        p.error(v-if="mergedError") {{ mergedError }}

        .day-scroll
          .day-list-block
            h4.bucket-title 日期聚焦
            p.focus-line {{ selectedDayRangeLabel() }}
            p.empty(v-if="loaded && selectedDayEvents.length === 0") 這一天還沒有事件。
            ul.event-list(v-else)
              li.event-card(v-for="event in selectedDayEvents" :key="event.id")
                .event-copy
                  h4.event-title {{ event.title }}
                  p.event-time {{ startAtLabel(event.startAt) }} - {{ startAtLabel(event.endAt) }}
                  p.event-notes(v-if="event.notes") {{ event.notes }}
                .event-actions
                  button.event-btn(type="button" @click="openEditEditor(event)") 編輯
                  button.event-btn.is-danger(type="button" @click="handleRemove(event.id)") 刪除

          //- .day-list-block
          //-   h4.bucket-title 月事件總覽
          //-   p.empty(v-if="loaded && monthRangeEvents.length === 0") 這個月份還沒有事件。
          //-   ul.event-list(v-else)
          //-     li.event-card(v-for="event in monthRangeEvents" :key="event.id")
          //-       .event-copy
          //-         h4.event-title {{ event.title }}
          //-         p.event-time {{ startAtLabel(event.startAt) }} - {{ startAtLabel(event.endAt) }}
          //-       .event-actions
          //-         button.event-btn(type="button" @click="pickDate(event.startAt.slice(0, 10)); openEditEditor(event)") 管理

  .event-modal(v-if="isEditorOpen")
    .event-modal-backdrop(@click="closeEditor")
    .event-modal-panel
      .modal-head
        h3.modal-title {{ editingEventId ? '編輯事件' : '新增事件' }}
        button.close-btn(type="button" @click="closeEditor") 關閉
      .modal-body
        label.form-field
          span.form-label 標題
          input.form-input(v-model="eventForm.title" type="text" placeholder="輸入事件標題")
        .form-grid
          label.form-field
            span.form-label 開始時間
            input.form-input(v-model="eventForm.startAt" type="datetime-local")
          label.form-field
            span.form-label 結束時間
            input.form-input(v-model="eventForm.endAt" type="datetime-local")
        label.form-field
          span.form-label 備註
          textarea.form-textarea(v-model="eventForm.notes" placeholder="補充細節或地點")
      .modal-actions
        button.event-btn(type="button" @click="handleSubmit") {{ editingEventId ? '更新事件' : '建立事件' }}
        button.event-btn(type="button" @click="closeEditor") 取消
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
  // background: rgba(255, 255, 255, 0.76)
  // border: 1px solid rgba(36, 42, 54, 0.08)
  // border-radius: 1rem
  padding: 1rem

.calendar-board
  display: grid
  grid-template-rows: auto minmax(0, 1fr)
  gap: 1rem
  min-height: 0
  height: 94%

.calendar-header
  display: flex
  justify-content: space-between
  align-items: center
  gap: 1rem
  flex-wrap: wrap

.header-title
  display: grid
  gap: 0.2rem

.page-title
  margin: 0
  font-size: 1.45rem

.page-sub
  margin: 0
  color: #727b8f

.header-actions
  display: flex
  align-items: center
  gap: 0.65rem
  flex-wrap: wrap

.ctl-btn, .month-badge
  border-radius: 999px
  min-height: 2.15rem
  padding: 0 0.85rem
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.88)
  color: #445069

.ctl-btn
  cursor: pointer

.month-badge
  display: inline-grid
  place-items: center

.add-btn
  border: 0
  border-radius: 999px
  background: linear-gradient(135deg, #ff9a76, #e87063)
  color: #fff
  padding: 0.65rem 0.95rem
  cursor: pointer

.calendar-layout
  display: grid
  grid-template-columns: minmax(0, 1.15fr) minmax(21rem, 0.85fr)
  gap: 1rem
  min-height: 0
  background: rgba(255, 255, 255, 0.76)
  border: 1px solid rgba(36, 42, 54, 0.08)
  border-radius: 1rem

.month-panel, .day-panel
  display: grid
  gap: 0.9rem
  min-height: 0
  align-content: start

.month-panel
  grid-template-rows: auto 1fr
  overflow: hidden

.week-head
  display: grid
  grid-template-columns: repeat(7, minmax(0, 1fr))
  gap: 0.45rem

.week-label
  text-align: center
  color: #7a8296
  font-size: 0.76rem

.month-grid
  display: grid
  grid-template-columns: repeat(7, minmax(0, 1fr))
  grid-template-rows: repeat(6, minmax(0, 1fr))
  gap: 0.45rem
  min-height: 0
  overflow: hidden

.day-cell
  border: 1px solid rgba(36, 42, 54, 0.05)
  border-radius: 0.9rem
  background: rgba(255, 255, 255, 0.82)
  min-height: 4.75rem
  height: 100%
  padding: 0.65rem
  cursor: pointer
  display: grid
  align-content: start
  gap: 0.45rem
  overflow: hidden

.day-cell.is-muted
  opacity: 0.48

.day-cell.is-today
  border-color: rgba(183, 155, 213, 0.5)

.day-cell.is-selected
  background: rgba(183, 155, 213, 0.16)

.day-top
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.35rem

.day-num
  font-size: 0.82rem
  color: #3e465c

.day-pill
  border-radius: 999px
  padding: 0.2rem 0.45rem
  background: rgba(183, 155, 213, 0.18)
  color: #584a77
  font-size: 0.68rem

.preview-list
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: 0.22rem

.preview-item
  display: block

.preview-text
  display: block
  font-size: 0.72rem
  color: #556077
  white-space: nowrap
  overflow: hidden
  text-overflow: ellipsis

.preview-more
  margin: 0
  font-size: 0.72rem
  color: #748097

.day-panel-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.75rem

.section-title
  margin: 0
  font-size: 1.1rem

.panel-desc
  margin: 0.25rem 0 0
  color: #6d7487

.error
  margin: 0
  color: #b42318

.day-scroll
  display: grid
  gap: 0.9rem
  min-height: 0
  overflow: auto

.day-list-block
  display: grid
  gap: 0.7rem
  border-radius: 1rem
  padding: 0.9rem
  background: rgba(255, 255, 255, 0.72)
  border: 1px solid rgba(36, 42, 54, 0.06)

.bucket-title
  margin: 0
  font-size: 0.92rem
  color: #48506a

.focus-line
  margin: 0
  font-size: 1.05rem
  color: #252c3f

.empty
  margin: 0
  color: #7f8699

.event-list
  list-style: none
  margin: 0
  padding: 0
  display: grid
  gap: 0.65rem

.event-card
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 0.75rem
  border-radius: 0.9rem
  padding: 0.75rem 0.8rem
  background: rgba(255, 255, 255, 0.82)
  border: 1px solid rgba(36, 42, 54, 0.05)

.event-copy
  min-width: 0
  display: grid
  gap: 0.25rem

.event-title
  margin: 0
  font-size: 0.96rem
  color: #293145

.event-time, .event-notes
  margin: 0
  color: #6b7489
  font-size: 0.82rem

.event-notes
  white-space: pre-wrap

.event-actions
  display: inline-flex
  gap: 0.45rem
  flex-wrap: wrap

.event-btn
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.88)
  color: #42506a
  border-radius: 999px
  padding: 0.4rem 0.7rem
  cursor: pointer

.event-btn.is-danger
  color: #b42318
  border-color: rgba(180, 35, 24, 0.16)

.event-modal
  position: fixed
  inset: 0
  z-index: 60

.event-modal-backdrop
  position: absolute
  inset: 0
  background: rgba(22, 28, 41, 0.32)
  backdrop-filter: blur(4px)

.event-modal-panel
  position: relative
  z-index: 1
  width: min(32rem, calc(100vw - 2rem))
  margin: 8vh auto 0
  border-radius: 1.15rem
  background: rgba(252, 252, 255, 0.98)
  border: 1px solid rgba(36, 42, 54, 0.08)
  box-shadow: 0 28px 60px rgba(36, 42, 54, 0.18)
  overflow: hidden

.modal-head
  display: flex
  justify-content: space-between
  align-items: center
  gap: 1rem
  padding: 1rem 1rem 0.75rem

.modal-title
  margin: 0

.close-btn
  border: 0
  background: transparent
  color: #6c7489
  cursor: pointer

.modal-body
  display: grid
  gap: 0.85rem
  padding: 0 1rem 1rem

.form-grid
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 0.75rem

.form-field
  display: grid
  gap: 0.35rem

.form-label
  font-size: 0.78rem
  color: #6b7489

.form-input, .form-textarea
  width: 100%
  border: 1px solid rgba(36, 42, 54, 0.08)
  border-radius: 0.85rem
  background: rgba(255, 255, 255, 0.92)
  color: #293145
  padding: 0.75rem 0.85rem
  font: inherit

.form-textarea
  min-height: 6.5rem
  resize: vertical

.modal-actions
  display: flex
  justify-content: flex-end
  gap: 0.5rem
  padding: 0 1rem 1rem

@media (max-width: 900px)
  .calendar-layout
    grid-template-columns: 1fr

  .day-panel-head
    flex-direction: column
    align-items: flex-start

@media (max-width: 640px)
  .calendar-header
    align-items: flex-start

  .header-actions
    width: 100%

  .ctl-btn, .month-badge, .add-btn
    flex: 1 1 calc(50% - 0.65rem)
    justify-content: center

  .month-grid
    gap: 0.35rem

  .day-cell
    padding: 0.5rem
    min-height: 4rem

  .form-grid
    grid-template-columns: 1fr

  .event-card
    flex-direction: column
</style>
