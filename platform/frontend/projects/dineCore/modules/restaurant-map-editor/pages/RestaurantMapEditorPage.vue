<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import world from '@/world.js'
import MapEditorCanvas from './components/MapEditorCanvas.vue'
import MapEditorHeader from './components/MapEditorHeader.vue'
import {
  applyPolylineNodeSnap,
  applyPolylineSnap,
  applyRotationSnap,
  buildObjectTransform,
  formatStamp,
  getObjectBox,
  getObjectCenter,
  getObjectRotation,
  normalizeBoxFromPoints,
  normalizeRotation,
  polylinePointsToString,
  resolveRotationFromPoint,
  rotatePoint
} from '../utils/editorGeometry.js'

const SNAP_THRESHOLD = 14
const MIN_SHAPE_SIZE = 8
const DEFAULT_TEXT_WIDTH = 160
const DEFAULT_TEXT_HEIGHT = 48
const ROTATION_SNAP_STEP = 15
const ROTATION_SNAP_THRESHOLD = 6
const CIRCLE_SNAP_THRESHOLD = 18
const editorStore = world.store('dineCoreRestaurantMapEditorStore')
const state = computed(() => editorStore.state)
const mapCanvasRef = ref(null)
const workspaceSurfaceRef = ref(null)
const hoverWorldPoint = ref(null)
const selectedNodeIndex = ref(null)
const dragState = ref(null)
const pendingShape = ref(null)
const textEditValue = ref('')
const tableLabelValue = ref('')
const objectLayerOrder = ref('')
const viewScale = ref(1)
const didPan = ref(false)

const createForm = reactive({
  name: '',
  width: 1200,
  height: 800
})


const mapMetaForm = reactive({
  name: '',
  width: 1200,
  height: 800
})
const toolOptions = [
  { id: 'polyline', label: '\u6298\u7dda' },
  { id: 'rect', label: '\u77e9\u5f62' },
  { id: 'circle', label: '\u5713\u5f62' },
  { id: 'text', label: '\u6587\u5b57' }
]
const tableToolOptions = [
  { id: 'table', label: '\u684c\u4f4d' }
]
const workingModeOptions = [
  { id: 'map', label: '\u5730\u5716\u7de8\u8f2f' },
  { id: 'table', label: '\u684c\u4f4d\u7de8\u8f2f' }
]

const activeMap = computed(() => state.value.maps.find(map => map.id === state.value.activeMapId) || null)
const activeMapIsDirty = computed(() => Boolean(activeMap.value && state.value.dirtyMapIds.includes(activeMap.value.id)))
const mapObjects = computed(() => Array.isArray(activeMap.value?.objects) ? activeMap.value.objects : [])
const mapPolylines = computed(() => mapObjects.value.filter(item => item?.type === 'polyline'))
const drawableObjects = computed(() => mapObjects.value.filter(item => item?.type !== 'polyline'))
const mapTables = computed(() => Array.isArray(activeMap.value?.tables) ? activeMap.value.tables : [])
const activeObject = computed(() => mapObjects.value.find(item => item.id === state.value.activeObjectId) || null)
const activeObjectOrder = computed(() => {
  if (!activeObject.value) return null
  const index = mapObjects.value.findIndex(item => item.id === activeObject.value.id)
  return index >= 0 ? index + 1 : null
})
const activePolyline = computed(() => activeObject.value?.type === 'polyline' ? activeObject.value : null)
const activeShapeObject = computed(() => activeObject.value?.type && activeObject.value.type !== 'polyline' ? activeObject.value : null)
const activeTable = computed(() => mapTables.value.find(item => item.id === state.value.activeTableId) || null)
const pendingPolyline = computed(() => Array.isArray(state.value.draftState?.pendingPolyline) ? state.value.draftState.pendingPolyline : [])
const activePolylinePoints = computed(() => Array.isArray(activePolyline.value?.data?.points) ? activePolyline.value.data.points : [])

const pendingPolylinePointsString = computed(() => {
  const points = [...pendingPolyline.value]
  if (isPolylineDrawing.value && hoverWorldPoint.value && points.length > 0) points.push(hoverWorldPoint.value)
  return points.map(point => `${point.x},${point.y}`).join(' ')
})

const activePolylineSegments = computed(() => {
  const points = activePolylinePoints.value
  const segments = []
  for (let index = 0; index < points.length - 1; index += 1) {
    segments.push({ index, start: points[index], end: points[index + 1] })
  }
  return segments
})
const activePolylineCenter = computed(() => {
  const points = activePolylinePoints.value
  if (!points.length) return null
  const xs = points.map(point => Number(point.x || 0))
  const ys = points.map(point => Number(point.y || 0))
  return {
    x: Number(((Math.min(...xs) + Math.max(...xs)) / 2).toFixed(2)),
    y: Number(((Math.min(...ys) + Math.max(...ys)) / 2).toFixed(2))
  }
})
const activeObjectBox = computed(() => activeShapeObject.value ? getObjectBox(activeShapeObject.value) : null)
const activeObjectCenter = computed(() => activeShapeObject.value ? getObjectCenter(activeShapeObject.value) : null)
const activeObjectRotation = computed(() => activeShapeObject.value ? getObjectRotation(activeShapeObject.value) : 0)
const activeObjectTransform = computed(() => buildObjectTransform(activeShapeObject.value))
const activeObjectHandles = computed(() => {
  const box = activeObjectBox.value
  const center = activeObjectCenter.value
  const rotation = activeObjectRotation.value
  if (!box || !center) return []
  return [
    { key: 'nw', x: box.x, y: box.y },
    { key: 'ne', x: box.x + box.width, y: box.y },
    { key: 'sw', x: box.x, y: box.y + box.height },
    { key: 'se', x: box.x + box.width, y: box.y + box.height }
  ].map(handle => ({ ...handle, ...rotatePoint(handle, center, rotation) }))
})
const activeObjectRotateHandle = computed(() => {
  const box = activeObjectBox.value
  const center = activeObjectCenter.value
  const rotation = activeObjectRotation.value
  if (!box || !center) return null
  return rotatePoint({ x: box.x + box.width + 34, y: box.y + box.height }, center, rotation)
})

