import world from '@/world.js'

const STORAGE_KEY = 'dinecore-restaurant-map-editor-draft-v1'

function canUseStorage() {
  return typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'
}

function cloneValue(value) {
  return JSON.parse(JSON.stringify(value))
}

function createMapRecord(payload = {}, sequence = 1) {
  const width = Number(payload.width || 0)
  const height = Number(payload.height || 0)
  const name = String(payload.name || '').trim()
  const tablePrefix = String(payload.tablePrefix || '').trim()
  const stamp = new Date().toISOString()

  return {
    id: `map_${Date.now()}_${sequence}`,
    name,
    width,
    height,
    tablePrefix,
    objects: [],
    tables: [],
    createdAt: stamp,
    updatedAt: stamp,
    savedAt: '',
    draftSavedAt: ''
  }
}

function createDefaultDraftState() {
  return {
    pendingPolyline: [],
    pendingShape: null,
    pendingText: null
  }
}

function createBaseState() {
  return {
    maps: [],
    activeMapId: null,
    isCreateMapFormOpen: false,
    mode: 'view',
    workingMode: 'map',
    activeTool: '',
    activeObjectId: null,
    activeTableId: null,
    selectedObjectIds: [],
    selectedTableIds: [],
    toolbarLocked: false,
    draftState: createDefaultDraftState(),
    dirtyMapIds: [],
    sequence: 0,
    objectSequence: 0,
    lastSavedDraftAt: '',
    lastSavedFinalAt: ''
  }
}

function normalizePoint(point = {}) {
  return {
    x: Number(point.x || 0),
    y: Number(point.y || 0)
  }
}

function normalizeDraftState(draftState = {}) {
  return {
    pendingPolyline: Array.isArray(draftState.pendingPolyline) ? draftState.pendingPolyline.map(normalizePoint) : [],
    pendingShape: draftState.pendingShape && typeof draftState.pendingShape === 'object' ? draftState.pendingShape : null,
    pendingText: draftState.pendingText && typeof draftState.pendingText === 'object' ? draftState.pendingText : null
  }
}

