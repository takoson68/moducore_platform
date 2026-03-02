//- projects/modudesk/composables/useCalendarEvents.js
import { computed, reactive, readonly } from 'vue'
import * as calendarEventsStore from '@project/services/calendarEventsStore.js'
import { formatDateKey } from '@project/utils/date.js'

const state = reactive({
  items: [],
  loading: false,
  loaded: false,
  error: '',
})

let loadPromise = null

function sortEvents(events) {
  return [...events].sort((left, right) => {
    const startDiff = new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
    if (startDiff !== 0) return startDiff
    return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
  })
}

function setItems(items) {
  state.items = sortEvents(items)
}

async function load() {
  if (loadPromise) {
    return loadPromise
  }

  state.loading = true
  state.error = ''
  loadPromise = (async () => {
    try {
      const items = await calendarEventsStore.listAll()
      setItems(items)
      state.loaded = true
      return state.items
    } catch (error) {
      state.error = error instanceof Error ? error.message : 'Calendar 事件載入失敗'
      throw error
    } finally {
      state.loading = false
      loadPromise = null
    }
  })()

  return loadPromise
}

async function createEvent(payload) {
  state.error = ''
  try {
    const next = await calendarEventsStore.create(payload)
    setItems([...state.items, next])
    return next
  } catch (error) {
    state.error = error instanceof Error ? error.message : '新增事件失敗'
    throw error
  }
}

async function updateEvent(id, patch) {
  state.error = ''
  try {
    const updated = await calendarEventsStore.update(id, patch)
    setItems(state.items.map((event) => (event.id === id ? updated : event)))
    return updated
  } catch (error) {
    state.error = error instanceof Error ? error.message : '更新事件失敗'
    throw error
  }
}

async function removeEvent(id) {
  state.error = ''
  try {
    await calendarEventsStore.remove(id)
    setItems(state.items.filter((event) => event.id !== id))
  } catch (error) {
    state.error = error instanceof Error ? error.message : '刪除事件失敗'
    throw error
  }
}

function listByRange({ startAt, endAt }) {
  const start = startAt instanceof Date ? startAt : new Date(startAt)
  const end = endAt instanceof Date ? endAt : new Date(endAt)

  return state.items.filter((event) => {
    const eventStart = new Date(event.startAt).getTime()
    const eventEnd = new Date(event.endAt).getTime()
    return eventStart <= end.getTime() && eventEnd >= start.getTime()
  })
}

function getEventsByDate(dateStr) {
  return state.items.filter((event) => {
    const dayKey = formatDateKey(new Date(event.startAt))
    return dayKey === dateStr
  })
}

function getMonthPreview(yearMonthKey) {
  const bucket = new Map()

  state.items.forEach((event) => {
    const dayKey = formatDateKey(new Date(event.startAt))
    if (!dayKey.startsWith(`${yearMonthKey}-`)) {
      return
    }

    const list = bucket.get(dayKey) || []
    list.push(event)
    bucket.set(dayKey, sortEvents(list))
  })

  return bucket
}

export function useCalendarEvents() {
  return {
    state: readonly(state),
    items: computed(() => state.items),
    loading: computed(() => state.loading),
    loaded: computed(() => state.loaded),
    error: computed(() => state.error),
    load,
    createEvent,
    updateEvent,
    removeEvent,
    listByRange,
    getEventsByDate,
    getMonthPreview,
    flushPendingSave: calendarEventsStore.flushPendingSave,
    getSchema: calendarEventsStore.getSchema,
  }
}
