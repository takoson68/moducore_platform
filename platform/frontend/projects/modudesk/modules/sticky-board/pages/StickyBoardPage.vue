<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import StickyCard from '../components/StickyCard.vue'
import {
  beginCardDrag,
  BOARD_SIZE,
  BOARD_HALF_SIZE,
  commitCardDrag,
  createCard,
  createEmptyBoardState,
  normalizeBoardState,
  removeCard,
  raiseCard,
  resizeCard,
  rotateCard,
  updateCardColor,
  updateCardContent,
  updateCardDrag,
} from '../board/boardEngine.js'
import { loadBoardState, saveBoardState } from '../board/storage.js'

const boardState = ref(createEmptyBoardState())
const boardViewport = ref(null)
const boardSpace = ref(null)
const boardSurface = ref(null)
const dragSession = ref(null)
const panSession = ref(null)
const persistTimer = ref(null)
const loading = ref(true)
const saveError = ref('')
const suppressCardClick = ref(false)
const zoom = ref(1)
let pendingPersistPromise = null

const ZOOM_OPTIONS = [
  { label: '25%', value: 0.25 },
  { label: '50%', value: 0.5 },
  { label: '75%', value: 0.75 },
  { label: '100%', value: 1 },
]

const cards = computed(() => [...boardState.value.cards].sort((left, right) => left.z - right.z))
const boardSpaceStyle = computed(() => ({
  width: `${BOARD_SIZE * zoom.value}px`,
  height: `${BOARD_SIZE * zoom.value}px`,
}))
const boardSurfaceStyle = computed(() => ({
  transform: `scale(${zoom.value})`,
}))
const spaceCenter = computed(() => {
  const surface = boardSurface.value
  if (!surface) {
    return {
      x: BOARD_HALF_SIZE,
      y: BOARD_HALF_SIZE,
    }
  }

  return {
    x: surface.clientWidth / 2,
    y: surface.clientHeight / 2,
  }
})
const dragOffsets = computed(() => {
  if (!dragSession.value?.cardId) {
    return {}
  }

  return {
    [dragSession.value.cardId]: {
      x: dragSession.value.deltaX || 0,
      y: dragSession.value.deltaY || 0,
    },
  }
})

function clearPersistTimer() {
  if (!persistTimer.value) return
  window.clearTimeout(persistTimer.value)
  persistTimer.value = null
}

async function persistNow() {
  clearPersistTimer()
  pendingPersistPromise = saveBoardState(boardState.value)

  try {
    await pendingPersistPromise
    saveError.value = ''
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Sticky Board 儲存失敗'
    throw error
  } finally {
    pendingPersistPromise = null
  }
}

function schedulePersist() {
  clearPersistTimer()
  pendingPersistPromise = new Promise((resolve, reject) => {
    persistTimer.value = window.setTimeout(async () => {
      persistTimer.value = null

      try {
        await persistNow()
        resolve()
      } catch (error) {
        reject(error)
      }
    }, 200)
  })
}

async function flushPendingPersist() {
  if (persistTimer.value) {
    await persistNow()
    return
  }

  if (pendingPersistPromise) {
    await pendingPersistPromise
  }
}

function handlePageHide() {
  flushPendingPersist().catch(() => {})
}

function scrollToWorldCenter(boardEl, spaceEl) {
  if (!boardEl || !spaceEl) {
    return
  }

  const targetLeft = Math.max(0, (spaceEl.scrollWidth / 2) - (boardEl.clientWidth / 2))
  const targetTop = Math.max(0, (spaceEl.scrollHeight / 2) - (boardEl.clientHeight / 2))

  boardEl.scrollLeft = targetLeft
  boardEl.scrollTop = targetTop
}

function scheduleInitialCentering() {
  requestAnimationFrame(() => {
    scrollToWorldCenter(boardViewport.value, boardSpace.value)

    requestAnimationFrame(() => {
      scrollToWorldCenter(boardViewport.value, boardSpace.value)
    })
  })
}

function setBoardState(nextState, { persist = true } = {}) {
  boardState.value = normalizeBoardState(nextState)
  if (persist) {
    schedulePersist()
  }
}

