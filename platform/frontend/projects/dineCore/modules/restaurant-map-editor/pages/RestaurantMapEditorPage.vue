<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import world from '@/world.js'

const SNAP_THRESHOLD = 14
const MIN_SHAPE_SIZE = 8
const DEFAULT_TEXT_WIDTH = 160
const DEFAULT_TEXT_HEIGHT = 48
const ROTATION_SNAP_STEP = 15
const ROTATION_SNAP_THRESHOLD = 6
const CIRCLE_SNAP_THRESHOLD = 18
const editorStore = world.store('dineCoreRestaurantMapEditorStore')
const state = computed(() => editorStore.state)
const svgRef = ref(null)
const workspaceSurfaceRef = ref(null)
const hoverWorldPoint = ref(null)
const selectedNodeIndex = ref(null)
const dragState = ref(null)
const pendingShape = ref(null)
const textEditValue = ref('')
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
  { id: 'polyline', label: '折線' },
  { id: 'rect', label: '矩形' },
  { id: 'circle', label: '圓形' },
  { id: 'text', label: '文字' }
]

const activeMap = computed(() => state.value.maps.find(map => map.id === state.value.activeMapId) || null)
const activeMapIsDirty = computed(() => Boolean(activeMap.value && state.value.dirtyMapIds.includes(activeMap.value.id)))
const mapObjects = computed(() => Array.isArray(activeMap.value?.objects) ? activeMap.value.objects : [])
const mapPolylines = computed(() => mapObjects.value.filter(item => item?.type === 'polyline'))
const drawableObjects = computed(() => mapObjects.value.filter(item => item?.type !== 'polyline'))
const activeObject = computed(() => mapObjects.value.find(item => item.id === state.value.activeObjectId) || null)
const activeObjectOrder = computed(() => {
  if (!activeObject.value) return null
  const index = mapObjects.value.findIndex(item => item.id === activeObject.value.id)
  return index >= 0 ? index + 1 : null
})
const activePolyline = computed(() => activeObject.value?.type === 'polyline' ? activeObject.value : null)
const activeShapeObject = computed(() => activeObject.value?.type && activeObject.value.type !== 'polyline' ? activeObject.value : null)
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

const isPolylineDrawing = computed(() => state.value.mode === 'edit' && state.value.workingMode === 'map' && state.value.activeTool === 'polyline')
const isShapeDrawing = computed(() => state.value.mode === 'edit' && state.value.workingMode === 'map' && ['rect', 'circle'].includes(state.value.activeTool))
const scalePercent = computed(() => `${Math.round(viewScale.value * 100)}%`)
const canPanSurface = computed(() => !state.value.activeTool && !activeObject.value && !pendingShape.value)

function openCreateMapForm() { editorStore.openCreateMapForm() }
function closeCreateMapForm() { editorStore.closeCreateMapForm() }
function saveDraft() { editorStore.saveDraft() }
function saveFinal() { editorStore.saveFinal() }

function submitCreateMap() {
  if (!isCreateFormValid()) return
  editorStore.createMap({ name: createForm.name, width: createForm.width, height: createForm.height })
}

function isCreateFormValid() {
  return String(createForm.name || '').trim() && Number(createForm.width) > 0 && Number(createForm.height) > 0
}