const activeTableBox = computed(() => activeTable.value ? getTableBox(activeTable.value) : null)
const activeTableCenter = computed(() => activeTable.value ? getTableCenter(activeTable.value) : null)
const activeTableRotation = computed(() => activeTable.value ? getTableRotation(activeTable.value) : 0)
const activeTableTransform = computed(() => buildTableTransform(activeTable.value))
const activeTableHandles = computed(() => {
  const box = activeTableBox.value
  const center = activeTableCenter.value
  const rotation = activeTableRotation.value
  if (!box || !center) return []
  return [
    { key: 'nw', x: box.x, y: box.y },
    { key: 'ne', x: box.x + box.width, y: box.y },
    { key: 'sw', x: box.x, y: box.y + box.height },
    { key: 'se', x: box.x + box.width, y: box.y + box.height }
  ].map(handle => ({ ...handle, ...rotatePoint(handle, center, rotation) }))
})
const activeTableRotateHandle = computed(() => {
  const box = activeTableBox.value
  const center = activeTableCenter.value
  const rotation = activeTableRotation.value
  if (!box || !center) return null
  return rotatePoint({ x: box.x + box.width + 34, y: box.y + box.height }, center, rotation)
})

const isPolylineDrawing = computed(() => state.value.mode === 'edit' && state.value.workingMode === 'map' && state.value.activeTool === 'polyline')
const isShapeDrawing = computed(() => state.value.mode === 'edit' && state.value.workingMode === 'map' && ['rect', 'circle'].includes(state.value.activeTool))
const isTableDrawing = computed(() => state.value.mode === 'edit' && state.value.workingMode === 'table' && state.value.activeTool === 'table')
const currentToolOptions = computed(() => state.value.workingMode === 'table' ? tableToolOptions : toolOptions)
const scalePercent = computed(() => `${Math.round(viewScale.value * 100)}%`)
const canPanSurface = computed(() => !state.value.activeTool && !activeObject.value && !activeTable.value && !pendingShape.value)

function openCreateMapForm() { editorStore.openCreateMapForm() }
function closeCreateMapForm() { editorStore.closeCreateMapForm() }

function unwrapEditorApiResult(result, fallbackCode = 'MAP_EDITOR_API_FAILED') {
  const isSuccess = Boolean(result?.ok && result?.data?.ok)
  if (!isSuccess) {
    const code = String(result?.data?.error?.code || result?.data?.data?.error?.code || result?.status || fallbackCode)
    const message = String(result?.data?.error?.message || result?.data?.data?.error?.message || result?.data?.message || '').trim()
    throw new Error(message && message !== code ? `${code}: ${message}` : code)
  }

  return result.data.data || null
}

async function loadMapListFromBackend() {
  if (world.apiMode() !== 'real') return false

  const result = await world.http().get('/api/dinecore/staff/map-editor/list', { tokenQuery: true })
  const data = unwrapEditorApiResult(result, 'MAP_FILE_LIST_FAILED')
  const maps = Array.isArray(data?.maps) ? data.maps : []
  if (!maps.length) return false

  editorStore.mergeMapsFromBackend({ maps })
  return true
}

