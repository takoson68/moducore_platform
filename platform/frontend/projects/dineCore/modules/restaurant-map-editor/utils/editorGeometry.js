export function formatStamp(value) {
  if (!value) return '尚未儲存'
  return new Date(value).toLocaleString('zh-TW', { hour12: false })
}

export function resolveClosestAxisSnapValue(currentValue, candidates = [], threshold = 14) {
  let snappedValue = currentValue
  let closestDistance = Number.POSITIVE_INFINITY

  candidates.forEach(candidate => {
    if (!Number.isFinite(candidate)) return
    const distance = Math.abs(currentValue - candidate)
    if (distance > threshold) return
    if (distance >= closestDistance) return
    snappedValue = candidate
    closestDistance = distance
  })

  return snappedValue
}

export function applyPolylineSnap(point, points = [], threshold = 14) {
  if (!point) return null
  const nextPoint = { ...point }
  const lastPoint = points.at(-1)
  const firstPoint = points[0]

  if (lastPoint) {
    const dx = Math.abs(nextPoint.x - lastPoint.x)
    const dy = Math.abs(nextPoint.y - lastPoint.y)
    if (dx <= threshold && dx <= dy) nextPoint.x = lastPoint.x
    if (dy <= threshold && dy < dx) nextPoint.y = lastPoint.y
  }

  if (firstPoint && points.length >= 2) {
    const firstDx = Math.abs(nextPoint.x - firstPoint.x)
    const firstDy = Math.abs(nextPoint.y - firstPoint.y)
    if (firstDx <= threshold) nextPoint.x = firstPoint.x
    if (firstDy <= threshold) nextPoint.y = firstPoint.y
  }

  return nextPoint
}

export function applyPolylineNodeSnap(point, points = [], index = -1, threshold = 14) {
  if (!point || !Array.isArray(points) || index < 0 || index >= points.length) return point

  const previousPoint = index > 0 ? points[index - 1] : null
  const nextPoint = index < points.length - 1 ? points[index + 1] : null
  const firstPoint = points[0] || null
  const lastPoint = points.at(-1) || null
  const oppositeEndpoint = index === 0 ? lastPoint : (index === points.length - 1 ? firstPoint : null)

  const axisCandidatesX = [previousPoint?.x, nextPoint?.x, oppositeEndpoint?.x]
  const axisCandidatesY = [previousPoint?.y, nextPoint?.y, oppositeEndpoint?.y]

  return {
    x: Number(resolveClosestAxisSnapValue(point.x, axisCandidatesX, threshold).toFixed(2)),
    y: Number(resolveClosestAxisSnapValue(point.y, axisCandidatesY, threshold).toFixed(2))
  }
}

export function normalizeBoxFromPoints(start, end) {
  const safeStart = start || { x: 0, y: 0 }
  const safeEnd = end || safeStart
  return {
    x: Number(Math.min(safeStart.x, safeEnd.x).toFixed(2)),
    y: Number(Math.min(safeStart.y, safeEnd.y).toFixed(2)),
    width: Number(Math.abs(safeEnd.x - safeStart.x).toFixed(2)),
    height: Number(Math.abs(safeEnd.y - safeStart.y).toFixed(2))
  }
}

export function getObjectBox(object) {
  if (!object?.data) return null
  return {
    x: Number(object.data.x || 0),
    y: Number(object.data.y || 0),
    width: Number(object.data.width || 0),
    height: Number(object.data.height || 0)
  }
}

export function getObjectRotation(object) {
  return Number(object?.data?.rotation || 0)
}

export function getObjectCenter(object) {
  const box = getObjectBox(object)
  if (!box) return null
  return {
    x: Number((box.x + box.width / 2).toFixed(2)),
    y: Number((box.y + box.height / 2).toFixed(2))
  }
}

export function buildRotateTransform(rotation, center) {
  if (!center || !rotation) return ''
  return `rotate(${rotation} ${center.x} ${center.y})`
}

export function buildObjectTransform(object) {
  const center = getObjectCenter(object)
  const rotation = getObjectRotation(object)
  return buildRotateTransform(rotation, center)
}

export function rotatePoint(point, center, rotation) {
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

export function resolveRotationFromPoint(center, point) {
  if (!center || !point) return 0
  return Math.atan2(point.y - center.y, point.x - center.x) * 180 / Math.PI
}

export function normalizeRotation(rotation) {
  let nextRotation = Number(rotation || 0)
  while (nextRotation > 180) nextRotation -= 360
  while (nextRotation <= -180) nextRotation += 360
  return Number(nextRotation.toFixed(2))
}

export function applyRotationSnap(rotation, step = 15, threshold = 6) {
  const normalizedRotation = normalizeRotation(rotation)
  const snappedRotation = Math.round(normalizedRotation / step) * step
  if (Math.abs(normalizedRotation - snappedRotation) > threshold) {
    return normalizedRotation
  }
  return normalizeRotation(snappedRotation)
}

export function polylinePointsToString(points = []) {
  return points.map(point => `${point.x},${point.y}`).join(' ')
}