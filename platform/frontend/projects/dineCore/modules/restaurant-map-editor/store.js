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
  const stamp = new Date().toISOString()

  return {
    id: `map_${Date.now()}_${sequence}`,
    name,
    width,
    height,
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

function normalizeObject(item = {}) {
  return {
    id: String(item.id || ''),
    type: String(item.type || ''),
    data: item.data && typeof item.data === 'object' ? cloneValue(item.data) : {},
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
    objects: Array.isArray(map.objects) ? map.objects.map(normalizeObject) : [],
    tables: Array.isArray(map.tables) ? cloneValue(map.tables) : [],
    createdAt: String(map.createdAt || ''),
    updatedAt: String(map.updatedAt || ''),
    savedAt: String(map.savedAt || ''),
    draftSavedAt: String(map.draftSavedAt || '')
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
                  updatedAt: stamp
                }
              : map
          )),
          dirtyMapIds: markDirty(state, mapId)
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
            points: pendingPolyline.map(normalizePoint)
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
          toolbarLocked: Boolean(objectId)
        })
      },
      clearActiveObject(store) {
        const state = store.get()
        store.set({ ...state, activeObjectId: null, toolbarLocked: false })
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
                      ? { ...item, updatedAt: stamp, data: { ...item.data, points } }
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


