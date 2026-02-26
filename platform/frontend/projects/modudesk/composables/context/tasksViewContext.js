//- projects/modudesk/app/context/tasksViewContext.js
import { computed, reactive, readonly } from 'vue'

const VALID_VIEW_MODES = new Set(['date', 'overdue'])

const state = reactive({
  viewMode: 'date',
})

export function getTasksViewMode() {
  return state.viewMode
}

export function setTasksViewMode(mode) {
  state.viewMode = VALID_VIEW_MODES.has(mode) ? mode : 'date'
  return state.viewMode
}

export function useTasksView() {
  return {
    state: readonly(state),
    viewMode: computed(() => state.viewMode),
    getTasksViewMode,
    setTasksViewMode,
  }
}
