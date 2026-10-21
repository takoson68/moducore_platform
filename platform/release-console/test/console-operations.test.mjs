import assert from 'node:assert/strict'
import test from 'node:test'
import { createConsoleOperations, createSimulationAdapter } from '../console-operations.mjs'

const now = '2026-10-21T08:00:00.000Z'
const actor = { provider: 'github', id: 95896770, login: 'takoson68', repositoryPermission: 'admin' }
const release = (tag, version) => ({ tag, version, commit: version.replaceAll('.', '').padEnd(40, 'a'), artifact: { completeness: 'complete', integrity: 'verified' } })
const current = { id: 2, position: 'current', tag: 'dep_game-demo_v0.2.0', version: '0.2.0', commit: 'b'.repeat(40), cloudflareVersionId: 'current' }
const previous = { id: 1, position: 'previous', tag: 'dep_game-demo_v0.1.0', version: '0.1.0', commit: 'a'.repeat(40), cloudflareVersionId: 'previous' }
const snapshot = { projects: [{ key: 'game-demo', deployments: [current, previous], releases: [release(current.tag, current.version), release(previous.tag, previous.version), release('dep_game-demo_v0.0.9', '0.0.9'), release('dep_game-demo_v0.0.8', '0.0.8')] }] }

function service(overrides = {}) {
  const audits = []
  return { audits, value: createConsoleOperations({ snapshotLoader: async () => snapshot, identityLoader: async () => actor, policyLoader: async () => ({ repository: 'repo', operators: [{ githubId: actor.id, role: 'admin', enabled: true }] }), adapter: createSimulationAdapter({ clock: () => now }), audit: async (event) => audits.push(event), clock: () => now, id: (() => { let n = 0; return () => `id-${++n}` })(), ...overrides }) }
}

test('部署與 previous 回退只從後端 Snapshot 推導版本', async () => {
  const { value } = service()
  const deployed = await value.start({ action: 'deploy', project: 'game-demo', tag: previous.tag, confirmation: `deploy:game-demo:${previous.tag}` })
  assert.equal(deployed.source.tag, current.tag)
  assert.equal(deployed.destination.tag, previous.tag)
  await assert.rejects(() => value.start({ action: 'rollback', project: 'game-demo', tag: current.tag, confirmation: `rollback:game-demo:${current.tag}` }), /PREVIOUS_REQUIRED|PROJECT_BUSY/)
})

test('queued 可取消，開始後不可取消', async () => {
  const { value, audits } = service()
  const operation = await value.start({ action: 'deploy', project: 'game-demo', tag: previous.tag, confirmation: `deploy:game-demo:${previous.tag}` })
  await value.refreshAll()
  assert.equal((await value.cancel({ operationId: operation.id, confirmation: `cancel:game-demo:${previous.tag}` })).status, 'cancelled')
  assert.equal(audits.at(-1).result, 'cancelled')
})

test('current、previous 與最後一個 verified Release 不可刪除', async () => {
  const { value } = service()
  await assert.rejects(() => value.start({ action: 'delete_release', project: 'game-demo', tag: current.tag, confirmation: `delete_release:game-demo:${current.tag}` }), /CURRENT_PROTECTED/)
  await assert.rejects(() => value.start({ action: 'delete_release', project: 'game-demo', tag: previous.tag, confirmation: `delete_release:game-demo:${previous.tag}` }), /PREVIOUS_PROTECTED/)
  const deletion = await value.start({ action: 'delete_release', project: 'game-demo', tag: 'dep_game-demo_v0.0.9', confirmation: 'delete_release:game-demo:dep_game-demo_v0.0.9' })
  assert.match(deletion.impact[0], /不可恢復/)
})

test('批次刪除逐筆列出不可恢復影響並使用完整確認字串', async () => {
  const { value } = service()
  const tags = ['dep_game-demo_v0.0.9', 'dep_game-demo_v0.0.8']
  const operation = await value.start({ action: 'delete_release', project: 'game-demo', tag: tags.join(','), tags, confirmation: `delete_release:game-demo:${tags.slice().sort().join(',')}` })
  assert.equal(operation.destination.version, 'batch')
  assert.equal(operation.impact.length, 2)
})

test('授權與同 Project 互斥拒絕都寫入 Audit', async () => {
  const { value, audits } = service()
  await assert.rejects(() => value.start({ action: 'deploy', project: 'game-demo', tag: previous.tag, confirmation: 'wrong' }), /CONFIRMATION_MISMATCH/)
  await value.start({ action: 'deploy', project: 'game-demo', tag: previous.tag, confirmation: `deploy:game-demo:${previous.tag}` })
  await assert.rejects(() => value.start({ action: 'deploy', project: 'game-demo', tag: previous.tag, confirmation: `deploy:game-demo:${previous.tag}` }), /PROJECT_BUSY/)
  assert.deepEqual(audits.filter((event) => event.result === 'rejected').map((event) => event.reasonCode), ['CONFIRMATION_MISMATCH', 'PROJECT_BUSY'])
})