async function loadMapFromBackend(mapId, preferredStatus = 'draft') {
  if (!mapId || world.apiMode() !== 'real') return false

  const statuses = preferredStatus === 'final' ? ['final', 'draft'] : ['draft', 'final']
  for (const status of statuses) {
    try {
      const result = await world.http().get(
        `/api/dinecore/staff/map-editor/load?map_id=${encodeURIComponent(mapId)}&status=${encodeURIComponent(status)}`,
        { tokenQuery: true }
      )
      const data = unwrapEditorApiResult(result, 'MAP_FILE_LOAD_FAILED')
      const mapPayload = data?.map?.id ? data.map : data?.payload
      if (mapPayload?.id) {
        editorStore.hydrateMap({ map: mapPayload })
        editorStore.hydrateDraftSession({
          mode: data?.draftState?.mode,
          workingMode: data?.draftState?.workingMode,
          activeTool: data?.draftState?.tool,
          activeObjectId: data?.draftState?.activeObjectId,
          activeTableId: data?.draftState?.activeTableId,
          toolbarLocked: data?.draftState?.toolbarLocked,
          draftState: {
            pendingPolyline: data?.draftState?.pendingPolyline,
            pendingShape: data?.draftState?.pendingShape,
            pendingText: data?.draftState?.pendingText
          }
        })
        pendingShape.value = data?.draftState?.pendingShape || null
        return true
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : ''
      const isNotFound = message.includes('MAP_FILE_NOT_FOUND') || message.includes('NOT_FOUND')
      if (!isNotFound) throw error
    }
  }

  return false
}

async function confirmProceedWithUnsavedChanges(actionLabel = '繼續操作') {
  if (!activeMapIsDirty.value) return true

  const shouldSave = window.confirm(`目前地圖「${activeMap.value?.name || ''}」有未儲存變更。\n按「確定」會先草稿存檔，再${actionLabel}。\n按「取消」可選擇不儲存直接${actionLabel}或取消。`)
  if (shouldSave) {
    return await saveDraft()
  }

  const shouldDiscard = window.confirm(`按「確定」會不儲存直接${actionLabel}。\n按「取消」則中止本次操作。`)
  return shouldDiscard
}

function buildDraftSnapshot() {
  return {
    mode: state.value.mode,
    workingMode: state.value.workingMode,
    tool: state.value.activeTool,
    activeObjectId: state.value.activeObjectId,
    activeTableId: state.value.activeTableId,
    toolbarLocked: state.value.toolbarLocked,
    pendingPolyline: state.value.draftState?.pendingPolyline || [],
    pendingShape: pendingShape.value,
    pendingText: state.value.draftState?.pendingText || null
  }
}

async function saveDraft() {
  if (!activeMap.value) return false

  if (world.apiMode() !== 'real') {
    editorStore.saveDraft()
    return true
  }

  try {
    const result = await world.http().post(
      '/api/dinecore/staff/map-editor/save-draft',
      {
        map: activeMap.value,
        status: 'draft',
        draftState: buildDraftSnapshot()
      },
      { tokenQuery: true }
    )

    unwrapEditorApiResult(result, 'MAP_DRAFT_SAVE_FAILED')
    editorStore.saveDraft()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MAP_DRAFT_SAVE_FAILED'
    window.alert(`草稿存檔失敗：${message}`)
    return false
  }
}

async function saveFinal() {
  if (!activeMap.value) return false

  if (world.apiMode() !== 'real') {
    editorStore.saveFinal()
    return true
  }

  try {
    const result = await world.http().post(
      '/api/dinecore/staff/map-editor/save-final',
      {
        map: activeMap.value,
        status: 'final'
      },
      { tokenQuery: true }
    )

    unwrapEditorApiResult(result, 'MAP_FINAL_SAVE_FAILED')
    editorStore.saveFinal()
    return true
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MAP_FINAL_SAVE_FAILED'
    window.alert(`正式存檔失敗：${message}`)
    return false
  }
}

function submitCreateMap() {
  if (!isCreateFormValid()) return
  editorStore.createMap({ name: createForm.name, width: createForm.width, height: createForm.height })
}

function isCreateFormValid() {
  return String(createForm.name || '').trim() && Number(createForm.width) > 0 && Number(createForm.height) > 0
}

async function setActiveMap(mapId) {
  if (!mapId || mapId === state.value.activeMapId) return

  const canProceed = await confirmProceedWithUnsavedChanges('切換地圖')
  if (!canProceed) return

  editorStore.setActiveMap(mapId)
  resetLocalState()

  if (state.value.dirtyMapIds.includes(mapId)) return

  try {
    await loadMapFromBackend(mapId, 'draft')
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MAP_FILE_LOAD_FAILED'
    window.alert(`地圖讀取失敗：${message}`)
  }
}


function submitMapMeta() {
  if (!activeMap.value) return

  const name = String(mapMetaForm.name || '').trim()
  const width = Number(mapMetaForm.width)
  const height = Number(mapMetaForm.height)

  editorStore.updateMapMeta({
    mapId: activeMap.value.id,
    name,
    width,
    height
  })
}

async function deleteActiveMap() {
  if (!activeMap.value) return

  const canProceed = await confirmProceedWithUnsavedChanges('刪除地圖')
  if (!canProceed) return
  if (!window.confirm(`\u78ba\u5b9a\u8981\u522a\u9664\u5730\u5716\u300c${activeMap.value.name}\u300d\u55ce\uff1f`)) return

  editorStore.deleteMap(activeMap.value.id)
  resetLocalState()
}

function setMode(mode) {
  editorStore.setMode(mode)
  resetLocalState()
}

function setWorkingMode(workingMode) {
  editorStore.setWorkingMode(workingMode)
  resetLocalState()
}

function setTool(toolId) {
  editorStore.setActiveTool(state.value.activeTool === toolId ? '' : toolId)
  resetLocalState()
}

function clearActiveObject() {
  editorStore.clearActiveObject()
  selectedNodeIndex.value = null
}

function deleteActiveObject() {
  if (!activeObject.value) return
  editorStore.deleteObject(activeObject.value.id)
  resetLocalState()
}

function clearActiveTable() {
  editorStore.clearActiveTable()
}

function deleteActiveTable() {
  if (!activeTable.value) return
  editorStore.deleteTable(activeTable.value.id)
  resetLocalState()
}

function selectTable(tableId) {
  if (state.value.mode !== 'edit' || state.value.workingMode !== 'table') return
  editorStore.selectTable(tableId)
}

function setObjectLayerOrder(value) {
  objectLayerOrder.value = String(value || '')
}

function setTextEditValue(value) {
  textEditValue.value = String(value || '')
}

function setTableLabelValue(value) {
  tableLabelValue.value = String(value || '')
}

function handleActiveTextInput() {
  if (!activeShapeObject.value || activeShapeObject.value.type !== 'text') return
  editorStore.updateObjectData({
    objectId: activeShapeObject.value.id,
    data: { content: String(textEditValue.value || '').trim() }
  })
}

function handleActiveTableLabelInput() {
  if (!activeTable.value) return
  const label = String(tableLabelValue.value || '').trim()
  if (!label) return
  editorStore.updateTableData({
    tableId: activeTable.value.id,
    data: { label }
  })
}


function applyActiveObjectLayerOrder() {
  if (!activeObject.value) return
  const total = mapObjects.value.length
  const targetOrder = Math.max(1, Math.min(total, Number(objectLayerOrder.value || 0)))
  if (!targetOrder) return
  const nextOrder = editorStore.reorderObject({ objectId: activeObject.value.id, targetOrder })
  objectLayerOrder.value = String(nextOrder || targetOrder)
}

function setViewScale(nextScale) {
  viewScale.value = Math.max(0.5, Math.min(2, Number(nextScale || 1)))
}

function zoomIn() {
  setViewScale(Number((viewScale.value + 0.1).toFixed(2)))
}

function zoomOut() {
  setViewScale(Number((viewScale.value - 0.1).toFixed(2)))
}

function resetZoom() {
  setViewScale(1)
}
function resolveWorldPoint(event) {
  const svgElement = mapCanvasRef.value?.getSvgElement?.() || null
  if (!svgElement || !activeMap.value) return null
  const bounds = svgElement.getBoundingClientRect()
  if (!bounds.width || !bounds.height) return null
  const scaleX = activeMap.value.width / bounds.width
  const scaleY = activeMap.value.height / bounds.height
  const worldX = Math.max(0, Math.min(activeMap.value.width, (event.clientX - bounds.left) * scaleX))
  const worldY = Math.max(0, Math.min(activeMap.value.height, (event.clientY - bounds.top) * scaleY))
  return { x: Number(worldX.toFixed(2)), y: Number(worldY.toFixed(2)) }
}

function clampToMap(point = null) {
  if (!point || !activeMap.value) return null
  return {
    x: Number(Math.max(0, Math.min(activeMap.value.width, point.x)).toFixed(2)),
    y: Number(Math.max(0, Math.min(activeMap.value.height, point.y)).toFixed(2))
  }
}

function getTableBox(table) {
  if (!table) return null
  return {
    x: Number(table.x || 0),
    y: Number(table.y || 0),
    width: Number(table.width || 0),
    height: Number(table.height || 0)
  }
}

function getTableRotation(table) {
  return Number(table?.rotation || 0)
}

function getTableCenter(table) {
  const box = getTableBox(table)
  if (!box) return null
  return {
    x: Number((box.x + box.width / 2).toFixed(2)),
    y: Number((box.y + box.height / 2).toFixed(2))
  }
}

function buildTableTransform(table) {
  const center = getTableCenter(table)
  const rotation = getTableRotation(table)
  if (!center || !rotation) return ''
  return `rotate(${rotation} ${center.x} ${center.y})`
}


function beginShapeDraw(toolType, event) {
  const start = resolveWorldPoint(event)
  if (!start) return
  pendingShape.value = { type: toolType, start, current: start }
}

function commitPendingShape() {
  if (!pendingShape.value) return
  const box = normalizeBoxFromPoints(pendingShape.value.start, pendingShape.value.current)
  const shapeType = pendingShape.value.type
  pendingShape.value = null
  if (box.width < MIN_SHAPE_SIZE || box.height < MIN_SHAPE_SIZE) return
  editorStore.createObject({ type: shapeType, data: { ...box, rotation: 0 } })
}

function createTextObject(event) {
  const point = resolveWorldPoint(event)
  if (!point) return
  const raw = window.prompt('\u8acb\u8f38\u5165\u6587\u5b57\u5167\u5bb9', '\u5340\u57df\u6a19\u793a')
  if (raw === null) return
  const content = String(raw).trim()
  if (!content) return
  editorStore.createObject({
    type: 'text',
    data: { x: point.x, y: point.y, width: DEFAULT_TEXT_WIDTH, height: DEFAULT_TEXT_HEIGHT, content, rotation: 0 }
  })
}


function createTableObject(event) {
  const point = resolveWorldPoint(event)
  if (!point || !activeMap.value) return
  const width = 80
  const height = 80
  const x = Number(Math.max(0, Math.min(activeMap.value.width - width, point.x - width / 2)).toFixed(2))
  const y = Number(Math.max(0, Math.min(activeMap.value.height - height, point.y - height / 2)).toFixed(2))
  editorStore.createTable({ data: { x, y, width, height, rotation: 0 } })
}
function handleSvgClick(event) {
  if (didPan.value) {
    didPan.value = false
    return
  }
  if (state.value.mode !== 'edit' || !activeMap.value) return

  if (state.value.workingMode === 'table') {
    if (state.value.activeTool === 'table' && !state.value.toolbarLocked) {
      createTableObject(event)
    }
    return
  }

  if (state.value.activeTool === 'text' && !state.value.toolbarLocked) {
    createTextObject(event)
    return
  }
  if (!isPolylineDrawing.value) return
  const point = applyPolylineSnap(resolveWorldPoint(event), pendingPolyline.value, SNAP_THRESHOLD)
  if (!point) return
  editorStore.appendPendingPolylinePoint(point)
}

function handleSvgPointerDown(event) {
  if (!isShapeDrawing.value || state.value.toolbarLocked) return
  beginShapeDraw(state.value.activeTool, event)
}


function handleBackgroundPointerDown(event) {
  if (!canPanSurface.value || !workspaceSurfaceRef.value) return
  dragState.value = {
    kind: 'pan',
    startClientX: event.clientX,
    startClientY: event.clientY,
    startScrollLeft: workspaceSurfaceRef.value.scrollLeft,
    startScrollTop: workspaceSurfaceRef.value.scrollTop
  }
  didPan.value = false
}
function handleSvgMove(event) {
  if (isPolylineDrawing.value && pendingPolyline.value.length > 0) {
    hoverWorldPoint.value = applyPolylineSnap(resolveWorldPoint(event), pendingPolyline.value)
  } else {
    hoverWorldPoint.value = null
  }
}

function handleSvgLeave() { hoverWorldPoint.value = null }
function commitPendingPolyline() { if (editorStore.commitPendingPolyline()) hoverWorldPoint.value = null }
function cancelPendingPolyline() { editorStore.cancelPendingPolyline(); hoverWorldPoint.value = null }

function handleSvgDoubleClick(event) {
  if (isPolylineDrawing.value) {
    event.preventDefault()
    commitPendingPolyline()
    return
  }

  if (activeObject.value) {
    event.preventDefault()
    clearActiveObject()
  }
  if (activeTable.value) {
    event.preventDefault()
    clearActiveTable()
  }
}

function isTypingTarget(event) {
  const target = event?.target
  if (!target) return false
  const tagName = String(target.tagName || '').toUpperCase()
  return tagName === 'INPUT' || tagName === 'TEXTAREA' || Boolean(target.isContentEditable)
}

function handleWindowKeydown(event) {
  if (isTypingTarget(event) && event.key === 'Delete') {
    return
  }

  if (event.key === 'Escape') {
    if (dragState.value) {
      dragState.value = null
      return
    }
    if (pendingShape.value) {
      pendingShape.value = null
      return
    }
    if (isPolylineDrawing.value) {
      event.preventDefault()
      cancelPendingPolyline()
      return
    }
    if (activeObject.value) {
      event.preventDefault()
      clearActiveObject()
      return
    }
    if (activeTable.value) {
      event.preventDefault()
      clearActiveTable()
      return
    }
    return
  }

  if (isPolylineDrawing.value && event.key === 'Enter') {
    event.preventDefault()
    commitPendingPolyline()
    return
  }

  if (activeObject.value && event.key === 'Delete') {
    event.preventDefault()
    if (activePolyline.value && Number.isInteger(selectedNodeIndex.value)) {
      deleteSelectedNode()
      return
    }
    deleteActiveObject()
    return
  }

  if (activeTable.value && event.key === 'Delete') {
    event.preventDefault()
    deleteActiveTable()
  }
}

function handleWindowPointerMove(event) {
  if (pendingShape.value) {
    const point = resolveWorldPoint(event)
    if (!point) return
    pendingShape.value = { ...pendingShape.value, current: point }
    return
  }

  if (!dragState.value) return


  if (dragState.value.kind === 'pan' && workspaceSurfaceRef.value) {
    const deltaX = event.clientX - dragState.value.startClientX
    const deltaY = event.clientY - dragState.value.startClientY
    workspaceSurfaceRef.value.scrollLeft = dragState.value.startScrollLeft - deltaX
    workspaceSurfaceRef.value.scrollTop = dragState.value.startScrollTop - deltaY
    if (Math.abs(deltaX) > 3 || Math.abs(deltaY) > 3) didPan.value = true
    return
  }
  if (dragState.value.kind === 'polyline-node' && activePolyline.value) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const snappedPoint = applyPolylineNodeSnap(point, activePolylinePoints.value, dragState.value.index)
    const nextPoints = activePolylinePoints.value.map((item, index) => (
      index === dragState.value.index ? snappedPoint : item
    ))
    editorStore.updatePolylinePoints({ objectId: activePolyline.value.id, points: nextPoints })
    return
  }

  if (dragState.value.kind === 'polyline-move' && activePolyline.value?.id === dragState.value.objectId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const dx = point.x - dragState.value.startPoint.x
    const dy = point.y - dragState.value.startPoint.y
    const nextPoints = dragState.value.originalPoints.map(item => ({
      x: Number((item.x + dx).toFixed(2)),
      y: Number((item.y + dy).toFixed(2))
    }))
    editorStore.updatePolylinePoints({ objectId: activePolyline.value.id, points: nextPoints })
    return
  }

  if (dragState.value.kind === 'object-move' && activeShapeObject.value?.id === dragState.value.objectId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const dx = point.x - dragState.value.startPoint.x
    const dy = point.y - dragState.value.startPoint.y
    const original = dragState.value.originalBox
    editorStore.updateObjectData({
      objectId: dragState.value.objectId,
      data: { x: Number((original.x + dx).toFixed(2)), y: Number((original.y + dy).toFixed(2)) }
    })
    return
  }

  if (dragState.value.kind === 'object-resize' && activeShapeObject.value?.id === dragState.value.objectId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const nextBox = resizeBoxFromHandle(dragState.value.originalBox, dragState.value.handle, point, dragState.value.objectType)
    if (!nextBox) return
    editorStore.updateObjectData({ objectId: dragState.value.objectId, data: nextBox })
    return
  }

  if (dragState.value.kind === 'object-rotate' && activeShapeObject.value?.id === dragState.value.objectId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const currentAngle = resolveRotationFromPoint(dragState.value.center, point)
    const nextRotation = applyRotationSnap(dragState.value.startRotation + currentAngle - dragState.value.startAngle, ROTATION_SNAP_STEP, ROTATION_SNAP_THRESHOLD)
    editorStore.updateObjectData({
      objectId: dragState.value.objectId,
      data: { rotation: nextRotation }
    })
    return
  }

  if (dragState.value.kind === 'table-move' && activeTable.value?.id === dragState.value.tableId) {
    const point = resolveWorldPoint(event)
    if (!point || !activeMap.value) return
    const dx = point.x - dragState.value.startPoint.x
    const dy = point.y - dragState.value.startPoint.y
    const original = dragState.value.originalBox
    editorStore.updateTableData({
      tableId: dragState.value.tableId,
      data: {
        x: Number(Math.max(0, Math.min(activeMap.value.width - original.width, original.x + dx)).toFixed(2)),
        y: Number(Math.max(0, Math.min(activeMap.value.height - original.height, original.y + dy)).toFixed(2))
      }
    })
    return
  }

  if (dragState.value.kind === 'table-resize' && activeTable.value?.id === dragState.value.tableId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const nextBox = resizeBoxFromHandle(dragState.value.originalBox, dragState.value.handle, point, 'table')
    if (!nextBox) return
    editorStore.updateTableData({ tableId: dragState.value.tableId, data: nextBox })
    return
  }

  if (dragState.value.kind === 'table-rotate' && activeTable.value?.id === dragState.value.tableId) {
    const point = resolveWorldPoint(event)
    if (!point) return
    const currentAngle = resolveRotationFromPoint(dragState.value.center, point)
    const nextRotation = applyRotationSnap(dragState.value.startRotation + currentAngle - dragState.value.startAngle, ROTATION_SNAP_STEP, ROTATION_SNAP_THRESHOLD)
    editorStore.updateTableData({
      tableId: dragState.value.tableId,
      data: { rotation: nextRotation }
    })
  }
}

