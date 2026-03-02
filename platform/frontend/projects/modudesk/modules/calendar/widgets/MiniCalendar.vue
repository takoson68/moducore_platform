<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useSelectedDate } from '@project/composables/context/dateContext.js'
import { useCalendarEvents } from '@project/composables/useCalendarEvents.js'
import {
  addMonths,
  getMonthGrid,
  monthLabelFromKey,
  parseYearMonthKey,
  todayStr,
  toYearMonthKey,
} from '@project/utils/date.js'

const router = useRouter()
const route = useRoute()
const { selectedDate, setSelectedDate } = useSelectedDate()
const { load, getMonthPreview } = useCalendarEvents()

const monthCursor = ref(new Date(`${selectedDate.value}T00:00:00`))

watch(selectedDate, (next) => {
  const parsed = new Date(`${next}T00:00:00`)
  if (Number.isNaN(parsed.getTime())) return
  if (toYearMonthKey(parsed) !== toYearMonthKey(monthCursor.value)) {
    monthCursor.value = parsed
  }
})

onMounted(() => {
  load().catch(() => {})
})

const monthKey = computed(() => toYearMonthKey(monthCursor.value))
const monthParts = computed(() => parseYearMonthKey(monthKey.value) || { year: 1970, month: 1 })
const monthCells = computed(() => getMonthGrid(monthParts.value.year, monthParts.value.month))
const monthLabel = computed(() => monthLabelFromKey(monthKey.value))
const weekLabels = ['一', '二', '三', '四', '五', '六', '日']
const monthPreview = computed(() => getMonthPreview(monthKey.value))

function goMonth(delta) {
  monthCursor.value = addMonths(monthCursor.value, delta)
}

function goToday() {
  const today = todayStr()
  setSelectedDate(today)
  monthCursor.value = new Date(`${today}T00:00:00`)
}

async function handlePickDate(dateStr) {
  setSelectedDate(dateStr)

  if (route.path === '/' || route.path === '/sticky' || route.path === '/calendar') {
    return
  }

  await router.push('/calendar')
}
</script>

<template lang="pug">
.calendar-card.mini-calendar
  .calendar-head
    .calendar-copy
      p.calendar-title 行事曆
      p.calendar-sub 跨頁日期索引
    span.calendar-month {{ monthLabel }}
  .mini-toolbar
    button.mini-nav(type="button" @click="goMonth(-1)") ‹
    button.mini-today(type="button" @click="goToday") Today
    button.mini-nav(type="button" @click="goMonth(1)") ›
  .calendar-grid
    span.calendar-week(v-for="week in weekLabels" :key="week") {{ week }}
    button.calendar-day(
      v-for="cell in monthCells"
      :key="cell.key"
      type="button"
      :class="{ 'is-muted': !cell.inCurrentMonth, 'is-today': cell.isToday, 'is-selected': cell.dateStr === selectedDate }"
      @click="handlePickDate(cell.dateStr)"
    )
      span.day-number {{ cell.day }}
      span.day-count(v-if="(monthPreview.get(cell.dateStr) || []).length > 0") {{ (monthPreview.get(cell.dateStr) || []).length }}
</template>

<style lang="sass">
.mini-calendar
  display: grid
  gap: 0.75rem

.mini-toolbar
  display: grid
  grid-template-columns: auto 1fr auto
  gap: 0.4rem
  align-items: center

.mini-nav, .mini-today
  border: 1px solid rgba(36, 42, 54, 0.08)
  background: rgba(255, 255, 255, 0.88)
  color: #49526a
  border-radius: 999px
  cursor: pointer
  min-height: 1.9rem
  padding: 0 0.65rem

.mini-nav
  width: 1.9rem
  padding: 0
  display: grid
  place-items: center

.mini-today
  justify-self: center
  font-size: 0.8rem

.mini-calendar .calendar-grid
  display: grid
  grid-template-columns: repeat(7, minmax(0, 1fr))
  gap: 0.28rem

.mini-calendar .calendar-week
  text-align: center
  color: #7b8398
  font-size: 0.72rem

.mini-calendar .calendar-day
  border: 1px solid transparent
  background: rgba(255, 255, 255, 0.76)
  border-radius: 0.7rem
  min-height: 2.15rem
  display: grid
  justify-items: center
  align-content: center
  gap: 0.12rem
  padding: 0.2rem 0
  cursor: pointer
  position: relative

.mini-calendar .calendar-day.is-muted
  opacity: 0.45

.mini-calendar .calendar-day.is-today
  border-color: rgba(183, 155, 213, 0.45)

.mini-calendar .calendar-day.is-selected
  background: rgba(183, 155, 213, 0.18)
  border-color: rgba(183, 155, 213, 0.22)

.day-number
  font-size: 0.76rem
  line-height: 1
  color: #374055

.day-count
  position: absolute
  top: 0.1rem
  right: 0.12rem
  min-width: 0.9rem
  height: 0.9rem
  padding: 0 0.15rem
  border-radius: 999px
  display: grid
  place-items: center
  background: rgba(183, 155, 213, 0.18)
  color: #5e4f7f
  font-size: 0.58rem
  line-height: 1
</style>
