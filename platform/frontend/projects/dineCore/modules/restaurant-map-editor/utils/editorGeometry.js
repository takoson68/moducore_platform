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

function normalizePoint(point = {}) {
  return {
    x: Number(point.x || 0),
    y: Number(point.y || 0)
  }
}

export function normalizePolylineSegments(points = [], segments = []) {
  const segmentCount = Math.max(0, points.length - 1)
  const sourceSegments = Array.isArray(segments) ? segments : []

  return Array.from({ length: segmentCount }, (_, index) => {
    const segment = sourceSegments[index]
    if (segment?.type === 'quadratic' && segment.control) {
      return {
        type: 'quadratic',
        control: normalizePoint(segment.control)
      }
    }

    return { type: 'line' }
  })
}

export function buildPolylinePath(points = [], segments = []) {
  if (!Array.isArray(points) || points.length === 0) return ''

  const normalizedSegments = normalizePolylineSegments(points, segments)
  const commands = [`M ${points[0].x} ${points[0].y}`]

  for (let index = 0; index < points.length - 1; index += 1) {
    const end = points[index + 1]
    const segment = normalizedSegments[index]
    if (segment?.type === 'quadratic' && segment.control) {
      commands.push(`Q ${segment.control.x} ${segment.control.y} ${end.x} ${end.y}`)
      continue
    }

    commands.push(`L ${end.x} ${end.y}`)
  }

  return commands.join(' ')
}

export function buildPolylineSegmentPath(start, end, segment = {}) {
  if (!start || !end) return ''
  if (segment?.type === 'quadratic' && segment.control) {
    return `M ${start.x} ${start.y} Q ${segment.control.x} ${segment.control.y} ${end.x} ${end.y}`
  }
  return `M ${start.x} ${start.y} L ${end.x} ${end.y}`
}

export function getQuadraticPointAt(start, control, end, t = 0.5) {
  const safeT = Math.max(0, Math.min(1, Number(t || 0)))
  const inverse = 1 - safeT
  return {
    x: Number((inverse * inverse * start.x + 2 * inverse * safeT * control.x + safeT * safeT * end.x).toFixed(2)),
    y: Number((inverse * inverse * start.y + 2 * inverse * safeT * control.y + safeT * safeT * end.y).toFixed(2))
  }
}

export function getPolylineSegmentHandlePoint(start, end, segment = {}) {
  if (!start || !end) return null
  if (segment?.type === 'quadratic' && segment.control) {
    return getQuadraticPointAt(start, segment.control, end, 0.5)
  }

  return {
    x: Number(((start.x + end.x) / 2).toFixed(2)),
    y: Number(((start.y + end.y) / 2).toFixed(2))
  }
}

export function getQuadraticControlFromHandlePoint(start, end, handlePoint) {
  if (!start || !end || !handlePoint) return null
  return {
    x: Number((2 * handlePoint.x - 0.5 * start.x - 0.5 * end.x).toFixed(2)),
    y: Number((2 * handlePoint.y - 0.5 * start.y - 0.5 * end.y).toFixed(2))
  }
}

export function applyCurveHandleSnap(point, start, end, threshold = 14) {
  if (!point || !start || !end) return point

  const midpoint = {
    x: Number(((start.x + end.x) / 2).toFixed(2)),
    y: Number(((start.y + end.y) / 2).toFixed(2))
  }

  return {
    x: Number(resolveClosestAxisSnapValue(point.x, [midpoint.x, start.x, end.x], threshold).toFixed(2)),
    y: Number(resolveClosestAxisSnapValue(point.y, [midpoint.y, start.y, end.y], threshold).toFixed(2))
  }
}

export function constrainCurveHandlePoint(point, start, end) {
  if (!point || !start || !end) return point

  const midpoint = {
    x: (start.x + end.x) / 2,
    y: (start.y + end.y) / 2
  }
  const dx = point.x - midpoint.x
  const dy = point.y - midpoint.y
  const distance = Math.hypot(dx, dy)
  const segmentLength = Math.hypot(end.x - start.x, end.y - start.y)
  const maxDistance = Math.max(48, Math.min(180, segmentLength * 0.85))

  if (!distance || distance <= maxDistance) {
    return {
      x: Number(point.x.toFixed(2)),
      y: Number(point.y.toFixed(2))
    }
  }

  const scale = maxDistance / distance
  return {
    x: Number((midpoint.x + dx * scale).toFixed(2)),
    y: Number((midpoint.y + dy * scale).toFixed(2))
  }
}

export function projectPointToPolylineSegment(point, start, end, segment = {}) {
  if (!point || !start || !end) return null

  if (segment?.type === 'quadratic' && segment.control) {
    const steps = 48
    let bestPoint = start
    let bestT = 0
    let bestDistance = Number.POSITIVE_INFINITY

    for (let step = 0; step <= steps; step += 1) {
      const t = step / steps
      const candidate = getQuadraticPointAt(start, segment.control, end, t)
      const dx = point.x - candidate.x
      const dy = point.y - candidate.y
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        bestPoint = candidate
        bestT = t
      }
    }

    return { point: bestPoint, t: Number(bestT.toFixed(4)) }
  }

  const dx = end.x - start.x
  const dy = end.y - start.y
  const lengthSquared = dx * dx + dy * dy
  if (lengthSquared === 0) {
    return { point: normalizePoint(start), t: 0 }
  }

  const t = ((point.x - start.x) * dx + (point.y - start.y) * dy) / lengthSquared
  const clamped = Math.max(0, Math.min(1, t))

  return {
    point: {
      x: Number((start.x + dx * clamped).toFixed(2)),
      y: Number((start.y + dy * clamped).toFixed(2))
    },
    t: Number(clamped.toFixed(4))
  }
}

export function splitQuadraticSegment(start, control, end, t = 0.5) {
  const safeT = Math.max(0.05, Math.min(0.95, Number(t || 0.5)))
  const leftBridge = {
    x: Number((start.x + (control.x - start.x) * safeT).toFixed(2)),
    y: Number((start.y + (control.y - start.y) * safeT).toFixed(2))
  }
  const rightBridge = {
    x: Number((control.x + (end.x - control.x) * safeT).toFixed(2)),
    y: Number((control.y + (end.y - control.y) * safeT).toFixed(2))
  }
  const anchor = {
    x: Number((leftBridge.x + (rightBridge.x - leftBridge.x) * safeT).toFixed(2)),
    y: Number((leftBridge.y + (rightBridge.y - leftBridge.y) * safeT).toFixed(2))
  }

  return {
    anchor,
    segments: [
      {
        type: 'quadratic',
        control: leftBridge
      },
      {
        type: 'quadratic',
        control: rightBridge
      }
    ]
  }
}