function isInteractiveTarget(target) {
  if (!target || typeof target.closest !== 'function') {
    return false
  }

  if (target.closest('.stickyCard') || target.closest('.sticky-card')) {
    return true
  }

  if (target.closest('[data-ui]')) {
    return true
  }

  return Boolean(target.closest('button, input, textarea, a'))
}

function clampScrollPosition(viewport, nextLeft, nextTop) {
  if (!viewport) {
    return
  }

  const maxScrollLeft = Math.max(0, viewport.scrollWidth - viewport.clientWidth)
  const maxScrollTop = Math.max(0, viewport.scrollHeight - viewport.clientHeight)

  viewport.scrollLeft = Math.max(0, Math.min(maxScrollLeft, nextLeft))
  viewport.scrollTop = Math.max(0, Math.min(maxScrollTop, nextTop))
}

function getViewportCenterWorldPosition() {
  const viewport = boardViewport.value
  const surfaceCenter = spaceCenter.value
  const scale = zoom.value || 1

  if (!viewport) {
    return { x: 0, y: 0 }
  }

  const viewX = (viewport.scrollLeft + viewport.clientWidth / 2) / scale
  const viewY = (viewport.scrollTop + viewport.clientHeight / 2) / scale

  return {
    x: viewX - surfaceCenter.x,
    y: viewY - surfaceCenter.y,
  }
}

function scrollToWorldPosition(worldX, worldY) {
  const viewport = boardViewport.value
  const surfaceCenter = spaceCenter.value
  const scale = zoom.value || 1

  if (!viewport) {
    return
  }

  clampScrollPosition(
    viewport,
    ((surfaceCenter.x + worldX) * scale) - (viewport.clientWidth / 2),
    ((surfaceCenter.y + worldY) * scale) - (viewport.clientHeight / 2),
  )
}

function handleZoomChange(event) {
  const nextZoom = Number(event.target.value)
  const currentCenter = getViewportCenterWorldPosition()

  if (!Number.isFinite(nextZoom) || nextZoom <= 0) {
    return
  }

  zoom.value = nextZoom
  setBoardState({
    ...boardState.value,
    zoom: nextZoom,
  })

  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      scrollToWorldPosition(currentCenter.x, currentCenter.y)
    })
  })
}

function handleCreateCard() {
  const worldPosition = getViewportCenterWorldPosition()
  const { state } = createCard(boardState.value, worldPosition)
  setBoardState(state)
}

function handleActivateCard(cardId) {
  if (suppressCardClick.value) {
    suppressCardClick.value = false
    return
  }

  setBoardState(raiseCard(boardState.value, cardId))
}

function handleRotateCard(cardId) {
  setBoardState(rotateCard(boardState.value, cardId))
}

function handleResizeCard({ id, delta }) {
  if (!id) {
    return
  }

  setBoardState(resizeCard(boardState.value, id, delta))
}

function handleCardContent({ id, content }) {
  setBoardState(updateCardContent(boardState.value, id, content))
}

function handleCardColor({ id, color }) {
  if (!id || !color) {
    return
  }

  setBoardState(updateCardColor(boardState.value, id, color))
}

function handleRemoveCard(cardId) {
  if (!cardId) {
    return
  }

  setBoardState(removeCard(boardState.value, cardId))
}

function releasePointerCapture(target, pointerId) {
  if (!target || typeof target.releasePointerCapture !== 'function' || pointerId == null) {
    return
  }

  try {
    target.releasePointerCapture(pointerId)
  } catch {
    // pointer capture 可能已被釋放
  }
}

function teardownDrag() {
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', handleWindowPointerUp)
  window.removeEventListener('pointercancel', handleWindowPointerUp)
  document.body.classList.remove('sticky-board-dragging')
}

function releasePanPointerCapture(target, pointerId) {
  if (!target || typeof target.releasePointerCapture !== 'function' || pointerId == null) {
    return
  }

  try {
    target.releasePointerCapture(pointerId)
  } catch {
    // pointer capture 可能已被釋放
  }
}

function stopPanning() {
  const session = panSession.value
  if (session) {
    releasePanPointerCapture(session.captureTarget, session.pointerId)
  }

  panSession.value = null
  document.body.classList.remove('sticky-board-panning')
}

