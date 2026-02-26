//- projects/modudesk/modules/tasks/composables/useTasks.js
import { computed, reactive, readonly } from 'vue'
import * as tasksRepo from '../services/tasksRepo.js'

const state = reactive({
  items: [],
  loading: false,
  error: '',
  loaded: false
})

let loadPromise = null

function setError(error) {
  state.error = error instanceof Error ? error.message : String(error || '')
}

function setItems(items) {
  state.items = Array.isArray(items) ? [...items] : []
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

async function addTask(payload) {
  state.loading = true
  state.error = ''
  try {
    const items = await tasksRepo.add(payload)
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

export function useTasks() {
  const total = computed(() => state.items.length)
  const done = computed(() => state.items.filter((task) => task.done).length)
  const active = computed(() => total.value - done.value)
  const activeTasks = computed(() => state.items.filter((task) => !task.done))
  const doneTasks = computed(() => state.items.filter((task) => task.done))

  return {
    state: readonly(state),
    items: computed(() => state.items),
    activeTasks,
    doneTasks,
    total,
    done,
    active,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    loaded: computed(() => state.loaded),
    load,
    addTask,
    toggleTask,
    removeTask,
    clearDoneTasks
  }
}

