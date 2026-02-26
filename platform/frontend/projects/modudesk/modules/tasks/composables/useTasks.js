//- projects/modudesk/modules/tasks/composables/useTasks.js
import { computed, reactive, readonly } from 'vue'
import * as tasksRepo from '../services/tasksRepo.js'
import { formatDateKey, isBefore, normalizeDueDate, todayStr } from '../utils/date.js'

const PRIORITY_WEIGHT = {
  high: 0,
  normal: 1,
  low: 2,
}

const state = reactive({
  items: [],
  loading: false,
  error: '',
  loaded: false,
})

let loadPromise = null

function setError(error) {
  state.error = error instanceof Error ? error.message : String(error || '')
}

function setItems(items) {
  state.items = Array.isArray(items) ? [...items] : []
}

function compareTasks(a, b) {
  if (a.done !== b.done) {
    return a.done ? 1 : -1
  }

  const priorityDiff = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9)
  if (priorityDiff !== 0) return priorityDiff

  return b.createdAt - a.createdAt
}

function comparePreviewTasks(a, b) {
  const priorityDiff = (PRIORITY_WEIGHT[a.priority] ?? 9) - (PRIORITY_WEIGHT[b.priority] ?? 9)
  if (priorityDiff !== 0) return priorityDiff
  return b.createdAt - a.createdAt
}

function getSortedItems() {
  return [...state.items].sort(compareTasks)
}

function isTaskOverdue(task) {
  const dueDate = normalizeDueDate(task?.dueDate)
  if (!dueDate || task?.done) return false
  return isBefore(dueDate, todayStr())
}

function getTasksByDate(dateStr) {
  const normalized = normalizeDueDate(dateStr)
  if (!normalized) return []
  return getSortedItems().filter((task) => task.dueDate === normalized)
}

function getOverdueTasks() {
  const today = todayStr()
  return getSortedItems().filter((task) => {
    if (task.done) return false
    if (!task.dueDate) return false
    return isBefore(task.dueDate, today)
  })
}

function getMonthPreview(yyyyMm) {
  const key = typeof yyyyMm === 'string' ? yyyyMm : ''
  const bucket = new Map()

  state.items
    .filter((task) => typeof task?.dueDate === 'string' && task.dueDate.startsWith(`${key}-`))
    .sort(comparePreviewTasks)
    .forEach((task) => {
      const list = bucket.get(task.dueDate) || []
      list.push(task)
      bucket.set(task.dueDate, list)
    })

  return bucket
}

function getDayStatus(dateStr) {
  const normalized = normalizeDueDate(dateStr)
  if (!normalized) {
    return { hasOverdue: false, hasTodo: false, hasDone: false }
  }

  const today = todayStr()
  let hasOverdue = false
  let hasTodo = false
  let hasDone = false

  for (const task of state.items) {
    if (!hasDone && task.doneAt === normalized) {
      hasDone = true
    }
    if (task.dueDate !== normalized) {
      continue
    }
    if (!task.done) {
      hasTodo = true
      if (isBefore(normalized, today)) {
        hasOverdue = true
      }
    }
  }

  return { hasOverdue, hasTodo, hasDone }
}

function splitTasksByDone(items = []) {
  const source = Array.isArray(items) ? items : []
  return {
    active: source.filter((task) => !task.done),
    done: source.filter((task) => task.done),
  }
}

function getTodaySummary() {
  const today = todayStr()
  let createdToday = 0
  let doneToday = 0
  let overdue = 0
  let dueTodayActive = 0
  let activeTotal = 0

  for (const task of state.items) {
    const createdKey = typeof task.createdAt === 'number'
      ? formatDateKey(new Date(task.createdAt))
      : null

    if (createdKey === today) {
      createdToday += 1
    }

    if (task.doneAt === today) {
      doneToday += 1
    }

    if (!task.done) {
      activeTotal += 1

      if (task.dueDate === today) {
        dueTodayActive += 1
      }

      if (task.dueDate && isBefore(task.dueDate, today)) {
        overdue += 1
      }
    }
  }

  return {
    today,
    createdToday,
    doneToday,
    overdue,
    dueTodayActive,
    activeTotal,
  }
}

async function load() {
  if (loadPromise) return loadPromise

  state.loading = true
  state.error = ''
  loadPromise = (async () => {
    try {
      const items = await tasksRepo.list()
      setItems(items)
      state.loaded = true
      return state.items
    } catch (error) {
      setError(error)
      throw error
    } finally {
      state.loading = false
      loadPromise = null
    }
  })()

  return loadPromise
}

async function addTask(payload = {}) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.add({
      ...payload,
      dueDate: Object.prototype.hasOwnProperty.call(payload, 'dueDate')
        ? payload.dueDate
        : todayStr(),
    })
    setItems(items)
    state.loaded = true
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function toggleTask(id) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.toggle({ id })
    setItems(items)
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function removeTask(id) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.remove({ id })
    setItems(items)
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function clearDoneTasks() {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.clearDone()
    setItems(items)
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function updateTaskPriority(id, priority) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.updateTask({ id, patch: { priority } })
    setItems(items)
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function updateTaskDueDate(id, dueDate) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.updateTask({ id, patch: { dueDate } })
    setItems(items)
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

export function useTasks() {
  const sortedItems = computed(() => getSortedItems())
  const total = computed(() => state.items.length)
  const done = computed(() => state.items.filter((task) => task.done).length)
  const active = computed(() => total.value - done.value)
  const activeTasks = computed(() => sortedItems.value.filter((task) => !task.done))
  const doneTasks = computed(() => sortedItems.value.filter((task) => task.done))

  return {
    state: readonly(state),
    items: sortedItems,
    activeTasks,
    doneTasks,
    total,
    done,
    active,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    loaded: computed(() => state.loaded),
    isOverdue: isTaskOverdue,
    getTasksByDate,
    getOverdueTasks,
    getMonthPreview,
    getDayStatus,
    getTodaySummary,
    splitTasksByDone,
    load,
    addTask,
    toggleTask,
    removeTask,
    clearDoneTasks,
    updateTaskPriority,
    updateTaskDueDate,
  }
}