function handleWindowPointerUp() {
  if (pendingShape.value) commitPendingShape()
  dragState.value = null
}

function selectObject(objectId) {
  if (state.value.workingMode !== 'map' || isPolylineDrawing.value) return
  editorStore.selectObject(objectId)
  selectedNodeIndex.value = null
}

function selectPolyline(objectId) { selectObject(objectId) }

function startNodeDrag(index, event) {
  event.stopPropagation()
  selectedNodeIndex.value = index
  dragState.value = { kind: 'polyline-node', index }
}

function startPolylineMove(event) {
  if (!activePolyline.value) return
  const startPoint = resolveWorldPoint(event)
  if (!startPoint) return
  event.stopPropagation()
  dragState.value = {
    kind: 'polyline-move',
    objectId: activePolyline.value.id,
    startPoint,
    originalPoints: activePolylinePoints.value.map(point => ({ x: point.x, y: point.y }))
  }
}
function selectNode(index, event) {
  event.stopPropagation()
  selectedNodeIndex.value = index
}

function startObjectMove(object, event) {
  if (state.value.mode !== 'edit' || state.value.workingMode !== 'map') return
  event.stopPropagation()
  selectObject(object.id)
  if (object.type === 'polyline') return
  const startPoint = resolveWorldPoint(event)
  const originalBox = getObjectBox(object)
  if (!startPoint || !originalBox) return
  dragState.value = { kind: 'object-move', objectId: object.id, startPoint, originalBox }
}

