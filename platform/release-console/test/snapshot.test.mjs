import assert from 'node:assert/strict'
import test from 'node:test'
import { assembleSnapshot } from '../snapshot.mjs'

const fixedTime = '2026-10-21T05:00:00.000Z'
const release = (projectKey, project, target, tag) => ({
  projectKey, tag, version: '0.1.0', commit: 'a'.repeat(40), releaseUrl: `https://example.test/${tag}`, builtAt: fixedTime, publishedAt: fixedTime,
  artifact: {
    zip: { name: 'app.zip', url: 'https://example.test/app.zip', size: 1, digest: `sha256:${'b'.repeat(64)}` },
    manifest: { name: 'app.manifest.json', url: 'https://example.test/manifest', size: 1, digest: null },
    checksum: { name: 'app.sha256', url: 'https://example.test/checksum', size: 1, digest: null },
    zipSha256: 'b'.repeat(64), manifestSchemaVersion: 1, fileCount: 2, minimumSchemaVersion: null,
    completeness: 'complete', integrity: 'verified', project, target,
  },
})

const deployment = (id, environment, project, target, versionId, state = 'success') => ({
  id, environment, state, created_at: fixedTime, environment_url: `https://${target}.example.test`,
  payload: { schemaVersion: 1, project, target, version: '0.1.0', tag: `dep_${project.toLowerCase()}_v0.1.0`, sourceRef: 'tag', commit: 'a'.repeat(40), cloudflareVersionId: versionId, runUrl: 'https://example.test/run', releaseUrl: 'https://example.test/release', artifactSource: 'build', artifact: 'app.zip', zipSha256: 'b'.repeat(64), minimumSchemaVersion: null, smoke: 'passed' },
})

test('組合三個 Project 並標示 current、previous 與線上版本', () => {
  const deployments = [
    deployment(2, 'staging/game-demo-staging', 'game-demo', 'game-demo-staging', 'game-current'),
    { ...deployment(1, 'staging/game-demo-staging', 'game-demo', 'game-demo-staging', 'game-old', 'inactive'), created_at: '2026-10-20T05:00:00.000Z' },
    deployment(3, 'staging/dinecore-staging', 'dineCore', 'dinecore-staging', 'dine-current'),
    deployment(4, 'staging/project-b-staging', 'project-b', 'project-b-staging', 'project-current'),
  ]
  const releases = [release('game-demo', 'game-demo', 'game-demo-staging', 'dep_game-demo_v0.1.0')]
  const cloudflare = { 'game-demo': { versionId: 'game-current', createdAt: fixedTime }, dinecore: { versionId: 'dine-current', createdAt: fixedTime }, 'project-b': { versionId: 'project-current', createdAt: fixedTime } }
  const result = assembleSnapshot({ deployments, releases, cloudflare, generatedAt: fixedTime })
  assert.equal(result.projects.length, 3)
  assert.equal(result.projects[0].currentDeploymentId, 2)
  assert.equal(result.projects[0].previousDeploymentId, 1)
  assert.equal(result.projects[0].status, 'healthy')
})

test('Cloudflare 版本不一致與來源失敗不會被顯示成成功', () => {
  const deployments = [deployment(1, 'staging/game-demo-staging', 'game-demo', 'game-demo-staging', 'expected')]
  const result = assembleSnapshot({ deployments, releases: [], cloudflare: { 'game-demo': { versionId: 'actual', createdAt: fixedTime } }, generatedAt: fixedTime, sourceErrors: { githubReleases: '無法查詢' } })
  assert.equal(result.status, 'unavailable')
  assert.ok(result.projects[0].issues.some((issue) => issue.code === 'CLOUDFLARE_VERSION_MISMATCH'))
  assert.ok(result.projects[0].issues.some((issue) => issue.code === 'SOURCE_UNAVAILABLE'))
})
