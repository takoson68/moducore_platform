//- projects/modudesk/app/repos/quickNoteRepo.js
import world from '@/world.js'

const STORAGE_KEY = 'modudesk:quickNote'

function getStorage() {
  return world.services.storage()
}

function normalizeRecord(raw) {
  if (!raw || typeof raw !== 'object') return null

  const date = typeof raw.date === 'string' ? raw.date : ''
  const content = typeof raw.content === 'string' ? raw.content : ''
  if (!date) return null

  return { date, content }
}

export async function save({ date, content }) {
  const payload = {
    date: typeof date === 'string' ? date : '',
    content: typeof content === 'string' ? content : '',
  }

  if (!payload.date) {
    throw new Error('Quick Note 缺少日期')
  }

  await getStorage().set(STORAGE_KEY, payload)
  return payload
}

export async function reset(today) {
  const payload = { date: today, content: '' }
  await save(payload)
  return payload
}

export async function load(today) {
  const raw = await getStorage().get(STORAGE_KEY)
  const record = normalizeRecord(raw)

  if (!record) {
    return reset(today)
  }

  if (record.date !== today) {
    return reset(today)
  }

  return record
}