function startTableMove(table, event) {
  if (state.value.mode !== 'edit' || state.value.workingMode !== 'table') return
  event.stopPropagation()
  selectTable(table.id)
  const startPoint = resolveWorldPoint(event)
  const originalBox = getTableBox(table)
  if (!startPoint || !originalBox) return
  dragState.value = { kind: 'table-move', tableId: table.id, startPoint, originalBox }
}

function startResize(handleKey, event) {
  if (!activeShapeObject.value) return
  event.stopPropagation()
  dragState.value = {
    kind: 'object-resize',
    objectId: activeShapeObject.value.id,
    objectType: activeShapeObject.value.type,
    handle: handleKey,
    originalBox: getObjectBox(activeShapeObject.value)
  }
}

function startTableResize(handleKey, event) {
  if (!activeTable.value) return
  event.stopPropagation()
  dragState.value = {
    kind: 'table-resize',
    tableId: activeTable.value.id,
    handle: handleKey,
    originalBox: getTableBox(activeTable.value)
  }
}

function startTableRotate(event) {
  if (!activeTable.value) return
  const center = getTableCenter(activeTable.value)
  const point = resolveWorldPoint(event)
  if (!center || !point) return
  event.stopPropagation()
  dragState.value = {
    kind: 'table-rotate',
    tableId: activeTable.value.id,
    center,
    startAngle: resolveRotationFromPoint(center, point),
    startRotation: getTableRotation(activeTable.value)
  }
}

