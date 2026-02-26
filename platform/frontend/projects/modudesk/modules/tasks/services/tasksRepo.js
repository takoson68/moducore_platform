//- projects/modudesk/modules/tasks/services/tasksRepo.js
import world from '@/world.js'

const TASKS_KEY = 'modudesk:tasks'

function getStorage() {
  return world.services.storage()
}

function nowIso() {
  return new Date().toISOString()
}

function createTaskId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  const random = Math.random().toString(36).slice(2, 10)
  return `task-${Date.now()}-${random}`
}

function normalizeTask(raw) {
  if (!raw || typeof raw !== 'object') return null

  const id = typeof raw.id === 'string' ? raw.id : ''
  const title = typeof raw.title === 'string' ? raw.title.trim() : ''
  if (!id || !title) return null

  const createdAt = typeof raw.createdAt === 'string' ? raw.createdAt : nowIso()
  const updatedAt = typeof raw.updatedAt === 'string' ? raw.updatedAt : createdAt

  return {
    id,
    title,
    done: Boolean(raw.done),
    createdAt,
    updatedAt
  }
}

function cloneTask(task) {
  return {
    id: task.id,
    title: task.title,
    done: task.done,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }
}

function normalizeTaskList(raw) {
  if (!Array.isArray(raw)) return []
  return raw.map(normalizeTask).filter(Boolean).map(cloneTask)
}

async function readTasks() {
  try {
    const value = await getStorage().get(TASKS_KEY)
    return normalizeTaskList(value)
  } catch (error) {
    throw new Error('讀取 Tasks 失敗', { cause: error })
  }
}

async function writeTasks(nextTasks) {
  try {
    await getStorage().set(TASKS_KEY, nextTasks.map(cloneTask))
  } catch (error) {
    throw new Error('寫入 Tasks 失敗', { cause: error })
  }
}

export async function list() {
  const tasks = await readTasks()
  return tasks.map(cloneTask)
}

export async function add({ title }) {
  const normalizedTitle = typeof title === 'string' ? title.trim() : ''
  if (!normalizedTitle) {
    throw new Error('Task 標題不可為空')
  }

  const current = await readTasks()
  const timestamp = nowIso()
  const nextTask = {
    id: createTaskId(),
    title: normalizedTitle,
    done: false,
    createdAt: timestamp,
    updatedAt: timestamp
  }
  const nextList = [nextTask, ...current]
  await writeTasks(nextList)
  return nextList.map(cloneTask)
}

export async function toggle({ id }) {
  if (typeof id !== 'string' || !id) {
    throw new Error('缺少 Task id')
  }

  const current = await readTasks()
  let found = false
  const nextList = current.map((task) => {
    if (task.id !== id) return cloneTask(task)
    found = true
    return {
      ...cloneTask(task),
      done: !task.done,
      updatedAt: nowIso()
    }
  })

  if (!found) {
    throw new Error('找不到指定 Task')
  }

  await writeTasks(nextList)
  return nextList.map(cloneTask)
}

export async function remove({ id }) {
  if (typeof id !== 'string' || !id) {
    throw new Error('缺少 Task id')
  }

  const current = await readTasks()
  const nextList = current.filter((task) => task.id !== id).map(cloneTask)
  await writeTasks(nextList)
  return nextList.map(cloneTask)
}

export async function clearDone() {
  const current = await readTasks()
  const nextList = current.filter((task) => !task.done).map(cloneTask)
  await writeTasks(nextList)
  return nextList.map(cloneTask)
}

