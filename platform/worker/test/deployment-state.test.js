import assert from 'node:assert/strict'
import test from 'node:test'
import {
  deploymentEnvironment,
  selectCurrentPrevious,
  verifiedDeploymentPayload,
} from '../scripts/deployment-state.mjs'

const input = {
  project: 'game-demo',
  target: 'game-demo-staging',
  version: '0.1.1',
  tag: 'dep_game-demo_v0.1.1',
  commit: 'a'.repeat(40),
  artifact: 'game-demo_v0.1.1_aaaaaaa.zip',
  zipSha256: 'b'.repeat(64),
  cloudflareVersionId: 'cf-version',
  runUrl: 'https://github.example/run/1',
  releaseUrl: 'https://github.example/release/1',
  environmentUrl: 'https://game.example',
}

test('成功部署證據包含控制台所需的不可變識別', () => {
  assert.equal(deploymentEnvironment(input.target), 'staging/game-demo-staging')
  assert.deepEqual(verifiedDeploymentPayload(input), {
    schemaVersion: 1,
    project: 'game-demo',
    target: 'game-demo-staging',
    version: '0.1.1',
    tag: 'dep_game-demo_v0.1.1',
    sourceRef: 'dep_game-demo_v0.1.1',
    commit: 'a'.repeat(40),
    artifact: 'game-demo_v0.1.1_aaaaaaa.zip',
    zipSha256: 'b'.repeat(64),
    artifactSource: 'build',
    minimumSchemaVersion: null,
    cloudflareVersionId: 'cf-version',
    smoke: 'passed',
    runUrl: 'https://github.example/run/1',
    releaseUrl: 'https://github.example/release/1',
  })
})

test('current 與 previous 只採用最新兩筆 Smoke 成功紀錄', () => {
  const records = [
    { id: 1, createdAt: '2026-10-21T01:00:00Z', latestStatus: 'inactive', payload: { smoke: 'passed' } },
    { id: 2, createdAt: '2026-10-21T03:00:00Z', latestStatus: 'failure', payload: { smoke: 'failed' } },
    { id: 3, createdAt: '2026-10-21T02:00:00Z', latestStatus: 'success', payload: { smoke: 'passed' } },
  ]
  const state = selectCurrentPrevious(records)
  assert.equal(state.current.id, 3)
  assert.equal(state.previous.id, 1)
})

test('不完整雜湊與非 staging 目標會被拒絕', () => {
  assert.throws(() => verifiedDeploymentPayload({ ...input, zipSha256: 'short' }), /SHA-256/)
  assert.throws(() => deploymentEnvironment('production'), /格式錯誤/)
})