function startRotate(event) {
  if (!activeShapeObject.value) return
  const center = getObjectCenter(activeShapeObject.value)
  const point = resolveWorldPoint(event)
  if (!center || !point) return
  event.stopPropagation()
  dragState.value = {
    kind: 'object-rotate',
    objectId: activeShapeObject.value.id,
    center,
    startAngle: resolveRotationFromPoint(center, point),
    startRotation: getObjectRotation(activeShapeObject.value)
  }
}

function deleteSelectedNode() {
  if (!activePolyline.value || !Number.isInteger(selectedNodeIndex.value)) return
  const nextPoints = activePolylinePoints.value.filter((_, index) => index !== selectedNodeIndex.value)
  selectedNodeIndex.value = null
  if (nextPoints.length < 2) {
    deleteActiveObject()
    return
  }
  editorStore.updatePolylinePoints({ objectId: activePolyline.value.id, points: nextPoints })
}

function projectPointToSegment(point, start, end) {
  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) return start
  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  const clamped = Math.max(0, Math.min(1, t))
  return { x: Number((start.x + dx * clamped).toFixed(2)), y: Number((start.y + dy * clamped).toFixed(2)) }
}

function insertPointAtSegment(segmentIndex, event) {
  if (!activePolyline.value) return
  event.stopPropagation()
  const worldPoint = resolveWorldPoint(event)
  if (!worldPoint) return
  const segment = activePolylineSegments.value.find(item => item.index === segmentIndex)
  if (!segment) return
  const projected = projectPointToSegment(worldPoint, segment.start, segment.end)
  const nextPoints = [...activePolylinePoints.value]
  nextPoints.splice(segmentIndex + 1, 0, projected)
  editorStore.updatePolylinePoints({ objectId: activePolyline.value.id, points: nextPoints })
  selectedNodeIndex.value = segmentIndex + 1
}

