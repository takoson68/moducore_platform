//- projects/modudesk/app/composables/useQuickNote.js
import { computed, reactive, ref, readonly } from 'vue'
import * as quickNoteRepo from '@project/services/quickNoteRepo.js'
import { todayStr } from '@project/modules/tasks/utils/date.js'

const SAVE_DEBOUNCE_MS = 500

const state = reactive({
  date: todayStr(),
  loading: false,
  error: '',
  saveState: 'idle', // idle | saving | saved | error
  loaded: false,
})

const content = ref('')
let saveTimer = null
let savePromise = null

function clearSaveTimer() {
  if (!saveTimer) return
  clearTimeout(saveTimer)
  saveTimer = null
}

function setError(error) {
  state.error = error instanceof Error ? error.message : String(error || '')
  state.saveState = state.error ? 'error' : state.saveState
}

function setSavedRecord(record) {
  state.date = record.date
  content.value = record.content
}

async function saveNow() {
  clearSaveTimer()

  if (savePromise) {
    return savePromise
  }

  state.error = ''
  state.saveState = 'saving'

  const payload = {
    date: state.date || todayStr(),
    content: content.value,
  }

  savePromise = (async () => {
    try {
      const saved = await quickNoteRepo.save(payload)
      state.date = saved.date
      state.saveState = 'saved'
      return saved
    } catch (error) {
      setError(error)
      throw error
    } finally {
      savePromise = null
    }
  })()

  return savePromise
}

function requestSave() {
  clearSaveTimer()
  state.saveState = 'saving'
  state.error = ''

  saveTimer = setTimeout(() => {
    saveNow().catch(() => {})
  }, SAVE_DEBOUNCE_MS)
}

async function load() {
  state.loading = true
  state.error = ''

  try {
    const record = await quickNoteRepo.load(todayStr())
    setSavedRecord(record)
    state.loaded = true
    state.saveState = 'saved'
    return record
  } catch (error) {
    setError(error)
    throw error
  } finally {
    state.loading = false
  }
}

async function reset() {
  clearSaveTimer()
  state.error = ''
  state.saveState = 'saving'

  try {
    const record = await quickNoteRepo.reset(todayStr())
    setSavedRecord(record)
    state.loaded = true
    state.saveState = 'saved'
    return record
  } catch (error) {
    setError(error)
    throw error
  }
}

function setContent(value) {
  const next = typeof value === 'string' ? value : ''
  const today = todayStr()
  if (state.date !== today) {
    state.date = today
  }
  content.value = next
}

export function useQuickNote() {
  return {
    state: readonly(state),
    content,
    loading: computed(() => state.loading),
    error: computed(() => state.error),
    loaded: computed(() => state.loaded),
    saveState: computed(() => state.saveState),
    date: computed(() => state.date),
    setContent,
    load,
    reset,
    requestSave,
    saveNow,
    flushSave: saveNow,
  }
}

