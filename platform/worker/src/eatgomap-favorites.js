import { HttpError, json, readJson } from './response.js'

function validatePlaceId(value) {
  if (typeof value !== 'string' || value.trim().length < 1 || value.length > 255) {
    throw new HttpError(400, 'INVALID_PLACE_ID', 'placeId 格式錯誤')
  }
  return value.trim()
}

export async function listEatGoMapFavorites(_request, env) {
  const result = await env.DB.prepare('SELECT place_id AS id FROM eatgomap_favorites ORDER BY place_id LIMIT 500').all()
  return json({ items: result.results })
}

export async function createEatGoMapFavorite(request, env) {
  const body = await readJson(request)
  if (Object.keys(body).some(key => key !== 'placeId')) {
    throw new HttpError(400, 'PLACE_ID_ONLY', '收藏 API 只接受 placeId')
  }
  const id = validatePlaceId(body.placeId)
  const result = await env.DB.prepare('INSERT INTO eatgomap_favorites (place_id) VALUES (?) ON CONFLICT(place_id) DO NOTHING')
    .bind(id).run()
  return json({ item: { id }, created: Number(result.meta?.changes || 0) > 0 })
}

export async function deleteEatGoMapFavorite(request, env) {
  const url = new URL(request.url)
  const id = validatePlaceId(url.searchParams.get('placeId'))
  const result = await env.DB.prepare('DELETE FROM eatgomap_favorites WHERE place_id=?').bind(id).run()
  return json({ deleted: Number(result.meta?.changes || 0) > 0, placeId: id })
}
