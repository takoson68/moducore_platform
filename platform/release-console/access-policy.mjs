export const consoleRoles = Object.freeze(['viewer', 'deployer', 'admin'])

export const consoleCapabilities = Object.freeze({
  view: ['viewer', 'deployer', 'admin'],
  download: ['viewer', 'deployer', 'admin'],
  deploy: ['deployer', 'admin'],
  rollback: ['deployer', 'admin'],
  cancel: ['deployer', 'admin'],
  delete_release: ['admin'],
  delete_artifact: ['admin'],
  manage_access: ['admin'],
})

export const repositoryRoleCeiling = Object.freeze({
  read: 'viewer',
  triage: 'viewer',
  write: 'deployer',
  maintain: 'deployer',
  admin: 'admin',
})

export const reauthenticationSeconds = Object.freeze({
  deploy: 15 * 60,
  rollback: 15 * 60,
  cancel: 15 * 60,
  delete_release: 5 * 60,
  delete_artifact: 5 * 60,
})

const roleRank = Object.freeze({ viewer: 1, deployer: 2, admin: 3 })
const auditResults = Object.freeze(['queued', 'rejected', 'running', 'success', 'failed', 'cancelled'])
const requiredAuditFields = ['schemaVersion', 'eventId', 'occurredAt', 'requestId', 'operationId', 'actor', 'action', 'project', 'target', 'source', 'destination', 'result', 'reasonCode', 'workflowRunId', 'githubDeploymentId', 'cloudflareVersionId']
const requiredActorFields = ['provider', 'id', 'login', 'role', 'repositoryPermission']
const requiredSourceFields = ['tag', 'version', 'commit', 'deploymentId', 'cloudflareVersionId']
const requiredDestinationFields = ['tag', 'version', 'commit']

// 以伺服器白名單角色與 GitHub Repository 權限的較低者決定有效角色。
export function resolveEffectiveRole(configuredRole, repositoryPermission) {
  if (!consoleRoles.includes(configuredRole)) return null
  const ceiling = repositoryRoleCeiling[repositoryPermission]
  if (!ceiling) return null
  return roleRank[configuredRole] <= roleRank[ceiling] ? configuredRole : ceiling
}

// 所有能力都由有效角色白名單判斷，不接受前端自行宣告的布林值。
export function canConsole(role, capability) {
  return consoleCapabilities[capability]?.includes(role) === true
}

// 寫入操作同時要求角色、近期重新驗證及完整確認字串。
export function authorizeConsoleAction({ role, capability, authenticatedAt, now, confirmation, project, tag }) {
  if (!canConsole(role, capability)) return { allowed: false, reasonCode: 'ROLE_FORBIDDEN' }
  const maximumAge = reauthenticationSeconds[capability]
  if (!maximumAge) return { allowed: true, reasonCode: 'AUTHORIZED' }
  const authenticated = Date.parse(authenticatedAt)
  const current = Date.parse(now)
  if (!Number.isFinite(authenticated) || !Number.isFinite(current) || current < authenticated || current - authenticated > maximumAge * 1000) {
    return { allowed: false, reasonCode: 'REAUTH_REQUIRED' }
  }
  const expected = `${capability}:${project}:${tag}`
  if (confirmation !== expected) return { allowed: false, reasonCode: 'CONFIRMATION_MISMATCH' }
  return { allowed: true, reasonCode: 'AUTHORIZED' }
}

// 稽核事件必須完整、可排序，且不可包含任何可重放憑證欄位。
export function validateAuditEvent(event) {
  if (!event || typeof event !== 'object' || Array.isArray(event)) throw new Error('Audit event 必須是物件')
  for (const field of requiredAuditFields) if (!(field in event)) throw new Error(`Audit event 缺少 ${field}`)
  if (event.schemaVersion !== 1) throw new Error('Audit schemaVersion 不支援')
  if (Number.isNaN(Date.parse(event.occurredAt))) throw new Error('Audit occurredAt 必須是 ISO 時間')
  if (!auditResults.includes(event.result)) throw new Error('Audit result 錯誤')
  if (!consoleCapabilities[event.action]) throw new Error('Audit action 錯誤')
  for (const field of requiredActorFields) if (!(field in (event.actor || {}))) throw new Error(`Audit actor 缺少 ${field}`)
  for (const field of requiredSourceFields) if (!(field in (event.source || {}))) throw new Error(`Audit source 缺少 ${field}`)
  for (const field of requiredDestinationFields) if (!(field in (event.destination || {}))) throw new Error(`Audit destination 缺少 ${field}`)
  if (!consoleRoles.includes(event.actor?.role) || event.actor?.provider !== 'github' || !Number.isInteger(event.actor?.id)) throw new Error('Audit actor 錯誤')
  if (typeof event.reasonCode !== 'string' || !/^[A-Z][A-Z0-9_]{1,63}$/.test(event.reasonCode)) throw new Error('Audit reasonCode 錯誤')
  const serialized = JSON.stringify(event)
  if (/"[^" ]*(token|secret|password|authorization|cookie)[^" ]*"\s*:/i.test(serialized) || /(github_pat_|ghp_|authorization:\s*bearer)/i.test(serialized)) throw new Error('Audit event 含敏感資料')
  return event
}