function setActiveMap(mapId) {
  editorStore.setActiveMap(mapId)
  resetLocalState()
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

function deleteActiveMap() {
  if (!activeMap.value) return
  if (!window.confirm(`確定要刪除地圖「${activeMap.value.name}」嗎？`)) return
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

function handleActiveTextInput() {
  if (!activeShapeObject.value || activeShapeObject.value.type !== 'text') return
  editorStore.updateObjectData({
    objectId: activeShapeObject.value.id,
    data: { content: String(textEditValue.value || '').trim() }
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
function formatStamp(value) {
  if (!value) return '尚未儲存'
  return new Date(value).toLocaleString('zh-TW', { hour12: false })
}

function resolveWorldPoint(event) {
  const svgElement = svgRef.value
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

function applyPolylineSnap(point, points = []) {
  if (!point) return null
  const nextPoint = { ...point }
  const lastPoint = points.at(-1)
  const firstPoint = points[0]

  if (lastPoint) {
    const dx = Math.abs(nextPoint.x - lastPoint.x)
    const dy = Math.abs(nextPoint.y - lastPoint.y)
    if (dx <= SNAP_THRESHOLD && dx <= dy) nextPoint.x = lastPoint.x
    if (dy <= SNAP_THRESHOLD && dy < dx) nextPoint.y = lastPoint.y
  }

  if (firstPoint && points.length >= 2) {
    const firstDx = Math.abs(nextPoint.x - firstPoint.x)
    const firstDy = Math.abs(nextPoint.y - firstPoint.y)
    if (firstDx <= SNAP_THRESHOLD) nextPoint.x = firstPoint.x
    if (firstDy <= SNAP_THRESHOLD) nextPoint.y = firstPoint.y
  }

  return nextPoint
}

function resolveClosestAxisSnapValue(currentValue, candidates = []) {
  let snappedValue = currentValue
  let closestDistance = Number.POSITIVE_INFINITY

  candidates.forEach(candidate => {
    if (!Number.isFinite(candidate)) return
    const distance = Math.abs(currentValue - candidate)
    if (distance > SNAP_THRESHOLD) return
    if (distance >= closestDistance) return
    snappedValue = candidate
    closestDistance = distance
  })

  return snappedValue
}

function applyPolylineNodeSnap(point, points = [], index = -1) {
  if (!point || !Array.isArray(points) || index < 0 || index >= points.length) return point

  const previousPoint = index > 0 ? points[index - 1] : null
  const nextPoint = index < points.length - 1 ? points[index + 1] : null
  const firstPoint = points[0] || null
  const lastPoint = points.at(-1) || null
  const oppositeEndpoint = index === 0 ? lastPoint : (index === points.length - 1 ? firstPoint : null)

  const axisCandidatesX = [previousPoint?.x, nextPoint?.x, oppositeEndpoint?.x]
  const axisCandidatesY = [previousPoint?.y, nextPoint?.y, oppositeEndpoint?.y]

  return {
    x: Number(resolveClosestAxisSnapValue(point.x, axisCandidatesX).toFixed(2)),
    y: Number(resolveClosestAxisSnapValue(point.y, axisCandidatesY).toFixed(2))
  }
}

function normalizeBoxFromPoints(start, end) {
  const safeStart = start || { x: 0, y: 0 }
  const safeEnd = end || safeStart
  return {
    x: Number(Math.min(safeStart.x, safeEnd.x).toFixed(2)),
    y: Number(Math.min(safeStart.y, safeEnd.y).toFixed(2)),
    width: Number(Math.abs(safeEnd.x - safeStart.x).toFixed(2)),
    height: Number(Math.abs(safeEnd.y - safeStart.y).toFixed(2))
  }
}

function getObjectBox(object) {
  if (!object?.data) return null
  return {
    x: Number(object.data.x || 0),
    y: Number(object.data.y || 0),
    width: Number(object.data.width || 0),
    height: Number(object.data.height || 0)
  }
}

function getObjectRotation(object) {
  return Number(object?.data?.rotation || 0)
}

function getObjectCenter(object) {
  const box = getObjectBox(object)
  if (!box) return null
  return {
    x: Number((box.x + box.width / 2).toFixed(2)),
    y: Number((box.y + box.height / 2).toFixed(2))
  }
}

function buildRotateTransform(rotation, center) {
  if (!center || !rotation) return ''
  return `rotate(${rotation} ${center.x} ${center.y})`
}

function buildObjectTransform(object) {
  const center = getObjectCenter(object)
  const rotation = getObjectRotation(object)
  return buildRotateTransform(rotation, center)
}

function rotatePoint(point, center, rotation) {
  if (!point || !center || !rotation) return point
  const radians = rotation * Math.PI / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const dx = point.x - center.x
  const dy = point.y - center.y
  return {
    x: Number((center.x + dx * cos - dy * sin).toFixed(2)),
    y: Number((center.y + dx * sin + dy * cos).toFixed(2))
  }
}

function resolveRotationFromPoint(center, point) {
  if (!center || !point) return 0
  return Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI
}

function normalizeRotation(rotation) {
  let nextRotation = Number(rotation || 0)
  while (nextRotation > 180) nextRotation -= 360
  while (nextRotation <= -180) nextRotation += 360
  return Number(nextRotation.toFixed(2))
}

function applyRotationSnap(rotation) {
  const normalizedRotation = normalizeRotation(rotation)
  const snappedRotation = Math.round(normalizedRotation / ROTATION_SNAP_STEP) * ROTATION_SNAP_STEP
  if (Math.abs(normalizedRotation - snappedRotation) > ROTATION_SNAP_THRESHOLD) {
    return normalizedRotation
  }
  return normalizeRotation(snappedRotation)
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
  const raw = window.prompt('請輸入文字內容', '區域標示')
  if (raw === null) return
  const content = String(raw).trim()
  if (!content) return
  editorStore.createObject({
    type: 'text',
    data: { x: point.x, y: point.y, width: DEFAULT_TEXT_WIDTH, height: DEFAULT_TEXT_HEIGHT, content, rotation: 0 }
  })
}

function handleSvgClick(event) {
  if (didPan.value) {
    didPan.value = false
    return
  }
  if (state.value.mode !== 'edit' || state.value.workingMode !== 'map' || !activeMap.value) return
  if (state.value.activeTool === 'text' && !state.value.toolbarLocked) {
    createTextObject(event)
    return
  }
  if (!isPolylineDrawing.value) return
  const point = applyPolylineSnap(resolveWorldPoint(event), pendingPolyline.value)
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
}

function handleWindowKeydown(event) {
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
    }
    return
  }

  if (isPolylineDrawing.value && event.key === 'Enter') {
    event.preventDefault()
    commitPendingPolyline()
    return
  }

  if (!activeObject.value) return
  if (event.key === 'Delete' || event.key === 'Backspace') {
    event.preventDefault()
    if (activePolyline.value && Number.isInteger(selectedNodeIndex.value)) {
      deleteSelectedNode()
      return
    }
    deleteActiveObject()
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
    const nextRotation = applyRotationSnap(dragState.value.startRotation + currentAngle - dragState.value.startAngle)
    editorStore.updateObjectData({
      objectId: dragState.value.objectId,
      data: { rotation: nextRotation }
    })
  }
}

function handleWindowPointerUp() {
  if (pendingShape.value) commitPendingShape()
  dragState.value = null
}

function polylinePointsToString(points = []) {
  return points.map(point => `${point.x},${point.y}`).join(' ')
}

function selectObject(objectId) {
  if (isPolylineDrawing.value) return
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


watch(activeMap, map => {
  mapMetaForm.name = String(map?.name || '')
  mapMetaForm.width = Number(map?.width || 1200)
  mapMetaForm.height = Number(map?.height || 800)
}, { immediate: true })

watch(activeShapeObject, object => {
  textEditValue.value = object?.type === 'text' ? String(object.data?.content || '') : ''
}, { immediate: true })
watch(activeObjectOrder, order => {
  objectLayerOrder.value = order ? String(order) : ''
}, { immediate: true })

onMounted(() => {
  window.addEventListener('keydown', handleWindowKeydown)
  window.addEventListener('pointermove', handleWindowPointerMove)
  window.addEventListener('pointerup', handleWindowPointerUp)
})

onBeforeUnmount(() => {
  window.removeEventListener('keydown', handleWindowKeydown)
  window.removeEventListener('pointermove', handleWindowPointerMove)
  window.removeEventListener('pointerup', handleWindowPointerUp)
})
</script>
<template lang="pug">
.map-editor-page
  section.editor-shell
    main.editor-main
      section.workspace-card(v-if="activeMap")
        .workspace-card__topbar
          p.eyebrow 地圖管理
          .workspace-map-top-actions
            .workspace-map-selector
              select.workspace-map-select(:value="state.activeMapId || ''" @change="setActiveMap($event.target.value)")
                option(v-for="map in state.maps" :key="map.id" :value="map.id") {{ `${map.name}${state.dirtyMapIds.includes(map.id) ? '（未儲存）' : ''}` }}
            button.primary-button.primary-button--add-map(type="button" @click="openCreateMapForm") 新增地圖
        .workspace-card__head
          .workspace-corner-controls
            .workspace-view-controls
              button.ghost-button(type="button" @click="zoomOut") -
              button.workspace-view-scale(type="button" @click="resetZoom") {{ scalePercent }}
              button.ghost-button(type="button" @click="zoomIn") +
          .workspace-map-summary
            input.workspace-map-name-input(type="text" v-model="mapMetaForm.name" placeholder="地圖名稱")
            .workspace-map-size-form
              input.workspace-map-size-input(type="number" min="1" step="1" v-model="mapMetaForm.width")
              span.workspace-map-size-separator x
              input.workspace-map-size-input(type="number" min="1" step="1" v-model="mapMetaForm.height")
              button.ghost-button(type="button" @click="submitMapMeta") 套用
              span.workspace-inline-divider(aria-hidden="true")
              button.ghost-button(type="button" @click="saveDraft" :disabled="!activeMap") 草稿存檔
              button.primary-button(type="button" @click="saveFinal" :disabled="!activeMap") 正式儲存
              button.danger-button(type="button" @click="deleteActiveMap" :disabled="!activeMap") 刪除
          .workspace-head-toolbar
            .tool-chips
              button.tool-chip(
                v-for="tool in toolOptions"
                :key="tool.id"
                type="button"
                :class="{ 'is-active': state.activeTool === tool.id }"
                :disabled="state.mode !== 'edit' || state.workingMode !== 'map' || !activeMap || state.toolbarLocked"
                @click="setTool(tool.id)"
              ) {{ tool.label }}
            .toolbar-group.workspace-object-actions(v-if="activeObject")
              .workspace-layer-control
                input.workspace-layer-input(type="number" min="1" :max="mapObjects.length" v-model="objectLayerOrder" @change="applyActiveObjectLayerOrder" placeholder="層級")
                button.workspace-layer-apply(type="button" @click="applyActiveObjectLayerOrder") 套用層級
              input.workspace-text-edit-input(v-if="activeShapeObject && activeShapeObject.type === 'text'" type="text" v-model="textEditValue" @input="handleActiveTextInput" placeholder="輸入文字內容")
        .workspace-surface(ref="workspaceSurfaceRef" :class="{ 'is-pannable': canPanSurface, 'is-panning': dragState?.kind === 'pan' }")
          .workspace-grid(:style="{ '--map-width': `${activeMap.width * viewScale}px`, '--map-height': `${activeMap.height * viewScale}px` }")
            svg.workspace-svg(
              ref="svgRef"
              :viewBox="`0 0 ${activeMap.width} ${activeMap.height}`"
              role="img"
              aria-label="地圖編輯區"
              @click="handleSvgClick"
              @pointerdown="handleSvgPointerDown"
              @mousemove="handleSvgMove"
              @mouseleave="handleSvgLeave"
              @dblclick="handleSvgDoubleClick"
            )
              defs
                pattern#map-grid-pattern(width="40" height="40" patternUnits="userSpaceOnUse")
                  path(d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(90, 106, 123, 0.18)" stroke-width="1")
              rect(x="0" y="0" :width="activeMap.width" :height="activeMap.height" fill="#fffdf7")
              rect(x="0" y="0" :width="activeMap.width" :height="activeMap.height" fill="url(#map-grid-pattern)" @pointerdown="handleBackgroundPointerDown")
              g.map-layer
                template(v-for="item in mapPolylines" :key="item.id")
                  polyline.map-polyline-hit(:points="polylinePointsToString(item.data.points || [])" @click.stop="selectPolyline(item.id)")
                  polyline.map-polyline(:class="{ 'is-active': item.id === state.activeObjectId }" :points="polylinePointsToString(item.data.points || [])" @click.stop="selectPolyline(item.id)")
                template(v-for="item in drawableObjects" :key="item.id")
                  template(v-if="item.type === 'rect'")
                    g(:transform="buildObjectTransform(item)")
                      rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                      rect.map-shape(:class="{ 'is-active': item.id === state.activeObjectId }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                  template(v-else-if="item.type === 'circle'")
                    g(:transform="buildObjectTransform(item)")
                      ellipse.map-shape-hit(:cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                      ellipse.map-shape.map-shape--circle(:class="{ 'is-active': item.id === state.activeObjectId }" :cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                  template(v-else-if="item.type === 'text'")
                    g(:transform="buildObjectTransform(item)")
                      rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                      rect.map-text-box(:class="{ 'is-active': item.id === state.activeObjectId }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)")
                      text.map-text(:class="{ 'is-active': item.id === state.activeObjectId }" :x="item.data.x + item.data.width / 2" :y="item.data.y + item.data.height / 2" text-anchor="middle" dominant-baseline="middle" @click.stop="selectObject(item.id)" @pointerdown.stop="startObjectMove(item, $event)") {{ item.data.content }}
                template(v-if="activePolyline")
                  line.map-segment-hit(v-for="segment in activePolylineSegments" :key="`segment-${segment.index}`" :x1="segment.start.x" :y1="segment.start.y" :x2="segment.end.x" :y2="segment.end.y" @click.stop="insertPointAtSegment(segment.index, $event)")
                  g.map-polyline-move-control(v-if="activePolylineCenter" @pointerdown.stop="startPolylineMove($event)")
                    circle.map-polyline-move-control__dot(:cx="activePolylineCenter.x" :cy="activePolylineCenter.y" r="10")
                    text.map-polyline-move-control__label(:x="activePolylineCenter.x" :y="activePolylineCenter.y" text-anchor="middle" dominant-baseline="middle") +
                  circle.map-point.map-point--active(v-for="(point, index) in activePolylinePoints" :key="`active-${index}`" :class="{ 'is-selected': selectedNodeIndex === index }" :cx="point.x" :cy="point.y" r="6" @click.stop="selectNode(index, $event)" @pointerdown.stop="startNodeDrag(index, $event)")
                template(v-if="activeShapeObject && activeObjectBox")
                  g(:transform="activeObjectTransform")
                    rect.map-selection-box(:x="activeObjectBox.x" :y="activeObjectBox.y" :width="activeObjectBox.width" :height="activeObjectBox.height" rx="10" ry="10")
                  circle.map-resize-handle(v-for="handle in activeObjectHandles" :key="handle.key" :cx="handle.x" :cy="handle.y" r="6" @pointerdown.stop="startResize(handle.key, $event)")
                  circle.map-rotate-handle(v-if="activeObjectRotateHandle" :cx="activeObjectRotateHandle.x" :cy="activeObjectRotateHandle.y" r="6" @pointerdown.stop="startRotate($event)")
                template(v-if="pendingShape")
                  rect.map-shape.map-shape--draft(v-if="pendingShape.type === 'rect'" :x="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).x" :y="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).y" :width="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).width" :height="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).height" rx="10" ry="10")
                  ellipse.map-shape.map-shape--draft(v-else-if="pendingShape.type === 'circle'" :cx="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).x + normalizeBoxFromPoints(pendingShape.start, pendingShape.current).width / 2" :cy="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).y + normalizeBoxFromPoints(pendingShape.start, pendingShape.current).height / 2" :rx="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).width / 2" :ry="normalizeBoxFromPoints(pendingShape.start, pendingShape.current).height / 2")
                polyline.map-polyline.map-polyline--draft(v-if="pendingPolyline.length > 0" :points="pendingPolylinePointsString")
                circle.map-point(v-for="(point, index) in pendingPolyline" :key="`pending-${index}`" :cx="point.x" :cy="point.y" r="5")
                circle.map-point.map-point--hover(v-if="hoverWorldPoint && pendingPolyline.length > 0" :cx="hoverWorldPoint.x" :cy="hoverWorldPoint.y" r="4")
            .workspace-overlay
              .overlay-pill SVG Root
              .overlay-pill Map Layer
              .overlay-pill Table Layer
              .overlay-pill UI Layer / Overlay Layer
      section.workspace-card.workspace-card--empty(v-else)
        p.empty-title 尚未選擇地圖
        p.empty-hint 先建立第一張地圖，系統會自動切到 Map Edit Mode。

  .modal-backdrop(v-if="state.isCreateMapFormOpen")
    .modal-card
      .modal-card__head
        div
          p.eyebrow 建立新地圖
          h3 新增地圖
        button.icon-button(type="button" @click="closeCreateMapForm") ×
      .form-grid
        label.form-field
          span 地圖名稱
          input(type="text" v-model="createForm.name" placeholder="例如：一樓內用區")
        label.form-field
          span 地圖寬度
          input(type="number" min="1" step="1" v-model="createForm.width")
        label.form-field
          span 地圖高度
          input(type="number" min="1" step="1" v-model="createForm.height")
      .modal-actions
        button.ghost-button(type="button" @click="closeCreateMapForm") 取消
        button.primary-button(type="button" @click="submitCreateMap" :disabled="!isCreateFormValid()") 建立地圖
</template>

<style lang="sass">
.map-editor-page
  display: grid
  gap: 18px

.editor-shell
  display: grid
  grid-template-columns: minmax(0, 1fr)
  gap: 18px
  align-items: start

.editor-main
  display: grid
  gap: 18px

.workspace-card, .modal-card
  border-radius: 24px
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(19, 56, 63, 0.12)
  box-shadow: 0 22px 60px rgba(37, 27, 14, 0.08)

.workspace-card
  padding: 20px

.workspace-card__head, .modal-card__head, .modal-actions
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.toolbar-group, .status-bar, .workspace-head-toolbar
  display: flex
  gap: 10px
  flex-wrap: wrap

.tool-chips
  display: inline-flex
  gap: 0
  flex-wrap: nowrap
  border: 1px solid rgba(23, 56, 63, 0.14)
  border-radius: 8px
  overflow: hidden
  background: rgba(23, 56, 63, 0.03)

.eyebrow
  margin: 0 0 6px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.workspace-card__head
  position: relative
  display: grid
  gap: 14px

.workspace-card__topbar
  display: flex
  justify-content: space-between
  align-items: center
  gap: 12px

.workspace-map-top-actions
  display: flex
  justify-content: flex-end
  align-items: center
  gap: 12px
  flex-wrap: wrap

.workspace-head-toolbar
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 12px
  flex-wrap: wrap

.workspace-object-actions
  margin-left: auto

.workspace-layer-control
  display: inline-flex
  align-items: stretch
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 8px
  overflow: hidden
  background: #fff

.workspace-layer-input, .workspace-text-edit-input
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 8px
  padding: 4px 8px
  font: inherit
  background: #fff
  color: #243a3e

.workspace-layer-input
  width: 50px
  border: 0
  border-radius: 8px 0 0 8px

  border: 0
  border-radius: 8px 0 0 8px

.workspace-layer-apply
  border: 0
  border-left: 1px solid rgba(19, 56, 63, 0.12)
  border-radius: 0 8px 8px 0
  padding: 4px 10px
  font: inherit
  font-weight: 700
  background: rgba(23, 56, 63, 0.08)
  color: #17383f
  cursor: pointer

.workspace-layer-apply:hover
  background: rgba(23, 56, 63, 0.14)

.workspace-text-edit-input
  min-width: 220px


.workspace-map-summary
  display: flex
  align-items: center
  gap: 12px
  flex-wrap: wrap

.workspace-map-selector
  display: flex
  align-items: center

.workspace-map-select
  min-width: 220px
  max-width: 320px
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 8px
  padding: 4px 8px
  font: inherit
  background: #fff
  color: #243a3e

.workspace-map-name-input
  min-width: 220px
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 8px
  padding: 4px 8px
  font: inherit
  font-size: 20px
  font-weight: 700
  background: #fff
  color: #243a3e

.workspace-map-name-input::placeholder
  color: #8b7c6b


.workspace-map-size-form
  display: flex
  align-items: center
  gap: 8px
  flex-wrap: wrap

.workspace-map-size-input
  width: 88px
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 8px
  padding: 4px 8px
  font: inherit
  background: #fff
  color: #243a3e

.workspace-map-size-separator
  color: #6f5b43
  font-weight: 700

.workspace-inline-divider
  width: 1px
  height: 36px
  background: rgba(19, 56, 63, 0.38)
  align-self: center

h2, .workspace-card h3, .modal-card h3
  margin: 0
  color: #243a3e

.empty-hint
  margin: 0
  color: #6f5b43
  line-height: 1.7

.empty-title
  margin: 0 0 10px
  color: #243a3e

.primary-button, .ghost-button, .danger-button, .tool-chip, .icon-button
  border: 0
  border-radius: 8px
  padding: 4px 8px
  font-weight: 700
  cursor: pointer

.primary-button
  background: #17383f
  color: #fff

.primary-button--add-map
  background: #009688

.ghost-button, .tool-chip
  background: rgba(23, 56, 63, 0.08)
  color: #17383f

.tool-chip
  border-radius: 0
  border-right: 1px solid rgba(23, 56, 63, 0.12)

.tool-chip:first-child
  border-top-left-radius: 8px
  border-bottom-left-radius: 8px

.tool-chip:last-child
  border-top-right-radius: 8px
  border-bottom-right-radius: 8px
  border-right: 0

.danger-button
  background: rgba(164, 67, 44, 0.12)
  color: #a4432c

.ghost-button.is-active, .tool-chip.is-active
  background: #17383f
  color: #fff

.primary-button:disabled, .ghost-button:disabled, .danger-button:disabled, .tool-chip:disabled
  opacity: 0.45
  cursor: not-allowed
.workspace-surface.is-pannable
  cursor: grab

.workspace-surface.is-panning
  cursor: grabbing

.workspace-surface.is-panning .workspace-svg
  cursor: grabbing

.workspace-card
  display: grid
  gap: 18px

.workspace-surface
  position: relative
  padding: 18px
  border-radius: 22px
  background: linear-gradient(180deg, rgba(246, 241, 232, 0.96), rgba(231, 224, 211, 0.92))
  border: 1px solid rgba(140, 90, 31, 0.14)
  overflow: auto

.workspace-grid
  position: relative
  width: min-content
  min-width: 100%

.workspace-corner-controls
  position: absolute
  right: 16px
  bottom: -80px
  z-index: 3
  pointer-events: none

.workspace-view-controls
  display: inline-flex
  gap: 0
  pointer-events: auto
  border-radius: 8px
  overflow: hidden
  border: 1px solid rgba(19, 56, 63, 0.12)
  box-shadow: 0 10px 24px rgba(37, 27, 14, 0.12)

.workspace-view-controls .ghost-button
  border-radius: 0

.workspace-view-scale
  border: 0
  padding: 4px 8px
  font-weight: 700
  cursor: pointer
  background: rgba(255, 255, 255, 0.92)
  color: #17383f
  border-left: 1px solid rgba(19, 56, 63, 0.12)
  border-right: 1px solid rgba(19, 56, 63, 0.12)

.workspace-svg
  display: block
  width: var(--map-width)
  height: var(--map-height)
  border-radius: 18px
  overflow: hidden
  box-shadow: inset 0 0 0 1px rgba(19, 56, 63, 0.12)
  cursor: crosshair

.map-polyline
  fill: none
  stroke: #17383f
  stroke-width: 3
  stroke-linecap: round
  stroke-linejoin: round

.map-polyline.is-active
  stroke: #c06b2d
  stroke-width: 4

.map-polyline-hit
  fill: none
  stroke: transparent
  stroke-width: 18
  cursor: pointer

.map-segment-hit
  stroke: transparent
  stroke-width: 16
  cursor: copy

.map-shape
  fill: rgba(23, 56, 63, 0.12)
  stroke: #17383f
  stroke-width: 2.5
  cursor: move

.map-shape.is-active
  stroke: #c06b2d
  fill: rgba(192, 107, 45, 0.12)

.map-shape-hit
  fill: transparent
  stroke: transparent
  stroke-width: 12
  cursor: pointer

.map-shape--draft
  stroke: #c06b2d
  fill: rgba(192, 107, 45, 0.12)
  stroke-dasharray: 10 8

.map-text-box
  fill: rgba(255, 255, 255, 0.72)
  stroke: rgba(23, 56, 63, 0.2)
  stroke-width: 1.5
  cursor: move

.map-text-box.is-active
  stroke: #c06b2d
  fill: rgba(255, 245, 233, 0.9)

.map-text
  fill: #17383f
  font-size: 18px
  font-weight: 700
  user-select: none
  cursor: move

.map-text.is-active
  fill: #c06b2d

.map-selection-box
  fill: none
  stroke: #c06b2d
  stroke-width: 2
  stroke-dasharray: 8 6
  pointer-events: none

.map-resize-handle
  fill: #fff
  stroke: #c06b2d
  stroke-width: 3
  cursor: nwse-resize

.map-rotate-handle
  fill: #c06b2d
  stroke: #fff
  stroke-width: 3
  cursor: grab

.map-polyline--draft
  stroke: #c06b2d
  stroke-dasharray: 10 8

.map-point
  fill: #17383f
  stroke: #fff
  stroke-width: 2

.map-point--hover
  fill: #c06b2d

.map-point--active
  fill: #fff
  stroke: #c06b2d
  stroke-width: 3
  cursor: grab

.map-point--active.is-selected
  fill: #c06b2d

.map-polyline-move-control
  cursor: grab

.map-polyline-move-control__dot
  fill: rgba(255, 255, 255, 0.94)
  stroke: #c06b2d
  stroke-width: 3

.map-polyline-move-control__label
  fill: #c06b2d
  font-size: 16px
  font-weight: 700
  user-select: none
  pointer-events: none
.workspace-overlay
  position: absolute
  top: 16px
  left: 16px
  display: flex
  gap: 8px
  flex-wrap: wrap
  pointer-events: none

.overlay-pill, .status-bar span
  border-radius: 8px
  background: rgba(255, 255, 255, 0.86)
  border: 1px solid rgba(19, 56, 63, 0.08)
  padding: 6px 10px
  color: #243a3e
  font-size: 12px
  font-weight: 700

.workspace-card--empty
  min-height: 420px
  place-items: center
  text-align: center

.modal-backdrop
  position: fixed
  inset: 0
  background: rgba(22, 16, 11, 0.42)
  display: grid
  place-items: center
  padding: 24px
  z-index: 50

.modal-card
  width: min(520px, 100%)
  padding: 24px
  display: grid
  gap: 18px

.form-grid
  display: grid
  gap: 14px

.form-field
  display: grid
  gap: 8px
  color: #243a3e
  font-weight: 700

.form-field input
  border: 1px solid rgba(19, 56, 63, 0.18)
  border-radius: 14px
  padding: 12px 14px
  font: inherit
  background: #fff

.icon-button
  width: 40px
  height: 40px
  padding: 0
  background: rgba(23, 56, 63, 0.08)
  color: #17383f

@media (max-width: 1080px)
  .editor-shell
    grid-template-columns: 1fr

  .workspace-svg
    max-width: 100%
    height: auto

@media (max-width: 720px)
  .workspace-card__topbar
    flex-direction: column
    align-items: stretch

  .workspace-map-top-actions
    justify-content: stretch

  .workspace-corner-controls
    right: 16px
    bottom: -80px
</style>