function resizeBoxFromHandle(originalBox, handle, point, objectType = '') {
  if (!originalBox || !point || !activeMap.value) return null

  const left = originalBox.x
  const top = originalBox.y
  const right = originalBox.x + originalBox.width
  const bottom = originalBox.y + originalBox.height
  let nextLeft = left
  let nextTop = top
  let nextRight = right
  let nextBottom = bottom

  if (handle.includes('n')) nextTop = point.y
  if (handle.includes('s')) nextBottom = point.y
  if (handle.includes('w')) nextLeft = point.x
  if (handle.includes('e')) nextRight = point.x

    if (objectType === 'circle') {
    const box = normalizeBoxFromPoints(
      clampToMap({ x: nextLeft, y: nextTop }),
      clampToMap({ x: nextRight, y: nextBottom })
    )
    if (!box || box.width < MIN_SHAPE_SIZE || box.height < MIN_SHAPE_SIZE) return null

    if (Math.abs(box.width - box.height) <= CIRCLE_SNAP_THRESHOLD) {
      const size = Number(Math.max(box.width, box.height).toFixed(2))
      const anchorX = handle.includes('w') ? right : left
      const anchorY = handle.includes('n') ? bottom : top
      return {
        x: Number(Math.max(0, Math.min(handle.includes('w') ? anchorX - size : anchorX, activeMap.value.width - size)).toFixed(2)),
        y: Number(Math.max(0, Math.min(handle.includes('n') ? anchorY - size : anchorY, activeMap.value.height - size)).toFixed(2)),
        width: size,
        height: size
      }
    }

    return box
  }

  const box = normalizeBoxFromPoints(clampToMap({ x: nextLeft, y: nextTop }), clampToMap({ x: nextRight, y: nextBottom }))
  if (!box || box.width < MIN_SHAPE_SIZE || box.height < MIN_SHAPE_SIZE) return null
  return box
}

function resetLocalState() {
  hoverWorldPoint.value = null
  selectedNodeIndex.value = null
  dragState.value = null
  pendingShape.value = null
}

function handleBeforeUnload(event) {
  if (!state.value.dirtyMapIds.length) return
  event.preventDefault()
  event.returnValue = ''
}


watch(activeMap, map => {
  mapMetaForm.name = String(map?.name || '')
  mapMetaForm.width = Number(map?.width || 1200)
  mapMetaForm.height = Number(map?.height || 800)
}, { immediate: true })

watch(activeShapeObject, object => {
  textEditValue.value = object?.type === 'text' ? String(object.data?.content || '') : ''
}, { immediate: true })
watch(activeTable, table => {
  tableLabelValue.value = table ? String(table.label || '') : ''
}, { immediate: true })
watch(activeObjectOrder, order => {
  objectLayerOrder.value = order ? String(order) : ''
}, { immediate: true })

