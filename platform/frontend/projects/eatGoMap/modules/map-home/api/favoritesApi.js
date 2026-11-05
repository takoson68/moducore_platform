async function requestFavoritesApi(path, options = {}) {
  const response = await fetch(`/api/eatgomap/favorites${path}`, {
    ...options,
    headers: { ...(options.body ? { 'content-type': 'application/json' } : {}), ...options.headers }
  })
  const payload = await response.json().catch(() => ({}))
  if (!response.ok) throw new Error(payload.error?.message || '收藏 API 請求失敗')
  return payload
}

export async function listFavorites() {
  const { items = [] } = await requestFavoritesApi('')
  return items
}

export async function createFavorite({ placeId }) {
  const { item } = await requestFavoritesApi('', {
    method: 'POST',
    body: JSON.stringify({ placeId })
  })
  return item
}

export async function deleteFavorite(placeId) {
  const query = new URLSearchParams({ placeId })
  return requestFavoritesApi(`?${query}`, { method: 'DELETE' })
}
