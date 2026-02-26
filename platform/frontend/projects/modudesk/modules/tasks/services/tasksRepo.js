//- projects/modudesk/modules/tasks/services/tasksRepo.js
import world from '@/world.js'
import { normalizeDueDate, todayStr } from '../utils/date.js'

const TASKS_KEY = 'modudesk:tasks'
const TASKS_SCHEMA_VERSION = 1
const PRIORITY_ORDER = new Set(['high', 'normal', 'low'])

function getStorage() {
  return world.services.storage()
}

function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const random = Math.random().toString(36).slice(2, 10)
  return `task-${Date.now()}-${random}`
}

function nowTs() {
  return Date.now()
}

function normalizePriority(value) {
  return PRIORITY_ORDER.has(value) ? value : 'normal'
}

function normalizeTimestamp(value, fallback) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value
  }
  if (typeof value === 'string') {
    const parsed = Date.parse(value)
    if (Number.isFinite(parsed)) return parsed
  }
  return fallback
}

function normalizeTask(raw, { defaultDueDate = todayStr(), fallbackTs = nowTs() } = {}) {
  if (!raw || typeof raw !== 'object') return null

  const id = typeof raw.id === 'string' ? raw.id : ''
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!id || !title) return null

  const createdAt = normalizeTimestamp(raw.createdAt, fallbackTs)
  const updatedAt = normalizeTimestamp(raw.updatedAt, createdAt)
  const done = Boolean(raw.done)
  const dueDate = Object.prototype.hasOwnProperty.call(raw, 'dueDate')
    ? normalizeDueDate(raw.dueDate)
    : defaultDueDate
  const doneAtRaw = Object.prototype.hasOwnProperty.call(raw, 'doneAt') ? raw.doneAt : null
  const doneAt = done ? (normalizeDueDate(doneAtRaw) ?? todayStr()) : null

  return {
    id,
    title,
    done,
    dueDate,
    priority: normalizePriority(raw.priority),
    createdAt,
    updatedAt,
    doneAt
  }
}

function cloneTask(task) {
  return {
    id: task.id,
    title: task.title,
    done: task.done,
    dueDate: task.dueDate,
    priority: task.priority,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    doneAt: task.doneAt
  }
}

function toEnvelope(items) {
  return {
    version: TASKS_SCHEMA_VERSION,
    items: items.map(cloneTask)
  }
}

function migrateRawTasks(raw) {
  const defaultDueDate = todayStr()
  let sourceItems = []
  let needsWriteBack = false

  if (raw == null) {
    sourceItems = []
    needsWriteBack = true
  } else if (Array.isArray(raw)) {
    sourceItems = raw
    needsWriteBack = true
  } else if (typeof raw === 'object' && raw.version === TASKS_SCHEMA_VERSION && Array.isArray(raw.items)) {
    sourceItems = raw.items
  } else if (typeof raw === 'object' && Array.isArray(raw.items)) {
    sourceItems = raw.items
    needsWriteBack = true
  } else {
    sourceItems = []
    needsWriteBack = true
  }

  const migratedItems = sourceItems
    .map((entry, index) => {
      if (typeof entry === 'string') {
        const title = entry.trim()
        if (!title) return null
        const ts = nowTs() - index
        return {
          id: createTaskId(),
          title,
          done: false,
          dueDate: defaultDueDate,
          priority: 'normal',
          createdAt: ts,
          updatedAt: ts,
          doneAt: null
        }
      }

      return normalizeTask(entry, { defaultDueDate })
    })
    .filter(Boolean)
    .map(cloneTask)

  const normalizedEnvelope = toEnvelope(migratedItems)
  const rawJson = safeJson(raw)
  const normalizedJson = safeJson(normalizedEnvelope)
  if (rawJson !== normalizedJson) {
    needsWriteBack = true
  }

  return { items: migratedItems, needsWriteBack }
}

function safeJson(value) {
  try {
    return JSON.stringify(value)
  } catch {
    return null
  }
}

async function readEnvelope() {
  try {
    const value = await getStorage().get(TASKS_KEY)
    const { items, needsWriteBack } = migrateRawTasks(value)
    if (needsWriteBack) {
      await writeEnvelope(items)
    }
    return { version: TASKS_SCHEMA_VERSION, items }
  } catch (error) {
    throw new Error('讀取 Tasks 失敗', { cause: error })
  }
}

async function writeEnvelope(nextTasks) {
  try {
    await getStorage().set(TASKS_KEY, toEnvelope(nextTasks))
  } catch (error) {
    throw new Error('寫入 Tasks 失敗', { cause: error })
  }
}

export async function list() {
  const { items } = await readEnvelope()
  return items.map(cloneTask)
}

export async function add({ title, dueDate, priority = 'normal' } = {}) {
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''
  if (!normalizedTitle) {
    throw new Error('Task 標題不可為空')
  }

  const { items: current } = await readEnvelope()
  const timestamp = nowTs()
  const normalizedDueDate = normalizeDueDate(dueDate) ?? todayStr()
  const nextTask = {
    id: createTaskId(),
    title: normalizedTitle,
    done: false,
    dueDate: normalizedDueDate,
    priority: normalizePriority(priority),
    createdAt: timestamp,
    updatedAt: timestamp,
    doneAt: null
  }
  const nextList = [nextTask, ...current]
  await writeEnvelope(nextList)
  return nextList.map(cloneTask)
}

export async function toggle({ id }) {
  if (typeof id !== 'string' || !id) {
    throw new Error('缺少 Task id')
  }

  const { items: current } = await readEnvelope()
  let found = false
  const doneDate = todayStr()
  const updatedTs = nowTs()
  const nextList = current.map((task) => {
    if (task.id !== id) return cloneTask(task)
    found = true
    const nextDone = !task.done
    return {
      ...cloneTask(task),
      done: nextDone,
      doneAt: nextDone ? doneDate : null,
      updatedAt: updatedTs
    }
  })

  if (!found) {
    throw new Error('找不到指定 Task')
  }

  await writeEnvelope(nextList)
  return nextList.map(cloneTask)
}

export async function remove({ id }) {
  if (typeof id !== 'string' || !id) {
    throw new Error('缺少 Task id')
  }

  const { items: current } = await readEnvelope()
  const nextList = current.filter((task) => task.id !== id).map(cloneTask)
  await writeEnvelope(nextList)
  return nextList.map(cloneTask)
}

export async function clearDone() {
  const { items: current } = await readEnvelope()
  const nextList = current.filter((task) => !task.done).map(cloneTask)
  await writeEnvelope(nextList)
  return nextList.map(cloneTask)
}

export async function updateTask({ id, patch } = {}) {
  if (typeof id !== 'string' || !id) {
    throw new Error('缺少 Task id')
  }
  if (!patch || typeof patch !== 'object') {
    throw new Error('缺少 Task patch')
  }

  const { items: current } = await readEnvelope()
  let found = false
  const updatedTs = nowTs()

  const nextList = current.map((task) => {
    if (task.id !== id) return cloneTask(task)
    found = true

    const nextTask = cloneTask(task)
    if (Object.prototype.hasOwnProperty.call(patch, 'priority')) {
      nextTask.priority = normalizePriority(patch.priority)
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'dueDate')) {
      nextTask.dueDate = normalizeDueDate(patch.dueDate)
    }
    nextTask.updatedAt = updatedTs
    return nextTask
  })

  if (!found) {
    throw new Error('找不到指定 Task')
  }

  await writeEnvelope(nextList)
  return nextList.map(cloneTask)
}
