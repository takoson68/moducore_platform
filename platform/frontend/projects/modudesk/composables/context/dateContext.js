//- projects/modudesk/app/context/dateContext.js
import { computed, reactive, readonly } from 'vue'
import { normalizeDueDate, todayStr } from '@project/utils/date.js'

const state = reactive({
  selectedDate: todayStr()
})

function normalizeSelectedDate(input) {
  return normalizeDueDate(input) ?? todayStr()
}

export function getSelectedDate() {
  return state.selectedDate
}

export function setSelectedDate(dateStr) {
  state.selectedDate = normalizeSelectedDate(dateStr)
  return state.selectedDate
}

export function useSelectedDate() {
  return {
    state: readonly(state),
    selectedDate: computed(() => state.selectedDate),
    getSelectedDate,
    setSelectedDate
  }
}
