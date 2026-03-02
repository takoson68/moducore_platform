//- projects/modudesk/services/calendarEventsStore.js
import world from '@/world.js'

const STORAGE_KEY = 'modudesk:calendar:events:v1'
const SCHEMA_VERSION = 1
const SAVE_DEBOUNCE_MS = 200

let cache = createEmptyEnvelope()
let hydrated = false
let hydratePromise = null
let persistTimer = null
let pendingPersistPromise = null

function createEmptyEnvelope() {
  return {
    version: SCHEMA_VERSION,
    events: [],
  }
}

function getStorage() {
  return world.services.storage()
}

function nowIso() {
  return new Date().toISOString()
}

function createEventId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `calendar-event-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function cloneEvent(event) {
  return {
    id: event.id,
    title: event.title,
    startAt: event.startAt,
    endAt: event.endAt,
    notes: event.notes,
    createdAt: event.createdAt,
    updatedAt: event.updatedAt,
  }
}

function normalizeIsoString(value, fallback = null) {
  if (typeof value !== 'string') return fallback
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return fallback
  }

  return date.toISOString()
}

function normalizeEvent(raw, { fallbackId, fallbackCreatedAt } = {}) {
  if (!raw || typeof raw !== 'object') return null

  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!title) return null

  const startAt = normalizeIsoString(raw.startAt)
  const endAt = normalizeIsoString(raw.endAt, startAt)
  if (!startAt || !endAt) return null

  const startTime = new Date(startAt).getTime()
  const endTime = new Date(endAt).getTime()
  if (endTime < startTime) return null

  const createdAt = normalizeIsoString(raw.createdAt, fallbackCreatedAt || nowIso())
  const updatedAt = normalizeIsoString(raw.updatedAt, createdAt)

  return {
    id: typeof raw.id === 'string' && raw.id ? raw.id : (fallbackId || createEventId()),
    title,
    startAt,
    endAt,
    notes: typeof raw.notes === 'string' ? raw.notes : '',
    createdAt,
    updatedAt,
  }
}

function normalizeEnvelope(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyEnvelope()
  }

  const events = Array.isArray(raw.events)
    ? raw.events
        .map((event, index) => normalizeEvent(event, {
          fallbackId: `calendar-event-migrated-${index}`,
          fallbackCreatedAt: nowIso(),
        }))
        .filter(Boolean)
        .sort((left, right) => new Date(left.startAt).getTime() - new Date(right.startAt).getTime())
    : []

  return {
    version: SCHEMA_VERSION,
    events,
  }
}

function clearPersistTimer() {
  if (!persistTimer) return
  clearTimeout(persistTimer)
  persistTimer = null
}

async function writeCache() {
  const payload = {
    version: SCHEMA_VERSION,
    events: cache.events.map(cloneEvent),
  }

  await getStorage().set(STORAGE_KEY, payload)
  return payload
}

function schedulePersist() {
  clearPersistTimer()
  pendingPersistPromise = new Promise((resolve, reject) => {
    persistTimer = setTimeout(async () => {
      persistTimer = null
      try {
        const saved = await writeCache()
        resolve(saved)
      } catch (error) {
        reject(error)
      } finally {
        pendingPersistPromise = null
      }
    }, SAVE_DEBOUNCE_MS)
  })

  return pendingPersistPromise
}

async function ensureHydrated() {
  if (hydrated) {
    return cache
  }

  if (hydratePromise) {
    return hydratePromise
  }

  hydratePromise = (async () => {
    const raw = await getStorage().get(STORAGE_KEY)
    cache = normalizeEnvelope(raw)
    hydrated = true
    hydratePromise = null
    return cache
  })()

  return hydratePromise
}

function sortEvents(events) {
  return [...events].sort((left, right) => {
    const startDiff = new Date(left.startAt).getTime() - new Date(right.startAt).getTime()
    if (startDiff !== 0) return startDiff
    return new Date(left.updatedAt).getTime() - new Date(right.updatedAt).getTime()
  })
}

function overlapsRange(event, startAt, endAt) {
  const start = new Date(event.startAt).getTime()
  const end = new Date(event.endAt).getTime()
  return start <= endAt.getTime() && end >= startAt.getTime()
}

export async function load() {
  const envelope = await ensureHydrated()
  return {
    version: envelope.version,
    events: envelope.events.map(cloneEvent),
  }
}

export async function listAll() {
  const envelope = await ensureHydrated()
  return envelope.events.map(cloneEvent)
}

export async function listByRange({ startAt, endAt } = {}) {
  const envelope = await ensureHydrated()
  const start = startAt instanceof Date ? startAt : new Date(startAt)
  const end = endAt instanceof Date ? endAt : new Date(endAt)

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    throw new Error('事件查詢區間無效')
  }

  return envelope.events
    .filter((event) => overlapsRange(event, start, end))
    .map(cloneEvent)
}

export async function create(payload = {}) {
  await ensureHydrated()

  const timestamp = nowIso()
  const nextEvent = normalizeEvent({
    ...payload,
    id: createEventId(),
    createdAt: timestamp,
    updatedAt: timestamp,
  })

  if (!nextEvent) {
    throw new Error('事件資料不完整')
  }

  cache = {
    ...cache,
    events: sortEvents([...cache.events, nextEvent]),
  }

  schedulePersist()
  return cloneEvent(nextEvent)
}

export async function update(id, patch = {}) {
  await ensureHydrated()

  if (typeof id !== 'string' || !id) {
    throw new Error('缺少事件 id')
  }

  let found = false
  const nextEvents = cache.events.map((event) => {
    if (event.id !== id) {
      return event
    }

    found = true
    const normalized = normalizeEvent({
      ...event,
      ...patch,
      id: event.id,
      createdAt: event.createdAt,
      updatedAt: nowIso(),
    })

    if (!normalized) {
      throw new Error('事件資料不完整')
    }

    return normalized
  })

  if (!found) {
    throw new Error('找不到指定事件')
  }

  cache = {
    ...cache,
    events: sortEvents(nextEvents),
  }

  schedulePersist()
  return cache.events.find((event) => event.id === id)
}

export async function remove(id) {
  await ensureHydrated()

  if (typeof id !== 'string' || !id) {
    throw new Error('缺少事件 id')
  }

  const nextEvents = cache.events.filter((event) => event.id !== id)
  if (nextEvents.length === cache.events.length) {
    throw new Error('找不到指定事件')
  }

  cache = {
    ...cache,
    events: nextEvents,
  }

  schedulePersist()
  return true
}

export async function flushPendingSave() {
  if (pendingPersistPromise) {
    return pendingPersistPromise
  }

  if (!hydrated) {
    return createEmptyEnvelope()
  }

  return writeCache()
}

export function getSchema() {
  return {
    key: STORAGE_KEY,
    version: SCHEMA_VERSION,
    fields: ['id', 'title', 'startAt', 'endAt', 'notes', 'createdAt', 'updatedAt'],
  }
}
