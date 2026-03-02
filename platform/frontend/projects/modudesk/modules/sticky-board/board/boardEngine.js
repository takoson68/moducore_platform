//- projects/modudesk/modules/sticky-board/board/boardEngine.js

export const BOARD_SCHEMA_VERSION = 1
export const BOARD_STORAGE_KEY = 'modudesk:sticky-board:v1'
export const BOARD_SIZE = 3600
export const BOARD_HALF_SIZE = BOARD_SIZE / 2
export const DEFAULT_CARD_WIDTH = 220
export const DEFAULT_CARD_HEIGHT = 160
export const DRAG_DISTANCE_THRESHOLD = 4
const ROTATION_STEP = 15
const RESIZE_STEP = 0.15
const MIN_CARD_WIDTH = 160
const MIN_CARD_HEIGHT = 116
const MAX_CARD_WIDTH = 520
const MAX_CARD_HEIGHT = 378
const POSITION_LIMIT = BOARD_HALF_SIZE - 220
export const CARD_COLOR_OPTIONS = ['sun', 'peach', 'rose', 'mint', 'sky', 'lavender', 'slate']
const DEFAULT_CARD_COLOR = CARD_COLOR_OPTIONS[0]
const DEFAULT_BOARD_ZOOM = 1

function createCardId() {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }

  return `sticky-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

function nowTs() {
  return Date.now()
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value))
}

function normalizeNumber(value, fallback = 0) {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback
}

function normalizeCardSize(value, fallback) {
  const normalized = normalizeNumber(value, fallback)
  return normalized > 0 ? normalized : fallback
}

function normalizeRotation(value) {
  const normalized = normalizeNumber(value, 0)
  const result = normalized % 360
  return result < 0 ? result + 360 : result
}

function normalizeCardColor(value) {
  return CARD_COLOR_OPTIONS.includes(value) ? value : DEFAULT_CARD_COLOR
}

function normalizeBoardZoom(value) {
  const normalized = normalizeNumber(value, DEFAULT_BOARD_ZOOM)
  return normalized > 0 ? normalized : DEFAULT_BOARD_ZOOM
}

function cloneCard(card) {
  return {
    id: card.id,
    x: card.x,
    y: card.y,
    rotation: card.rotation,
    z: card.z,
    content: card.content,
    color: card.color,
    width: card.width,
    height: card.height,
    createdAt: card.createdAt,
    updatedAt: card.updatedAt,
  }
}

function normalizeCard(raw, index = 0) {
  if (!raw || typeof raw !== 'object') return null

  const id = typeof raw.id === 'string' && raw.id ? raw.id : createCardId()
  const createdAt = normalizeNumber(raw.createdAt, nowTs() - index)
  const updatedAt = normalizeNumber(raw.updatedAt, createdAt)

  return {
    id,
    x: clamp(normalizeNumber(raw.x, 0), -POSITION_LIMIT, POSITION_LIMIT),
    y: clamp(normalizeNumber(raw.y, 0), -POSITION_LIMIT, POSITION_LIMIT),
    rotation: normalizeRotation(raw.rotation),
    z: Math.max(0, normalizeNumber(raw.z, index + 1)),
    content: typeof raw.content === 'string' ? raw.content : '',
    color: normalizeCardColor(raw.color),
    width: normalizeCardSize(raw.width, DEFAULT_CARD_WIDTH),
    height: normalizeCardSize(raw.height, DEFAULT_CARD_HEIGHT),
    createdAt,
    updatedAt,
  }
}

export function createEmptyBoardState() {
  return {
    version: BOARD_SCHEMA_VERSION,
    zoom: DEFAULT_BOARD_ZOOM,
    maxZ: 0,
    cards: [],
  }
}

export function normalizeBoardState(raw) {
  if (!raw || typeof raw !== 'object') {
    return createEmptyBoardState()
  }

  const cards = Array.isArray(raw.cards)
    ? raw.cards.map((card, index) => normalizeCard(card, index)).filter(Boolean)
    : []

  const maxZ = cards.reduce((current, card) => Math.max(current, card.z), 0)

  return {
    version: BOARD_SCHEMA_VERSION,
    zoom: normalizeBoardZoom(raw.zoom),
    maxZ: Math.max(normalizeNumber(raw.maxZ, maxZ), maxZ),
    cards,
  }
}

function mapCards(state, cardId, mapper) {
  let found = false
  const cards = state.cards.map((card) => {
    if (card.id !== cardId) {
      return cloneCard(card)
    }

    found = true
    return mapper(card)
  })

  return {
    found,
    cards,
  }
}

export function createCard(state, seed = {}) {
  const baseState = normalizeBoardState(state)
  const timestamp = nowTs()
  const stackOffset = (baseState.cards.length % 5) * 12
  const x = clamp(normalizeNumber(seed.x, stackOffset), -POSITION_LIMIT, POSITION_LIMIT)
  const y = clamp(normalizeNumber(seed.y, stackOffset), -POSITION_LIMIT, POSITION_LIMIT)
  const maxZ = baseState.maxZ + 1

  const card = {
    id: createCardId(),
    x,
    y,
    rotation: normalizeRotation(seed.rotation),
    z: maxZ,
    content: typeof seed.content === 'string' ? seed.content : '',
    color: normalizeCardColor(seed.color),
    width: normalizeCardSize(seed.width, DEFAULT_CARD_WIDTH),
    height: normalizeCardSize(seed.height, DEFAULT_CARD_HEIGHT),
    createdAt: timestamp,
    updatedAt: timestamp,
  }

  console.log('[StickyBoard] new card', card)

  return {
    state: {
      ...baseState,
      maxZ,
      cards: [...baseState.cards.map(cloneCard), card],
    },
    card,
  }
}

export function raiseCard(state, cardId) {
  const baseState = normalizeBoardState(state)
  const nextMaxZ = baseState.maxZ + 1
  const { found, cards } = mapCards(baseState, cardId, (card) => ({
    ...cloneCard(card),
    z: nextMaxZ,
    updatedAt: nowTs(),
  }))

  if (!found) return baseState

  return {
    ...baseState,
    maxZ: nextMaxZ,
    cards,
  }
}

export function rotateCard(state, cardId, delta = ROTATION_STEP) {
  const baseState = normalizeBoardState(state)
  const { found, cards } = mapCards(baseState, cardId, (card) => ({
    ...cloneCard(card),
    rotation: normalizeRotation(card.rotation + delta),
    updatedAt: nowTs(),
  }))

  if (!found) return baseState

  return {
    ...baseState,
    cards,
  }
}

export function updateCardContent(state, cardId, content) {
  const baseState = normalizeBoardState(state)
  const { found, cards } = mapCards(baseState, cardId, (card) => ({
    ...cloneCard(card),
    content: typeof content === 'string' ? content : '',
    updatedAt: nowTs(),
  }))

  if (!found) return baseState

  return {
    ...baseState,
    cards,
  }
}

export function removeCard(state, cardId) {
  const baseState = normalizeBoardState(state)
  const cards = baseState.cards
    .filter((card) => card.id !== cardId)
    .map(cloneCard)

  if (cards.length === baseState.cards.length) {
    return baseState
  }

  const maxZ = cards.reduce((current, card) => Math.max(current, card.z), 0)

  return {
    ...baseState,
    maxZ,
    cards,
  }
}

export function resizeCard(state, cardId, delta = RESIZE_STEP) {
  const baseState = normalizeBoardState(state)
  const { found, cards } = mapCards(baseState, cardId, (card) => {
    const nextScale = 1 + normalizeNumber(delta, 0)

    return {
      ...cloneCard(card),
      width: clamp(Math.round(card.width * nextScale), MIN_CARD_WIDTH, MAX_CARD_WIDTH),
      height: clamp(Math.round(card.height * nextScale), MIN_CARD_HEIGHT, MAX_CARD_HEIGHT),
      updatedAt: nowTs(),
    }
  })

  if (!found) return baseState

  return {
    ...baseState,
    cards,
  }
}

export function updateCardColor(state, cardId, color) {
  const nextColor = normalizeCardColor(color)
  const baseState = normalizeBoardState(state)
  const { found, cards } = mapCards(baseState, cardId, (card) => ({
    ...cloneCard(card),
    color: nextColor,
    updatedAt: nowTs(),
  }))

  if (!found) return baseState

  return {
    ...baseState,
    cards,
  }
}

export function beginCardDrag(card, pointer) {
  return {
    cardId: card.id,
    pointerId: pointer.pointerId,
    startClientX: pointer.clientX,
    startClientY: pointer.clientY,
    startX: card.x,
    startY: card.y,
    deltaX: 0,
    deltaY: 0,
    moved: false,
  }
}

export function updateCardDrag(session, pointer, { scale = 1 } = {}) {
  const normalizedScale = typeof scale === 'number' && scale > 0 ? scale : 1
  const deltaX = (pointer.clientX - session.startClientX) / normalizedScale
  const deltaY = (pointer.clientY - session.startClientY) / normalizedScale
  const moved = Math.hypot(deltaX, deltaY) >= DRAG_DISTANCE_THRESHOLD

  return {
    ...session,
    deltaX,
    deltaY,
    moved,
    nextX: clamp(session.startX + deltaX, -POSITION_LIMIT, POSITION_LIMIT),
    nextY: clamp(session.startY + deltaY, -POSITION_LIMIT, POSITION_LIMIT),
  }
}

export function commitCardDrag(state, session) {
  const baseState = normalizeBoardState(state)
  if (!session?.cardId || !session.moved) {
    return baseState
  }

  const { found, cards } = mapCards(baseState, session.cardId, (card) => ({
    ...cloneCard(card),
    x: clamp(normalizeNumber(session.nextX, card.x), -POSITION_LIMIT, POSITION_LIMIT),
    y: clamp(normalizeNumber(session.nextY, card.y), -POSITION_LIMIT, POSITION_LIMIT),
    updatedAt: nowTs(),
  }))

  if (!found) return baseState

  return {
    ...baseState,
    cards,
  }
}
