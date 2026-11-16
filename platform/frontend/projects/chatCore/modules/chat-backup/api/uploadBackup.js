const MAX_BACKUP_BYTES = 1024 * 1024

export async function uploadBackup(snapshot, token) {
  const body = new Blob([JSON.stringify(snapshot)], { type: 'application/json' })
  if (body.size > MAX_BACKUP_BYTES) throw new Error('本機紀錄超過單份備份的 1 MiB 上限。')

  const result = await requestBackup(token, { method: 'POST', body })
  if (!result?.success) throw new Error('備份上傳失敗。')
}

export async function listBackups(token) {
  const result = await requestBackup(token)
  if (!result?.success || !Array.isArray(result.backups)) throw new Error('備份清單格式無效。')
  return result.backups
}

export function downloadBackup(id, token) {
  return requestBackup(token, { query: `?${new URLSearchParams({ id })}` })
}

async function requestBackup(token, { method = 'GET', body, query = '' } = {}) {
  const base = import.meta.env.DEV ? window.location.protocol + '//' + window.location.hostname + ':8787' : window.location.origin
  const response = await fetch(`${base}/api/backups${query}`, {
    method,
    headers: { 'X-Project': 'chatCore', Authorization: `Bearer ${token}` },
    body,
    cache: 'no-store'
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new Error(result?.error?.message || '備份 API 操作失敗。')
  if (!result) throw new Error('備份回應不完整或格式無效。')
  return result
}
