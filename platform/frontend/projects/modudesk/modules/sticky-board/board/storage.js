//- projects/modudesk/modules/sticky-board/board/storage.js
import world from '@/world.js'
import {
  BOARD_SCHEMA_VERSION,
  BOARD_STORAGE_KEY,
  createEmptyBoardState,
  normalizeBoardState,
} from './boardEngine.js'

function createLocalStorageFallback() {
  return {
    async get(key) {
      if (typeof localStorage === 'undefined') {
        return null
      }

      const raw = localStorage.getItem(key)
      if (!raw) {
        return null
      }

      try {
        return JSON.parse(raw)
      } catch {
        return null
      }
    },
    async set(key, value) {
      if (typeof localStorage === 'undefined') {
        return
      }

      localStorage.setItem(key, JSON.stringify(value))
    },
  }
}

function getStorage() {
  try {
    return world.services.storage()
  } catch {
    return createLocalStorageFallback()
  }
}

function createEnvelope(state) {
  const normalized = normalizeBoardState(state)
  return {
    version: BOARD_SCHEMA_VERSION,
    zoom: normalized.zoom,
    maxZ: normalized.maxZ,
    cards: normalized.cards,
  }
}

export async function loadBoardState() {
  const storage = getStorage()
  const raw = await storage.get(BOARD_STORAGE_KEY)

  if (!raw) {
    return createEmptyBoardState()
  }

  return normalizeBoardState(raw)
}

export async function saveBoardState(state) {
  const storage = getStorage()
  const envelope = createEnvelope(state)
  await storage.set(BOARD_STORAGE_KEY, envelope)
  return envelope
}