function normalizePolylineSegments(points = [], segments = []) {
  const sourceSegments = Array.isArray(segments) ? segments : []
  return Array.from({ length: Math.max(0, points.length - 1) }, (_, index) => {
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

function normalizePolylineData(data = {}) {
  const points = Array.isArray(data.points) ? data.points.map(normalizePoint) : []
  return {
    ...cloneValue(data),
    points,
    segments: normalizePolylineSegments(points, data.segments)
  }
}

function normalizeObject(item = {}) {
  const type = String(item.type || '')
  return {
    id: String(item.id || ''),
    type,
    data: item.data && typeof item.data === 'object'
      ? (type === 'polyline' ? normalizePolylineData(item.data) : cloneValue(item.data))
      : {},
    createdAt: String(item.createdAt || ''),
    updatedAt: String(item.updatedAt || '')
  }
}

function normalizeMap(map = {}) {
  return {
    id: String(map.id || ''),
    name: String(map.name || ''),
    width: Number(map.width || 0),
    height: Number(map.height || 0),
    tablePrefix: String(map.tablePrefix || '').trim(),
    objects: Array.isArray(map.objects) ? map.objects.map(normalizeObject) : [],
    tables: Array.isArray(map.tables) ? map.tables.map(normalizeTable) : [],
    createdAt: String(map.createdAt || ''),
    updatedAt: String(map.updatedAt || ''),
    savedAt: String(map.savedAt || ''),
    draftSavedAt: String(map.draftSavedAt || '')
  }
}

function normalizeTable(table = {}) {
  return {
    ...cloneValue(table),
    id: String(table.id || ''),
    label: String(table.label || '').trim(),
    note: String(table.note || '').trim(),
    x: Number(table.x || 0),
    y: Number(table.y || 0),
    width: Number(table.width || 80),
    height: Number(table.height || 80),
    rotation: Number(table.rotation || 0),
    createdAt: String(table.createdAt || ''),
    updatedAt: String(table.updatedAt || '')
  }
}

function formatTableLabel(prefix = '', sequence = 1) {
  return `${String(prefix || '').trim()}${String(sequence).padStart(2, '0')}`
}

function relabelTables(tables = [], prefix = '') {
  return (Array.isArray(tables) ? tables : []).map((table, index) => ({
    ...normalizeTable(table),
    label: formatTableLabel(prefix, index + 1)
  }))
}

function clampTablePosition(data = {}, map = null) {
  const width = Number(data.width || 80)
  const height = Number(data.height || 80)
  const maxX = Math.max(0, Number(map?.width || width) - width)
  const maxY = Math.max(0, Number(map?.height || height) - height)

  return {
    ...data,
    x: Number(Math.max(0, Math.min(maxX, Number(data.x || 0))).toFixed(2)),
    y: Number(Math.max(0, Math.min(maxY, Number(data.y || 0))).toFixed(2))
  }
}

function markDirty(state, mapId) {
  return [...new Set([...(state.dirtyMapIds || []), mapId])]
}

function nextObjectId(state) {
  return {
    objectSequence: Number(state.objectSequence || 0) + 1,
    id: `obj_${Number(state.objectSequence || 0) + 1}`
  }
}

function buildPersistedState(state = {}) {
  return {
    maps: Array.isArray(state.maps) ? cloneValue(state.maps) : [],
    activeMapId: state.activeMapId || null,
    mode: state.mode || 'view',
    workingMode: state.workingMode || 'map',
    activeTool: state.activeTool || '',
    activeObjectId: state.activeObjectId || null,
    activeTableId: state.activeTableId || null,
    selectedObjectIds: Array.isArray(state.selectedObjectIds) ? [...state.selectedObjectIds] : [],
    selectedTableIds: Array.isArray(state.selectedTableIds) ? [...state.selectedTableIds] : [],
    toolbarLocked: Boolean(state.toolbarLocked),
    draftState: normalizeDraftState(state.draftState),
    dirtyMapIds: Array.isArray(state.dirtyMapIds) ? [...state.dirtyMapIds] : [],
    sequence: Number(state.sequence || 0),
    objectSequence: Number(state.objectSequence || 0),
    lastSavedDraftAt: String(state.lastSavedDraftAt || ''),
    lastSavedFinalAt: String(state.lastSavedFinalAt || '')
  }
}

function persistDraftState(state = {}) {
  if (!canUseStorage()) return
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(buildPersistedState(state)))
}

function loadPersistedState() {
  const base = createBaseState()
  if (!canUseStorage()) return base

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return base

    const parsed = JSON.parse(raw)
    const maps = Array.isArray(parsed.maps) ? parsed.maps.map(normalizeMap).filter(map => map.id) : []
    const activeMapId = maps.some(map => map.id === parsed.activeMapId) ? parsed.activeMapId : maps[0]?.id || null

    return {
      ...base,
      maps,
      activeMapId,
      mode: activeMapId ? String(parsed.mode || 'view') : 'view',
      workingMode: String(parsed.workingMode || 'map'),
      activeTool: String(parsed.activeTool || ''),
      activeObjectId: String(parsed.activeObjectId || '') || null,
      activeTableId: String(parsed.activeTableId || '') || null,
      selectedObjectIds: Array.isArray(parsed.selectedObjectIds) ? parsed.selectedObjectIds.map(id => String(id || '')).filter(Boolean) : [],
      selectedTableIds: Array.isArray(parsed.selectedTableIds) ? parsed.selectedTableIds.map(id => String(id || '')).filter(Boolean) : [],
      toolbarLocked: Boolean(parsed.toolbarLocked),
      draftState: normalizeDraftState(parsed.draftState),
      dirtyMapIds: Array.isArray(parsed.dirtyMapIds) ? parsed.dirtyMapIds.filter(id => maps.some(map => map.id === id)) : [],
      sequence: Number(parsed.sequence || maps.length || 0),
      objectSequence: Number(parsed.objectSequence || 0),
      lastSavedDraftAt: String(parsed.lastSavedDraftAt || ''),
      lastSavedFinalAt: String(parsed.lastSavedFinalAt || '')
    }
  } catch {
    return base
  }
}

export function createRestaurantMapEditorStore() {
  return world.createStore({
    name: 'dineCoreRestaurantMapEditorStore',
    defaultValue: loadPersistedState(),
    actions: {
      openCreateMapForm(store) {
        store.set({ ...store.get(), isCreateMapFormOpen: true })
      },
      closeCreateMapForm(store) {
        store.set({ ...store.get(), isCreateMapFormOpen: false })
      },
      createMap(store, payload = {}) {
        const state = store.get()
        const sequence = Number(state.sequence || 0) + 1
        const map = createMapRecord(payload, sequence)

        store.set({
          ...state,
          sequence,
          maps: [...state.maps, map],
          activeMapId: map.id,
          isCreateMapFormOpen: false,
          mode: 'edit',
          workingMode: 'map',
          activeTool: '',
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds: [],
          selectedTableIds: [],
          toolbarLocked: false,
          draftState: createDefaultDraftState(),
          dirtyMapIds: markDirty(state, map.id)
        })
      },
      setActiveMap(store, mapId) {
        const state = store.get()
        if (!state.maps.some(map => map.id === mapId)) return

        store.set({
          ...state,
          activeMapId: mapId,
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds: [],
          selectedTableIds: [],
          activeTool: '',
          toolbarLocked: false,
          draftState: createDefaultDraftState()
        })
      },
      updateMapMeta(store, payload = {}) {
        const state = store.get()
        const mapId = String(payload.mapId || state.activeMapId || '')
        const name = String(payload.name || '').trim()
        const width = Number(payload.width || 0)
        const height = Number(payload.height || 0)
        const tablePrefix = String(payload.tablePrefix || '').trim()
        if (!mapId || !width || !height) return

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === mapId
              ? {
                  ...map,
                  name: name || map.name,
                  width,
                  height,
                  tablePrefix,
                  tables: relabelTables(map.tables, tablePrefix),
                  updatedAt: stamp
                }
              : map
          )),
          dirtyMapIds: markDirty(state, mapId)
        })
      },
      hydrateMap(store, payload = {}) {
        const state = store.get()
        const map = payload.map && typeof payload.map === 'object' ? normalizeMap(payload.map) : null
        if (!map || !map.id) return

        store.set({
          ...state,
          maps: state.maps.map(item => (item.id === map.id ? map : item))
        })
      },
      hydrateDraftSession(store, payload = {}) {
        const state = store.get()
        const draftState = normalizeDraftState(payload.draftState)
        const mode = String(payload.mode || payload.draftState?.mode || state.mode || 'view')
        const workingMode = String(payload.workingMode || payload.draftState?.workingMode || state.workingMode || 'map')
        const activeTool = String(payload.activeTool || payload.draftState?.tool || state.activeTool || '')
        const activeObjectId = String(payload.activeObjectId || payload.draftState?.activeObjectId || '') || null
        const activeTableId = String(payload.activeTableId || payload.draftState?.activeTableId || '') || null
        const selectedObjectIds = Array.isArray(payload.selectedObjectIds) ? payload.selectedObjectIds.map(id => String(id || '')).filter(Boolean) : (activeObjectId ? [activeObjectId] : [])
        const selectedTableIds = Array.isArray(payload.selectedTableIds) ? payload.selectedTableIds.map(id => String(id || '')).filter(Boolean) : (activeTableId ? [activeTableId] : [])
        const toolbarLocked = Boolean(payload.toolbarLocked ?? payload.draftState?.toolbarLocked ?? state.toolbarLocked)

        store.set({
          ...state,
          mode,
          workingMode,
          activeTool,
          activeObjectId,
          activeTableId,
          selectedObjectIds,
          selectedTableIds,
          toolbarLocked,
          draftState
        })
      },
      mergeMapsFromBackend(store, payload = {}) {
        const state = store.get()
        const incomingMaps = Array.isArray(payload.maps) ? payload.maps.map(normalizeMap).filter(map => map.id) : []
        if (!incomingMaps.length) return

        const localMaps = Array.isArray(state.maps) ? state.maps : []
        const dirtyIds = new Set(Array.isArray(state.dirtyMapIds) ? state.dirtyMapIds : [])
        const localMapById = new Map(localMaps.map(map => [map.id, map]))
        const mergedMaps = incomingMaps.map(map => {
          const localMap = localMapById.get(map.id)
          if (localMap && dirtyIds.has(map.id)) return localMap
          return localMap ? { ...localMap, ...map, objects: localMap.objects, tables: localMap.tables } : map
        })



        for (const localMap of localMaps) {
          if (!incomingMaps.some(map => map.id === localMap.id)) {
            mergedMaps.push(localMap)
          }
        }

        const activeMapId = mergedMaps.some(map => map.id === state.activeMapId)
          ? state.activeMapId
          : (mergedMaps[0]?.id || null)

        store.set({
          ...state,
          maps: mergedMaps,
          activeMapId,
          mode: activeMapId ? state.mode : 'view'
        })
      },
      deleteMap(store, mapId) {
        const state = store.get()
        const nextMaps = state.maps.filter(map => map.id !== mapId)
        const activeMapId = state.activeMapId === mapId ? nextMaps[0]?.id || null : state.activeMapId

        store.set({
          ...state,
          maps: nextMaps,
          activeMapId,
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds: [],
          selectedTableIds: [],
          activeTool: '',
          toolbarLocked: false,
          draftState: createDefaultDraftState(),
          dirtyMapIds: state.dirtyMapIds.filter(id => id !== mapId),
          mode: activeMapId ? state.mode : 'view',
          workingMode: activeMapId ? state.workingMode : 'map'
        })
      },
      setMode(store, mode) {
        const state = store.get()
        store.set({
          ...state,
          mode,
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds: [],
          selectedTableIds: [],
          activeTool: '',
          toolbarLocked: false,
          draftState: createDefaultDraftState()
        })
      },
      setWorkingMode(store, workingMode) {
        const state = store.get()
        store.set({
          ...state,
          workingMode,
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds: [],
          selectedTableIds: [],
          activeTool: '',
          toolbarLocked: false,
          draftState: createDefaultDraftState()
        })
      },
      setActiveTool(store, activeTool = '') {
        const state = store.get()
        if (state.toolbarLocked) return
        store.set({
          ...state,
          activeTool,
          draftState: activeTool === 'polyline' ? state.draftState : createDefaultDraftState()
        })
      },
      appendPendingPolylinePoint(store, point = {}) {
        const state = store.get()
        if (!state.activeMapId || state.mode !== 'edit' || state.workingMode !== 'map' || state.activeTool !== 'polyline') return
        store.set({
          ...state,
          draftState: {
            ...state.draftState,
            pendingPolyline: [...state.draftState.pendingPolyline, normalizePoint(point)]
          },
          dirtyMapIds: markDirty(state, state.activeMapId)
        })
      },
      cancelPendingPolyline(store) {
        const state = store.get()
        store.set({
          ...state,
          draftState: {
            ...state.draftState,
            pendingPolyline: []
          }
        })
      },
      commitPendingPolyline(store) {
        const state = store.get()
        const pendingPolyline = Array.isArray(state.draftState.pendingPolyline) ? state.draftState.pendingPolyline : []
        if (!state.activeMapId || pendingPolyline.length < 2) return false

        const next = nextObjectId(state)
        const stamp = new Date().toISOString()
        const polylineObject = {
          id: next.id,
          type: 'polyline',
          data: {
            points: pendingPolyline.map(normalizePoint),
            segments: normalizePolylineSegments(pendingPolyline)
          },
          createdAt: stamp,
          updatedAt: stamp
        }

        store.set({
          ...state,
          objectSequence: next.objectSequence,
          maps: state.maps.map(map => (
            map.id === state.activeMapId
              ? { ...map, updatedAt: stamp, objects: [...map.objects, polylineObject] }
              : map
          )),
          draftState: { ...state.draftState, pendingPolyline: [] },
          dirtyMapIds: markDirty(state, state.activeMapId)
        })

        return true
      },
      createObject(store, payload = {}) {
        const state = store.get()
        if (!state.activeMapId || !payload.type || !payload.data) return null

        const next = nextObjectId(state)
        const stamp = new Date().toISOString()
        const object = {
          id: next.id,
          type: payload.type,
          data: payload.data,
          createdAt: stamp,
          updatedAt: stamp
        }

        store.set({
          ...state,
          objectSequence: next.objectSequence,
          maps: state.maps.map(map => (
            map.id === state.activeMapId
              ? { ...map, updatedAt: stamp, objects: [...map.objects, object] }
              : map
          )),
          activeObjectId: object.id,
          selectedObjectIds: [object.id],
          selectedTableIds: [],
          toolbarLocked: true,
          dirtyMapIds: markDirty(state, state.activeMapId)
        })

        return object.id
      },
      selectObject(store, objectId = '') {
        const state = store.get()
        store.set({
          ...state,
          activeObjectId: objectId,
          activeTableId: null,
          selectedObjectIds: objectId ? [objectId] : [],
          selectedTableIds: [],
          toolbarLocked: Boolean(objectId)
        })
      },
      selectAllObjects(store) {
        const state = store.get()
        const activeMap = state.maps.find(map => map.id === state.activeMapId)
        const selectedObjectIds = Array.isArray(activeMap?.objects) ? activeMap.objects.map(item => item.id).filter(Boolean) : []
        store.set({
          ...state,
          activeObjectId: selectedObjectIds[0] || null,
          activeTableId: null,
          selectedObjectIds,
          selectedTableIds: [],
          toolbarLocked: Boolean(selectedObjectIds.length)
        })
      },
      clearActiveObject(store) {
        const state = store.get()
        store.set({ ...state, activeObjectId: null, selectedObjectIds: [], toolbarLocked: false })
      },
      updateObjectData(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const objectId = String(payload.objectId || '')
        const data = payload.data && typeof payload.data === 'object' ? payload.data : null
        if (!activeMapId || !objectId || !data) return

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? {
                  ...map,
                  updatedAt: stamp,
                  objects: (map.objects || []).map(item => (
                    item.id === objectId
                      ? { ...item, updatedAt: stamp, data: { ...item.data, ...data } }
                      : item
                  ))
                }
              : map
          )),
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      updatePolylinePoints(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const objectId = String(payload.objectId || '')
        const points = Array.isArray(payload.points) ? payload.points.map(normalizePoint) : []
        if (!activeMapId || !objectId) return

        const activeMap = state.maps.find(map => map.id === activeMapId)
        const targetObject = activeMap?.objects?.find(item => item.id === objectId)
        const nextData = normalizePolylineData({
          ...(targetObject?.data || {}),
          points,
          segments: payload.segments ?? targetObject?.data?.segments
        })

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? {
                  ...map,
                  updatedAt: stamp,
                  objects: (map.objects || []).map(item => (
                    item.id === objectId
                      ? { ...item, updatedAt: stamp, data: nextData }
                      : item
                  ))
                }
              : map
          )),
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      updatePolylineGeometry(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const objectId = String(payload.objectId || '')
        const points = Array.isArray(payload.points) ? payload.points.map(normalizePoint) : []
        const segments = Array.isArray(payload.segments) ? payload.segments : []
        if (!activeMapId || !objectId) return

        const nextData = normalizePolylineData({ points, segments })

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? {
                  ...map,
                  updatedAt: stamp,
                  objects: (map.objects || []).map(item => (
                    item.id === objectId
                      ? { ...item, updatedAt: stamp, data: nextData }
                      : item
                  ))
                }
              : map
          )),
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      deleteObject(store, objectId = '') {
        const state = store.get()
        const activeMapId = state.activeMapId
        if (!activeMapId || !objectId) return

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? { ...map, updatedAt: stamp, objects: (map.objects || []).filter(item => item.id !== objectId) }
              : map
          )),
          activeObjectId: state.activeObjectId === objectId ? null : state.activeObjectId,
          selectedObjectIds: (state.selectedObjectIds || []).filter(id => id !== objectId),
          toolbarLocked: state.activeObjectId === objectId ? false : state.toolbarLocked,
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      reorderObject(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const objectId = String(payload.objectId || '')
        const rawTargetOrder = Number(payload.targetOrder || 0)
        if (!activeMapId || !objectId || !rawTargetOrder) return null

        const activeMap = state.maps.find(map => map.id === activeMapId)
        const objects = Array.isArray(activeMap?.objects) ? [...activeMap.objects] : []
        const currentIndex = objects.findIndex(item => item.id === objectId)
        if (currentIndex < 0) return null

        const targetIndex = Math.max(0, Math.min(objects.length - 1, rawTargetOrder - 1))
        if (currentIndex === targetIndex) return currentIndex + 1

        const stamp = new Date().toISOString()
        const [object] = objects.splice(currentIndex, 1)
        objects.splice(targetIndex, 0, object)

        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? { ...map, updatedAt: stamp, objects }
              : map
          )),
          dirtyMapIds: markDirty(state, activeMapId)
        })

        return targetIndex + 1
      },
      createTable(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const data = payload.data && typeof payload.data === 'object' ? cloneValue(payload.data) : null
        if (!activeMapId || !data) return null

        const activeMap = state.maps.find(map => map.id === activeMapId)
        const next = nextObjectId(state)
        const stamp = new Date().toISOString()
        const nextTables = relabelTables([
          ...(activeMap?.tables || []),
          {
            id: `table_${next.objectSequence}`,
            x: Number(data.x || 0),
            y: Number(data.y || 0),
            width: Number(data.width || 80),
            height: Number(data.height || 80),
            rotation: Number(data.rotation || 0),
            note: '',
            createdAt: stamp,
            updatedAt: stamp
          }
        ], activeMap?.tablePrefix || '')
        const table = nextTables.at(-1)

        store.set({
          ...state,
          objectSequence: next.objectSequence,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? { ...map, updatedAt: stamp, tables: nextTables }
              : map
          )),
          activeTableId: null,
          selectedTableIds: [],
          dirtyMapIds: markDirty(state, activeMapId)
        })

        return table.id
      },
      duplicateTable(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const tableId = String(payload.tableId || '')
        if (!activeMapId || !tableId) return null

        const activeMap = state.maps.find(map => map.id === activeMapId)
        const sourceTable = activeMap?.tables?.find(table => table.id === tableId)
        if (!activeMap || !sourceTable) return null

        const next = nextObjectId(state)
        const stamp = new Date().toISOString()
        const duplicatedTable = normalizeTable({
          ...sourceTable,
          id: `table_${next.objectSequence}`,
          x: Number(sourceTable.x || 0) + 24,
          y: Number(sourceTable.y || 0) + 24,
          note: '',
          createdAt: stamp,
          updatedAt: stamp
        })
        const clampedTable = clampTablePosition(duplicatedTable, activeMap)
        const nextTables = relabelTables([...(activeMap.tables || []), clampedTable], activeMap.tablePrefix || '')
        const createdTable = nextTables.at(-1)

        store.set({
          ...state,
          objectSequence: next.objectSequence,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? { ...map, updatedAt: stamp, tables: nextTables }
              : map
          )),
          activeTableId: createdTable?.id || null,
          selectedTableIds: createdTable?.id ? [createdTable.id] : [],
          toolbarLocked: true,
          dirtyMapIds: markDirty(state, activeMapId)
        })

        return createdTable?.id || null
      },
      selectTable(store, tableId = '') {
        const state = store.get()
        store.set({
          ...state,
          activeTableId: tableId || null,
          activeObjectId: null,
          selectedTableIds: tableId ? [tableId] : [],
          selectedObjectIds: [],
          toolbarLocked: Boolean(tableId)
        })
      },
      selectAllTables(store) {
        const state = store.get()
        const activeMap = state.maps.find(map => map.id === state.activeMapId)
        const selectedTableIds = Array.isArray(activeMap?.tables) ? activeMap.tables.map(item => item.id).filter(Boolean) : []
        store.set({
          ...state,
          activeTableId: selectedTableIds[0] || null,
          activeObjectId: null,
          selectedTableIds,
          selectedObjectIds: [],
          toolbarLocked: Boolean(selectedTableIds.length)
        })
      },
      selectEntireScene(store) {
        const state = store.get()
        const activeMap = state.maps.find(map => map.id === state.activeMapId)
        const selectedObjectIds = Array.isArray(activeMap?.objects) ? activeMap.objects.map(item => item.id).filter(Boolean) : []
        const selectedTableIds = Array.isArray(activeMap?.tables) ? activeMap.tables.map(item => item.id).filter(Boolean) : []
        const hasSelection = Boolean(selectedObjectIds.length || selectedTableIds.length)

        store.set({
          ...state,
          activeObjectId: null,
          activeTableId: null,
          selectedObjectIds,
          selectedTableIds,
          toolbarLocked: hasSelection
        })
      },
      clearActiveTable(store) {
        const state = store.get()
        store.set({ ...state, activeTableId: null, selectedTableIds: [], toolbarLocked: false })
      },
      updateTableData(store, payload = {}) {
        const state = store.get()
        const activeMapId = state.activeMapId
        const tableId = String(payload.tableId || '')
        const data = payload.data && typeof payload.data === 'object' ? payload.data : null
        if (!activeMapId || !tableId || !data) return

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? {
                  ...map,
                  updatedAt: stamp,
                  tables: (map.tables || []).map(item => (
                    item.id === tableId
                      ? { ...item, updatedAt: stamp, ...data, label: item.label }
                      : item
                  ))
                }
              : map
          )),
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      deleteTable(store, tableId = '') {
        const state = store.get()
        const activeMapId = state.activeMapId
        if (!activeMapId || !tableId) return

        const stamp = new Date().toISOString()
        store.set({
          ...state,
          maps: state.maps.map(map => (
            map.id === activeMapId
              ? {
                  ...map,
                  updatedAt: stamp,
                  tables: relabelTables((map.tables || []).filter(item => item.id !== tableId), map.tablePrefix)
                }
              : map
          )),
          activeTableId: state.activeTableId === tableId ? null : state.activeTableId,
          selectedTableIds: (state.selectedTableIds || []).filter(id => id !== tableId),
          toolbarLocked: state.activeTableId === tableId ? false : state.toolbarLocked,
          dirtyMapIds: markDirty(state, activeMapId)
        })
      },
      saveDraft(store) {
        const state = store.get()
        const activeMapId = state.activeMapId
        if (!activeMapId) return

        const stamp = new Date().toISOString()
        const nextState = {
          ...state,
          maps: state.maps.map(map => (map.id === activeMapId ? { ...map, draftSavedAt: stamp, updatedAt: stamp } : map)),
          dirtyMapIds: state.dirtyMapIds.filter(id => id !== activeMapId),
          lastSavedDraftAt: stamp
        }

        store.set(nextState)
        persistDraftState(nextState)
      },
      saveFinal(store) {
        const state = store.get()
        const activeMapId = state.activeMapId
        if (!activeMapId) return

        const stamp = new Date().toISOString()
        const nextState = {
          ...state,
          maps: state.maps.map(map => (map.id === activeMapId ? { ...map, savedAt: stamp, updatedAt: stamp } : map)),
          dirtyMapIds: state.dirtyMapIds.filter(id => id !== activeMapId),
          lastSavedFinalAt: stamp
        }

        store.set(nextState)
        persistDraftState(nextState)
      }
    }
  })
}