function handleBackgroundPointerDown(event) {
  if (event.button !== 0) {
    return
  }

  if (isInteractiveTarget(event.target)) {
    return
  }

  const viewport = boardViewport.value
  const space = boardSpace.value
  if (!viewport || !space) {
    return
  }

  panSession.value = {
    pointerId: event.pointerId,
    startX: event.clientX,
    startY: event.clientY,
    startScrollLeft: viewport.scrollLeft,
    startScrollTop: viewport.scrollTop,
    movedDistance: 0,
    captureTarget: space,
  }

  if (typeof space.setPointerCapture === 'function') {
    space.setPointerCapture(event.pointerId)
  }

  document.body.classList.add('sticky-board-panning')
}

function handleBackgroundPointerMove(event) {
  const session = panSession.value
  const viewport = boardViewport.value
  if (!session || !viewport || event.pointerId !== session.pointerId) {
    return
  }

  const deltaX = event.clientX - session.startX
  const deltaY = event.clientY - session.startY
  const movedDistance = Math.max(Math.abs(deltaX), Math.abs(deltaY))

  clampScrollPosition(
    viewport,
    session.startScrollLeft - deltaX,
    session.startScrollTop - deltaY,
  )
  session.movedDistance = movedDistance

  if (movedDistance > 4) {
    suppressCardClick.value = true
    event.preventDefault()
  }
}

function handleBackgroundPointerUp(event) {
  const session = panSession.value
  if (!session || event.pointerId !== session.pointerId) {
    return
  }

  if (session.movedDistance <= 4) {
    suppressCardClick.value = false
  }

  stopPanning()
}

function handleWindowPointerMove(event) {
  if (!dragSession.value || event.pointerId !== dragSession.value.pointerId) {
    return
  }

  dragSession.value = updateCardDrag(dragSession.value, event, { scale: zoom.value })
}

function handleWindowPointerUp(event) {
  if (!dragSession.value || event.pointerId !== dragSession.value.pointerId) {
    return
  }

  const session = dragSession.value
  releasePointerCapture(session.captureTarget, session.pointerId)
  teardownDrag()

  if (session.moved) {
    setBoardState(commitCardDrag(boardState.value, session))
  } else {
    setBoardState(raiseCard(boardState.value, session.cardId))
  }

  dragSession.value = null
}

function handleDragStart({ event, cardId }) {
  const card = boardState.value.cards.find((entry) => entry.id === cardId)
  if (!card) return

  dragSession.value = {
    ...beginCardDrag(card, event),
    captureTarget: event.currentTarget,
  }

  if (typeof event.currentTarget?.setPointerCapture === 'function') {
    event.currentTarget.setPointerCapture(event.pointerId)
  }

  setBoardState(raiseCard(boardState.value, cardId), { persist: false })
  document.body.classList.add('sticky-board-dragging')
  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', handleWindowPointerUp)
  window.addEventListener('pointercancel', handleWindowPointerUp)
}

onMounted(async () => {
  try {
    boardState.value = normalizeBoardState(await loadBoardState())
    zoom.value = boardState.value.zoom || 1
  } catch (error) {
    saveError.value = error instanceof Error ? error.message : 'Sticky Board 載入失敗'
  } finally {
    loading.value = false
  }

  scheduleInitialCentering()
  window.addEventListener('pagehide', handlePageHide)
  window.addEventListener('beforeunload', handlePageHide)
})

onBeforeUnmount(() => {
  flushPendingPersist().catch(() => {})
  teardownDrag()
  stopPanning()
  if (dragSession.value) {
    releasePointerCapture(dragSession.value.captureTarget, dragSession.value.pointerId)
  }
  window.removeEventListener('pagehide', handlePageHide)
  window.removeEventListener('beforeunload', handlePageHide)
})
</script>

