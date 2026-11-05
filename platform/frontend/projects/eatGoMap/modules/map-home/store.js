import world from '@/world.js'
import { createFavorite, deleteFavorite, listFavorites } from './api/favoritesApi.js'

const PLACE_STORAGE_PREFIX = 'eatGoMap:place:'
const LEGACY_STORAGE_KEY = 'eatGoMap:favorites'
const PLACE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function favoriteId(item = {}) {
  const id = item.id || item.place_id || item.placeId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

function normalizePlaceRecord(id, record = {}) {
  const coordinates = record.coordinates || record.details?.coordinates
  const lat = Number(coordinates?.lat)
  const lng = Number(coordinates?.lng)
  const fetchedAt = Number(record.detailsFetchedAt || record.details?.fetchedAt || 0)
  const detailsAreFresh = fetchedAt > 0 && Date.now() - fetchedAt < PLACE_CACHE_TTL_MS
  const validCoordinates = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
  return {
    id,
    kind: record.kind === 'search' ? 'search' : 'poi',
    savedAt: Number(record.savedAt) || Date.now(),
    name: detailsAreFresh && typeof record.name === 'string' ? record.name : '',
    address: detailsAreFresh && typeof record.address === 'string' ? record.address : '',
    coordinates: detailsAreFresh && validCoordinates ? { lat, lng } : null,
    phone: detailsAreFresh && typeof record.phone === 'string' ? record.phone : '',
    detailsFetchedAt: detailsAreFresh ? fetchedAt : 0,
    customName: typeof record.customName === 'string' ? record.customName : '',
    customAddress: typeof record.customAddress === 'string' ? record.customAddress : '',
    personalNote: typeof record.personalNote === 'string' ? record.personalNote : ''
  }
}

function storageKey(id) {
  return `${PLACE_STORAGE_PREFIX}${encodeURIComponent(id)}`
}

export function createEatGoMapFavoriteStore() {
  let hydrationPromise = null
  const detailsRefreshes = new Map()
  return world.createStore({
    name: 'eatGoMapFavoriteStore',
    defaultValue: { items: [], hydrated: false, syncState: 'loading' },
    actions: {
      async hydrate(store) {
        if (store.get().hydrated) return
        if (hydrationPromise) return hydrationPromise
        hydrationPromise = (async () => {
          const storage = world.services.storage()
          const legacy = await storage.get(LEGACY_STORAGE_KEY)
          const legacyById = new Map((Array.isArray(legacy) ? legacy : [])
            .map(item => [favoriteId(item), item]).filter(([id]) => id))
          try {
            const remoteFavorites = await listFavorites()
            const items = await Promise.all(remoteFavorites.map(async remote => {
              const id = favoriteId(remote)
              if (!id) return null
              const cached = await storage.get(storageKey(id))
              const previous = cached || legacyById.get(id) || {}
              const item = normalizePlaceRecord(id, { ...previous, kind: previous.kind || remote.source })
              await storage.set(storageKey(id), item)
              return item
            }))
            const normalized = items.filter(Boolean)
            const activeKeys = new Set(normalized.map(item => storageKey(item.id)))
            const staleKeys = await storage.list(PLACE_STORAGE_PREFIX)
            await Promise.all(staleKeys.filter(entry => !activeKeys.has(entry.key))
              .map(entry => storage.remove(entry.key)))
            await storage.remove(LEGACY_STORAGE_KEY)
            store.set({ ...store.get(), items: normalized, hydrated: true, syncState: 'ready' })
          } catch {
            store.set({ ...store.get(), hydrated: true, syncState: 'error' })
          }
        })().finally(() => { hydrationPromise = null })
        return hydrationPromise
      },
      async persistPlace(store, place) {
        const item = normalizePlaceRecord(place.id, place)
        await world.services.storage().set(storageKey(item.id), item)
        const items = store.get().items.map(existing => existing.id === item.id ? item : existing)
        if (!items.some(existing => existing.id === item.id)) items.unshift(item)
        store.set({ ...store.get(), items })
        return item
      },
      async addFavorite(store, favorite) {
        await store.hydrate()
        const id = favorite.placeId || favorite.id
        await createFavorite({ placeId: id })
        const existing = store.get().items.find(item => item.id === id)
        const item = normalizePlaceRecord(id, {
          ...existing,
          ...favorite,
          id,
          kind: favorite.kind,
          detailsFetchedAt: favorite.detailsFetchedAt || existing?.detailsFetchedAt
        })
        await world.services.storage().set(storageKey(id), item)
        const items = [item, ...store.get().items.filter(current => current.id !== id)]
        store.set({ ...store.get(), items, syncState: 'ready' })
        return item
      },
      async updatePlaceDetails(store, { placeId, details }) {
        const existing = store.get().items.find(item => item.id === placeId) || { id: placeId }
        return store.persistPlace(store, {
          ...existing,
          name: details.name || '',
          address: details.address || '',
          coordinates: details.coordinates || null,
          phone: details.phone || '',
          detailsFetchedAt: Date.now()
        })
      },
      async savePersonalFields(store, { placeId, customName, customAddress, personalNote }) {
        const existing = store.get().items.find(item => item.id === placeId)
        if (!existing) throw new Error('找不到本機收藏資料')
        return store.persistPlace(store, {
          ...existing,
          customName: customName ?? existing.customName,
          customAddress: customAddress ?? existing.customAddress,
          personalNote: personalNote ?? existing.personalNote
        })
      },
      async removeFavorite(store, placeId) {
        await deleteFavorite(placeId)
        await world.services.storage().remove(storageKey(placeId))
        store.set({ ...store.get(), items: store.get().items.filter(item => item.id !== placeId), syncState: 'ready' })
      },
      async refreshPlaceDetails(store, { placeId, fetchDetails }) {
        const existing = store.get().items.find(item => item.id === placeId)
        if (!existing) return null
        const fresh = existing.detailsFetchedAt > 0 && Date.now() - existing.detailsFetchedAt < PLACE_CACHE_TTL_MS
        if (fresh) return existing
        if (detailsRefreshes.has(placeId)) return detailsRefreshes.get(placeId)
        const refresh = (async () => {
          const details = await fetchDetails(placeId)
          return store.updatePlaceDetails({ placeId, details })
        })().finally(() => detailsRefreshes.delete(placeId))
        detailsRefreshes.set(placeId, refresh)
        return refresh
      }
    }
  })
}
