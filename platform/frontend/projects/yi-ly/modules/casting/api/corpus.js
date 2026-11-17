import world from '@/world.js'

export async function fetchReadingForPatterns(basePattern, changedPattern) {
  const query = new URLSearchParams({ basePattern, changedPattern })
  const response = await world.http().get(`/api/yijing/reading?${query.toString()}`)
  if (!response.ok) {
    throw new Error(response.data?.error?.message || response.data?.message || '目前無法讀取經文資料。')
  }
  return response.data
}
