// src/modules/task/api/taskApi.js
import { http } from '@/api/http'
import { useMock } from '@/api/mockSwitch.js'
import { mockTasks } from './mockTasks.js'

const USE_MOCK_TASK = useMock('VITE_USE_MOCK_TASK')

function clone(data) {
  try {
    return structuredClone(data)
  } catch (err) {
    return JSON.parse(JSON.stringify(data))
  }
}

function delay(ms = 300) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let mockDB = clone(mockTasks)

const mockApi = {
  async list() {
    await delay()
    return clone(mockDB)
  },
  async create(payload) {
    await delay()
    const nextId = mockDB.reduce((max, t) => Math.max(max, t.id), 0) + 1
    const task = {
      id: nextId,
      title: payload.title?.trim() || '新任務',
      desc: payload.desc || '',
      status: payload.status || 'todo',
      priority: payload.priority || 'medium',
      due_date: payload.due_date || '',
      members: payload.members || [],
      messages: payload.messages || []
    }
    mockDB = [task, ...mockDB]
    return clone(task)
  },
  async update(id, payload) {
    await delay()
    mockDB = mockDB.map(t => (t.id === id ? { ...t, ...payload } : t))
    return clone(mockDB.find(t => t.id === id))
  },
  async addMessage(id, message) {
    await delay()
    mockDB = mockDB.map(t => {
      if (t.id !== id) return t
      return { ...t, messages: [...(t.messages || []), message] }
    })
    return clone(mockDB.find(t => t.id === id))
  }
}

const realApi = {
  list() {
    return http.get('/task')
  },
  create(payload) {
    return http.post('/task', payload)
  },
  update(id, payload) {
    return http.put(`/task/${id}`, payload)
  },
  addMessage(id, message) {
    return http.post(`/task/${id}/messages`, message)
  }
}

export const taskApi = USE_MOCK_TASK ? mockApi : realApi

export function resetMockTask() {
  mockDB = clone(mockTasks)
}
