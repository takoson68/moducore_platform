// src/modules/member/api/memberApi.js
import { createClient } from '@/api/client.js'
import { mockMembers } from './mockMembers.js'

function getApiMode() {
  return (import.meta.env.VITE_API_MODE || 'mock').toLowerCase()
}

function boolEnv(value) {
  if (value === true) return true
  if (typeof value === 'string') return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase())
  return false
}

const client = createClient()
const USE_MOCK_MEMBER = boolEnv(import.meta.env.VITE_USE_MOCK_MEMBER) || getApiMode() === 'mock'

function clone(data) {
  try {
    return structuredClone(data)
  } catch (err) {
    return JSON.parse(JSON.stringify(data))
  }
}

function delay(ms = 200) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

let mockDB = clone(mockMembers)

const mockApi = {
  async list() {
    await delay()
    return clone(mockDB)
  },
  async create(payload) {
    await delay()
    const nextId = mockDB.reduce((max, m) => Math.max(max, m.id), 0) + 1
    const member = {
      id: nextId,
      permission: 'viewer',
      online: false,
      avatar: null,
      ...payload
    }
    mockDB = [...mockDB, member]
    return clone(member)
  },
  async update(id, payload) {
    await delay()
    mockDB = mockDB.map(m => (m.id === id ? { ...m, ...payload } : m))
    return clone(mockDB.find(m => m.id === id))
  },
  async remove(id) {
    await delay()
    mockDB = mockDB.filter(m => m.id !== id)
    return { success: true }
  }
}

const realApi = {
  list() {
    return client.get('/member')
  },
  create(payload) {
    return client.post('/member', payload)
  },
  update(id, payload) {
    return client.put(`/member/${id}`, payload)
  },
  remove(id) {
    return client.delete(`/member/${id}`)
  }
}

export const memberApi = USE_MOCK_MEMBER ? mockApi : realApi

export function resetMockMember() {
  mockDB = clone(mockMembers)
}
