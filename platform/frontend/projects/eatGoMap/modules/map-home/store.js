import world from '@/world.js'
import { createFavorite, deleteFavorite, listFavorites } from './api/favoritesApi.js'

const PLACE_STORAGE_PREFIX = 'eatGoMap:place'
const LEGACY_STORAGE_KEY = 'eatGoMap:favorites'
const PLACE_CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000

function favoriteId(item = {}) {
  const id = item.id || item.place_id || item.placeId
  if (typeof id !== 'string' || !id.trim()) return null
  const normalized = id.trim()
  return normalized === 'undefined' || normalized === 'null' ? null : normalized
}

function normalizeDetailsPayload(details = {}) {
  const rawCoordinates = details.coordinates || details.location
  const coordinates = Array.isArray(rawCoordinates)
    ? { lat: Number(rawCoordinates[0]), lng: Number(rawCoordinates[1]) }
    : rawCoordinates?.toJSON?.() || rawCoordinates
  return {
    name: String(details.name ?? details.displayName ?? ''),
    address: String(details.address ?? details.formattedAddress ?? ''),
    phone: String(details.phone ?? details.nationalPhoneNumber ?? ''),
    coordinates: coordinates && Number.isFinite(Number(coordinates.lat)) && Number.isFinite(Number(coordinates.lng))
      ? { lat: Number(coordinates.lat), lng: Number(coordinates.lng) }
      : null
  }
}

function normalizePlaceRecord(id, record = {}) {
  if (typeof id !== 'string' || !id.trim()) throw new Error('地點資料缺少有效 Place ID')
  const details = normalizeDetailsPayload(record.details || record)
  const coordinates = details.coordinates
  const lat = Number(coordinates?.lat)
  const lng = Number(coordinates?.lng)
  const fetchedAt = Number(record.detailsFetchedAt || record.details?.fetchedAt || 0)
  const detailsAreFresh = fetchedAt > 0 && Date.now() - fetchedAt < PLACE_CACHE_TTL_MS
  const validCoordinates = Number.isFinite(lat) && lat >= -90 && lat <= 90 && Number.isFinite(lng) && lng >= -180 && lng <= 180
  return {
    id,
    kind: record.kind === 'search' ? 'search' : 'poi',
    savedAt: Number(record.savedAt) || Date.now(),
    name: detailsAreFresh ? details.name : '',
    address: detailsAreFresh ? details.address : '',
    coordinates: detailsAreFresh && validCoordinates ? { lat, lng } : null,
    phone: detailsAreFresh ? details.phone : '',
    detailsFetchedAt: detailsAreFresh ? fetchedAt : 0,
    detailsRefreshFailures: Math.max(0, Math.min(2, Number(record.detailsRefreshFailures) || 0)),
    detailsRefreshError: typeof record.detailsRefreshError === 'string' ? record.detailsRefreshError : '',
    customName: typeof record.customName === 'string' ? record.customName : '',
    customAddress: typeof record.customAddress === 'string' ? record.customAddress : '',
    personalNote: typeof record.personalNote === 'string' ? record.personalNote : ''
  }
}

function hasCompleteDetails(details) {
  return Boolean(details?.name && details?.address && details?.coordinates &&
    Number.isFinite(details.coordinates.lat) && details.coordinates.lat >= -90 && details.coordinates.lat <= 90 &&
    Number.isFinite(details.coordinates.lng) && details.coordinates.lng >= -180 && details.coordinates.lng <= 180)
}

function storageKey(id) {
  return `${PLACE_STORAGE_PREFIX}:${encodeURIComponent(id)}`
}

function refreshFailureKey(id) {
  return `eatGoMap:place-refresh-failures:${encodeURIComponent(id)}`
}

