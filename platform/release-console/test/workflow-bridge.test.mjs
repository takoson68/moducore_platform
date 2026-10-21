import assert from 'node:assert/strict'
import test from 'node:test'
import { createOperationController, validateWorkflowRequest } from '../workflow-bridge.mjs'

const now = '2026-10-21T08:00:00.000Z'
const actor = { provider: 'github', id: 95896770, login: 'takoson68', role: 'admin', repositoryPermission: 'admin', authenticatedAt: now }
const source = { tag: 'dep_game-demo_v0.1.0', version: '0.1.0', commit: 'a'.repeat(40), deploymentId: 1, cloudflareVersionId: 'old' }

function request(overrides = {}) {
  return { action: 'deploy', project: 'game-demo', tag: 'dep_game-demo_v0.1.1', commit: 'b'.repeat(40), confirmation: 'deploy:game-demo:dep_game-demo_v0.1.1', actor, source, ...overrides }
}

test('橋接只接受白名單 Project、正式同專案 Tag 與不可變 Commit', () => {
  assert.equal(validateWorkflowRequest(request()).project.target, 'game-demo-staging')
  assert.throws(() => validateWorkflowRequest(request({ project: 'unknown' })), /PROJECT_NOT_ALLOWED/)
  assert.throws(() => validateWorkflowRequest(request({ tag: 'dep_project-b_v0.1.0' })), /TAG_PROJECT_MISMATCH/)
  assert.throws(() => validateWorkflowRequest(request({ tag: 'world-oop' })), /部署 Tag 格式錯誤/)
  assert.throws(() => validateWorkflowRequest(request({ commit: 'main' })), /COMMIT_NOT_ALLOWED/)
})

test('同 Project 互斥、不同 Project 可並行且拒絕也留下 Audit', async () => {
  const audits = []
  let sequence = 0
  const controller = createOperationController({ dispatch: async () => ({ status: 'queued', runId: null, runUrl: null }), audit: async (event) => audits.push(event), clock: () => now, id: () => `id-${++sequence}` })
  const first = await controller.start(request())
  assert.equal(first.status, 'queued')
  await assert.rejects(() => controller.start(request()), /PROJECT_BUSY/)
  const projectBSource = { tag: 'dep_project-b_v0.1.0', version: '0.1.0', commit: 'c'.repeat(40), deploymentId: 2, cloudflareVersionId: 'project-old' }
  const second = await controller.start(request({ project: 'project-b', tag: 'dep_project-b_v0.1.0', commit: 'c'.repeat(40), confirmation: 'deploy:project-b:dep_project-b_v0.1.0', source: projectBSource }))
  assert.equal(second.projectKey, 'project-b')
  assert.deepEqual(audits.map((event) => event.result), ['queued', 'rejected', 'queued'])
})

test('Operation 由 queued／running 更新到 success，Dispatch 失敗固定為 failed', async () => {
  const audits = []
  let statusCalls = 0
  const controller = createOperationController({
    dispatch: async () => ({ status: 'queued', runId: null, runUrl: null }),
    readStatus: async () => ++statusCalls === 1 ? ({ status: 'running', runId: 10, runUrl: 'https://example.test/run/10' }) : ({ status: 'success', runId: 10, runUrl: 'https://example.test/run/10' }),
    audit: async (event) => audits.push(event), clock: () => now, id: () => 'operation-1',
  })
  const started = await controller.start(request())
  assert.equal((await controller.refresh(started.id)).status, 'running')
  assert.equal((await controller.refresh(started.id)).status, 'success')
  assert.deepEqual(audits.map((event) => event.result), ['queued', 'running', 'success'])

  const failed = createOperationController({ dispatch: async () => { throw new Error('private detail') }, audit: async (event) => audits.push(event), clock: () => now, id: () => 'operation-failed' })
  assert.equal((await failed.start(request())).status, 'failed')
  assert.equal(audits.at(-1).reasonCode, 'DISPATCH_FAILED')
})

test('角色或確認失敗時不會呼叫 Dispatch', async () => {
  let called = false
  const audits = []
  const controller = createOperationController({ dispatch: async () => { called = true }, audit: async (event) => audits.push(event), clock: () => now, id: () => 'rejected' })
  await assert.rejects(() => controller.start(request({ actor: { ...actor, role: 'viewer' } })), /ROLE_FORBIDDEN/)
  assert.equal(called, false)
  assert.equal(audits[0].result, 'rejected')
})
