import assert from 'node:assert/strict'
import test from 'node:test'
import {
  authorizeConsoleAction,
  canConsole,
  resolveEffectiveRole,
  validateAuditEvent,
} from '../access-policy.mjs'

const now = '2026-10-21T08:00:00.000Z'

test('有效角色不超過 GitHub Repository 權限且未知身份無權', () => {
  assert.equal(resolveEffectiveRole('admin', 'write'), 'deployer')
  assert.equal(resolveEffectiveRole('deployer', 'admin'), 'deployer')
  assert.equal(resolveEffectiveRole('viewer', 'read'), 'viewer')
  assert.equal(resolveEffectiveRole('admin', 'unknown'), null)
  assert.equal(resolveEffectiveRole('owner', 'admin'), null)
})

test('Viewer、Deployer、Admin 能力矩陣採明確白名單', () => {
  assert.equal(canConsole('viewer', 'view'), true)
  assert.equal(canConsole('viewer', 'deploy'), false)
  assert.equal(canConsole('deployer', 'rollback'), true)
  assert.equal(canConsole('deployer', 'delete_release'), false)
  assert.equal(canConsole('admin', 'delete_release'), true)
  assert.equal(canConsole('admin', 'unknown'), false)
})

test('寫入操作要求近期重新驗證與逐字確認', () => {
  const base = { role: 'deployer', capability: 'deploy', now, project: 'game-demo', tag: 'dep_game-demo_v0.1.1' }
  assert.deepEqual(authorizeConsoleAction({ ...base, authenticatedAt: '2026-10-21T07:50:00.000Z', confirmation: 'deploy:game-demo:dep_game-demo_v0.1.1' }), { allowed: true, reasonCode: 'AUTHORIZED' })
  assert.equal(authorizeConsoleAction({ ...base, authenticatedAt: '2026-10-21T07:40:00.000Z', confirmation: 'deploy:game-demo:dep_game-demo_v0.1.1' }).reasonCode, 'REAUTH_REQUIRED')
  assert.equal(authorizeConsoleAction({ ...base, authenticatedAt: '2026-10-21T07:50:00.000Z', confirmation: 'yes' }).reasonCode, 'CONFIRMATION_MISMATCH')
  assert.equal(authorizeConsoleAction({ ...base, role: 'viewer', authenticatedAt: now, confirmation: 'deploy:game-demo:dep_game-demo_v0.1.1' }).reasonCode, 'ROLE_FORBIDDEN')

  const deletion = { ...base, role: 'admin', capability: 'delete_release', confirmation: 'delete_release:game-demo:dep_game-demo_v0.1.1' }
  assert.equal(authorizeConsoleAction({ ...deletion, authenticatedAt: '2026-10-21T07:56:00.000Z' }).allowed, true)
  assert.equal(authorizeConsoleAction({ ...deletion, authenticatedAt: '2026-10-21T07:54:00.000Z' }).reasonCode, 'REAUTH_REQUIRED')
})

test('稽核事件固定身份、來源目標與結果並拒絕憑證', () => {
  const event = {
    schemaVersion: 1, eventId: 'event-1', occurredAt: now, requestId: 'request-1', operationId: 'operation-1',
    actor: { provider: 'github', id: 123, login: 'operator', role: 'deployer', repositoryPermission: 'write' },
    action: 'deploy', project: 'game-demo', target: 'game-demo-staging',
    source: { tag: 'dep_game-demo_v0.1.0', version: '0.1.0', commit: 'a'.repeat(40), deploymentId: 1, cloudflareVersionId: 'old' },
    destination: { tag: 'dep_game-demo_v0.1.1', version: '0.1.1', commit: 'b'.repeat(40) },
    result: 'queued', reasonCode: 'AUTHORIZED', workflowRunId: null, githubDeploymentId: null, cloudflareVersionId: null,
  }
  assert.equal(validateAuditEvent(event), event)
  assert.throws(() => validateAuditEvent({ ...event, accessToken: 'secret' }), /敏感資料/)
  assert.throws(() => validateAuditEvent({ ...event, result: 'maybe' }), /result 錯誤/)
  assert.throws(() => validateAuditEvent({ ...event, source: { tag: 'x' } }), /source 缺少/)
})