function refreshFailureMessage(error) {
  const message = error?.message || String(error || '未知錯誤')
  return String(message).replace(/AIza[0-9A-Za-z_-]{20,}/g, '[已隱藏 API 金鑰]').slice(0, 240)
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
              const failures = Number(await storage.get(refreshFailureKey(id))) || 0
              const item = normalizePlaceRecord(id, {
                ...previous,
                detailsRefreshFailures: failures,
                kind: previous.kind || remote.source
              })
              await storage.set(storageKey(id), item)
              return item
            }))
            const normalized = items.filter(Boolean)
            const activeKeys = new Set(normalized.map(item => storageKey(item.id)))
            const staleKeys = await storage.list(PLACE_STORAGE_PREFIX)
            await Promise.all(staleKeys.filter(entry => entry.key.startsWith(`${PLACE_STORAGE_PREFIX}:`) && !activeKeys.has(entry.key))
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
        if (typeof place?.id !== 'string' || !place.id.trim()) {
          throw new Error('拒絕保存沒有有效 Place ID 的地點資料')
        }
        const item = normalizePlaceRecord(place.id, place)
        const storage = world.services.storage()
        const key = storageKey(item.id)
        await storage.set(key, item)
        const storedValue = await storage.get(key)
        const persisted = normalizePlaceRecord(item.id, storedValue || {})
        if (persisted.id !== item.id || persisted.detailsFetchedAt !== item.detailsFetchedAt ||
          (item.detailsFetchedAt > 0 && (
            persisted.name !== item.name || persisted.address !== item.address ||
            persisted.phone !== item.phone || persisted.coordinates?.lat !== item.coordinates?.lat ||
            persisted.coordinates?.lng !== item.coordinates?.lng
          ))) {
          throw new Error('收藏資料寫入瀏覽器儲存後讀回不一致')
        }
        const items = store.get().items.map(existing => existing.id === item.id ? item : existing)
        if (!items.some(existing => existing.id === item.id)) items.unshift(item)
        store.set({ ...store.get(), items })
        return persisted
      },
      async addFavorite(store, favorite) {
        await store.hydrate()
        const id = favoriteId(favorite)
        if (!id) throw new Error('Google 地標沒有提供有效 Place ID，未加入收藏')

        const { fetchDetails, ...favoriteRecord } = favorite
        const existing = store.get().items.find(item => item.id === id)
        const storage = world.services.storage()
        const failures = Number(await storage.get(refreshFailureKey(id))) || 0
        let details = normalizeDetailsPayload(favoriteRecord)
        let detailsFetchedAt = Number(favoriteRecord.detailsFetchedAt || existing?.detailsFetchedAt || 0)

        if (!hasCompleteDetails(details) || !detailsFetchedAt || Date.now() - detailsFetchedAt >= PLACE_CACHE_TTL_MS) {
          if (typeof fetchDetails !== 'function') {
            throw new Error('收藏前缺少地點名稱、地址或座標，無法寫入本機資料')
          }
          if (failures >= 2) throw new Error('此 Place ID 已連續查詢失敗 2 次，已停止再次呼叫')
          try {
            details = normalizeDetailsPayload(await fetchDetails(id))
            if (!hasCompleteDetails(details)) throw new Error('Place Details 未回傳完整名稱、地址與座標')
            detailsFetchedAt = Date.now()
          } catch (error) {
            await storage.set(refreshFailureKey(id), Math.min(2, failures + 1))
            throw error
          }
        }

        await createFavorite({ placeId: id })
        await storage.remove(refreshFailureKey(id))
        const item = await store.persistPlace({
          ...existing,
          ...favoriteRecord,
          ...details,
          id,
          kind: favoriteRecord.kind,
          detailsFetchedAt,
          detailsRefreshFailures: 0,
          detailsRefreshError: ''
        })
        store.set({ ...store.get(), syncState: 'ready' })
        return item
      },
      async updatePlaceDetails(store, { placeId, details }) {
        if (typeof placeId !== 'string' || !placeId.trim()) throw new Error('更新地點資料缺少有效 Place ID')
        const existing = store.get().items.find(item => item.id === placeId) || { id: placeId }
        const normalized = normalizeDetailsPayload(details)
        if (!hasCompleteDetails(normalized)) throw new Error('地點資料缺少名稱、地址或有效座標')
        return store.persistPlace({
          ...existing,
          ...normalized,
          detailsFetchedAt: Date.now()
        })
      },
      async savePersonalFields(store, { placeId, customName, customAddress, personalNote }) {
        const existing = store.get().items.find(item => item.id === placeId)
        if (!existing) throw new Error('找不到本機收藏資料')
        return store.persistPlace({
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
        if (typeof placeId !== 'string' || !placeId.trim()) throw new Error('更新地點資料缺少有效 Place ID')
        const existing = store.get().items.find(item => item.id === placeId)
        if (!existing) return null
        const fresh = existing.detailsFetchedAt > 0 && Date.now() - existing.detailsFetchedAt < PLACE_CACHE_TTL_MS
        if (fresh) return existing
        if (existing.detailsRefreshFailures >= 2) return existing
        if (detailsRefreshes.has(placeId)) return detailsRefreshes.get(placeId)
        const refresh = (async () => {
          let details
          try {
            details = await fetchDetails(placeId)
          } catch (error) {
            const storage = world.services.storage()
            const failures = Math.min(2, (Number(await storage.get(refreshFailureKey(placeId))) || 0) + 1)
            await storage.set(refreshFailureKey(placeId), failures)
            const current = store.get().items.find(item => item.id === placeId)
            if (current) {
              await store.persistPlace({
                ...current,
                detailsRefreshFailures: failures,
                detailsRefreshError: refreshFailureMessage(error)
              })
            }
            throw error
          }
          details = normalizeDetailsPayload(details)
          if (!hasCompleteDetails(details)) {
            const error = new Error('地點資料格式不完整：需要名稱、地址與有效座標')
            const storage = world.services.storage()
            const failures = Math.min(2, (Number(await storage.get(refreshFailureKey(placeId))) || 0) + 1)
            await storage.set(refreshFailureKey(placeId), failures)
            const current = store.get().items.find(item => item.id === placeId)
            if (current) await store.persistPlace({
              ...current,
              detailsRefreshFailures: failures,
              detailsRefreshError: refreshFailureMessage(error)
            })
            throw error
          }
          await world.services.storage().remove(refreshFailureKey(placeId))
          return store.persistPlace({
            ...existing,
            ...details,
            detailsFetchedAt: Date.now(),
            detailsRefreshFailures: 0,
            detailsRefreshError: ''
          })
        })().finally(() => detailsRefreshes.delete(placeId))
        detailsRefreshes.set(placeId, refresh)
        return refresh
      }
    }
  })
}