<template lang="pug">
section.sticky-board-page
  header.board-header
    .board-copy
      h2.page-title Sticky Board
      p.page-sub 以空間座標保存卡片，刷新後還原整個佈局。
    .board-actions
      label.zoom-select
        span.zoom-label 縮放
        select.zoom-input(:value="zoom" @change="handleZoomChange")
          option(v-for="option in ZOOM_OPTIONS" :key="option.value" :value="option.value") {{ option.label }}
      button.create-btn(type="button" @click="handleCreateCard") 新增卡片
  p.board-hint world 原點固定為畫布中心 (0,0)，卡片以中心點座標保存。
  p.inline-error(v-if="saveError") {{ saveError }}
  .board-stage
    .board-empty(v-if="!loading && cards.length === 0")
      p.empty-title 這裡還是空的。
      p.empty-copy 先建立第一張卡片，把空間佈局放上桌面。
    .board-viewport(ref="boardViewport")
      .board-space(
        ref="boardSpace"
        :style="boardSpaceStyle"
        :class="{ 'is-grabbing': !!panSession }"
        @pointerdown="handleBackgroundPointerDown"
        @pointermove="handleBackgroundPointerMove"
        @pointerup="handleBackgroundPointerUp"
        @pointercancel="handleBackgroundPointerUp"
      )
        .board-surface(ref="boardSurface" :style="boardSurfaceStyle")
          .board-axis.board-axis-x
          .board-axis.board-axis-y
          StickyCard(
            v-for="card in cards"
            :key="card.id"
            :card="card"
            :space-center="spaceCenter"
            :drag-offset="dragOffsets[card.id]"
            @activate="handleActivateCard"
            @dragstart="handleDragStart"
            @remove="handleRemoveCard"
            @resize="handleResizeCard"
            @rotate="handleRotateCard"
            @update:color="handleCardColor"
            @update:content="handleCardContent"
          )
</template>

<style lang="sass">
.sticky-board-page
  --board-size: 3600px
  --card-w: 280px
  --card-h: 200px
  display: grid
  grid-template-rows: auto auto auto minmax(0, 1fr)
  gap: 0.9rem
  min-height: 0
  height: calc(100dvh - 8rem)
  max-height: calc(100dvh - 8rem)

.board-header
  display: flex
  justify-content: space-between
  align-items: center
  gap: 1rem

.board-copy
  display: grid
  gap: 0.25rem

.page-title
  margin: 0
  font-size: 1.5rem
  color: #202534

.page-sub, .board-hint
  margin: 0
  color: #677089

.board-actions
  display: flex
  align-items: center
  gap: 0.75rem

.zoom-select
  display: inline-flex
  align-items: center
  gap: 0.45rem
  color: #556079

.zoom-label
  font-size: 0.82rem

.zoom-input
  border: 1px solid rgba(36, 42, 54, 0.08)
  border-radius: 999px
  background: rgba(255, 255, 255, 0.88)
  color: #42506a
  min-height: 2.2rem
  padding: 0 0.85rem

.create-btn
  border: 0
  border-radius: 999px
  padding: 0.75rem 1rem
  background: linear-gradient(135deg, #ff8e64, #ef6c5a)
  color: #fff
  cursor: pointer
  box-shadow: 0 12px 24px rgba(239, 108, 90, 0.18)

.inline-error
  margin: 0
  color: #b42318

.board-stage
  position: relative
  min-height: 0
  height: 100%
  border-radius: 1.25rem
  overflow: hidden
  background: rgba(252, 252, 254, 0.82)
  border: 1px solid rgba(36, 42, 54, 0.08)

.board-empty
  position: absolute
  inset: 1.2rem auto auto 1.2rem
  z-index: 2
  padding: 0.9rem 1rem
  border-radius: 1rem
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(36, 42, 54, 0.08)

.empty-title, .empty-copy
  margin: 0

.empty-title
  font-weight: 600
  color: #23293a

.empty-copy
  margin-top: 0.25rem
  color: #6c7489

.board-viewport
  position: relative
  width: 100%
  height: 100%
  min-height: 100%
  overflow: auto
  background-image: linear-gradient(rgba(120, 132, 166, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(120, 132, 166, 0.08) 1px, transparent 1px)
  background-size: 28px 28px

.board-space
  position: relative
  flex: none
  cursor: grab
  touch-action: none

.board-space.is-grabbing
  cursor: grabbing

.board-surface
  position: absolute
  inset: 0 auto auto 0
  width: var(--board-size)
  height: var(--board-size)
  transform-origin: top left

.board-axis
  position: absolute
  background: rgba(93, 110, 146, 0.24)
  pointer-events: none

.board-axis-x
  left: 0
  right: 0
  top: calc(50% - 0.5px)
  height: 1px

.board-axis-y
  top: 0
  bottom: 0
  left: calc(50% - 0.5px)
  width: 1px

:global(body.sticky-board-dragging)
  user-select: none
  cursor: grabbing

:global(body.sticky-board-panning)
  user-select: none
</style>