onMounted(async () => {
  window.addEventListener('keydown', handleWindowKeydown)
  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', handleWindowPointerUp)
  window.addEventListener('beforeunload', handleBeforeUnload)

  try {
    await loadMapListFromBackend()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'MAP_FILE_LIST_FAILED'
    window.alert(`地圖列表讀取失敗：${message}`)
  }

  if (activeMap.value?.id && !state.value.dirtyMapIds.includes(activeMap.value.id)) {
    try {
      await loadMapFromBackend(activeMap.value.id, 'draft')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'MAP_FILE_LOAD_FAILED'
      window.alert(`地圖讀取失敗：${message}`)
    }
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', handleWindowPointerUp)
  window.removeEventListener('beforeunload', handleBeforeUnload)
})
</script>
<template lang="pug">
.map-editor-page
  section.editor-shell
    main.editor-main
      section.workspace-card(v-if="activeMap")
        MapEditorHeader(
          :state="state"
          :active-map="activeMap"
          :tool-options="currentToolOptions"
          :working-mode-options="workingModeOptions"
          :scale-percent="scalePercent"
          :map-meta-form="mapMetaForm"
          :active-object="activeObject"
          :active-shape-object="activeShapeObject"
          :active-table="activeTable"
          :map-objects-length="mapObjects.length"
          :object-layer-order="objectLayerOrder"
          :text-edit-value="textEditValue"
          :table-label-value="tableLabelValue"
          :set-active-map="setActiveMap"
          :open-create-map-form="openCreateMapForm"
          :zoom-out="zoomOut"
          :reset-zoom="resetZoom"
          :zoom-in="zoomIn"
          :submit-map-meta="submitMapMeta"
          :save-draft="saveDraft"
          :save-final="saveFinal"
          :delete-active-map="deleteActiveMap"
          :delete-active-object="deleteActiveObject"
          :delete-active-table="deleteActiveTable"
          :set-working-mode="setWorkingMode"
          :set-tool="setTool"
          :set-object-layer-order="setObjectLayerOrder"
          :apply-active-object-layer-order="applyActiveObjectLayerOrder"
          :set-text-edit-value="setTextEditValue"
          :set-table-label-value="setTableLabelValue"
          :handle-active-text-input="handleActiveTextInput"
          :handle-active-table-label-input="handleActiveTableLabelInput"
        )
        .workspace-surface(ref="workspaceSurfaceRef" :class="{ 'is-pannable': canPanSurface, 'is-panning': dragState?.kind === 'pan' }")
          MapEditorCanvas(
            ref="mapCanvasRef"
            :active-map="activeMap"
            :view-scale="viewScale"
            :map-polylines="mapPolylines"
            :drawable-objects="drawableObjects"
            :map-tables="mapTables"
            :active-object-id="state.activeObjectId"
            :active-table-id="state.activeTableId"
            :active-polyline="activePolyline"
            :active-polyline-segments="activePolylineSegments"
            :active-polyline-center="activePolylineCenter"
            :active-polyline-points="activePolylinePoints"
            :selected-node-index="selectedNodeIndex"
            :active-shape-object="activeShapeObject"
            :active-object-box="activeObjectBox"
            :active-object-transform="activeObjectTransform"
            :active-object-handles="activeObjectHandles"
            :active-object-rotate-handle="activeObjectRotateHandle"
            :active-table="activeTable"
            :active-table-box="activeTableBox"
            :active-table-transform="activeTableTransform"
            :active-table-handles="activeTableHandles"
            :active-table-rotate-handle="activeTableRotateHandle"
            :pending-shape="pendingShape"
            :pending-polyline="pendingPolyline"
            :pending-polyline-points-string="pendingPolylinePointsString"
            :hover-world-point="hoverWorldPoint"
            :polyline-points-to-string="polylinePointsToString"
            :build-object-transform="buildObjectTransform"
            :normalize-box-from-points="normalizeBoxFromPoints"
            :handle-svg-click="handleSvgClick"
            :handle-svg-pointer-down="handleSvgPointerDown"
            :handle-svg-move="handleSvgMove"
            :handle-svg-leave="handleSvgLeave"
            :handle-svg-double-click="handleSvgDoubleClick"
            :handle-background-pointer-down="handleBackgroundPointerDown"
            :select-polyline="selectPolyline"
            :select-object="selectObject"
            :start-object-move="startObjectMove"
            :insert-point-at-segment="insertPointAtSegment"
            :start-polyline-move="startPolylineMove"
            :select-node="selectNode"
            :start-node-drag="startNodeDrag"
            :start-resize="startResize"
            :start-rotate="startRotate"
            :select-table="selectTable"
            :start-table-move="startTableMove"
            :start-table-resize="startTableResize"
            :start-table-rotate="startTableRotate"
          )
      section.workspace-card.workspace-card--empty(v-else)
        p.empty-title &#x5c1a;&#x672a;&#x9078;&#x64c7;&#x5730;&#x5716;
        p.empty-hint &#x5148;&#x5efa;&#x7acb;&#x7b2c;&#x4e00;&#x5f35;&#x5730;&#x5716;&#xff0c;&#x7cfb;&#x7d71;&#x6703;&#x81ea;&#x52d5;&#x5207;&#x5230; Map Edit Mode&#x3002;

  .modal-backdrop(v-if="state.isCreateMapFormOpen")
    .modal-card
      .modal-card__head
        div
          p.eyebrow &#x5efa;&#x7acb;&#x65b0;&#x5730;&#x5716;
          h3 &#x65b0;&#x589e;&#x5730;&#x5716;
        button.icon-button(type="button" @click="closeCreateMapForm") &times;
      .form-grid
        label.form-field
          span &#x5730;&#x5716;&#x540d;&#x7a31;
          input(type="text" v-model="createForm.name" placeholder="&#x4f8b;&#x5982;&#xff1a;&#x4e00;&#x6a13;&#x5167;&#x7528;&#x5340;")
        label.form-field
          span &#x5730;&#x5716;&#x5bec;&#x5ea6;
          input(type="number" min="1" step="1" v-model="createForm.width")
        label.form-field
          span &#x5730;&#x5716;&#x9ad8;&#x5ea6;
          input(type="number" min="1" step="1" v-model="createForm.height")
      .modal-actions
        button.ghost-button(type="button" @click="closeCreateMapForm") &#x53d6;&#x6d88;
        button.primary-button(type="button" @click="submitCreateMap" :disabled="!isCreateFormValid()") &#x5efa;&#x7acb;&#x5730;&#x5716;
</template>

<style lang="sass">
@use './RestaurantMapEditorPage.sass'
</style>












































