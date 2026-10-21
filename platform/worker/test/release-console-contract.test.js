import assert from 'node:assert/strict'
import test from 'node:test'
import {
  releaseConsoleProjects,
  validateReleaseConsoleSnapshot,
} from '../scripts/release-console-contract.mjs'

function snapshot() {
  return {
    schemaVersion: 1,
    generatedAt: '2026-10-21T04:00:00.000Z',
    status: 'healthy',
    sources: { githubDeployments: 'ok', githubReleases: 'ok', githubActions: 'ok', cloudflareDeployments: 'ok' },
    projects: releaseConsoleProjects.map((project) => ({
      ...project,
      status: 'healthy',
      currentDeploymentId: project.key === 'game-demo' ? 1 : null,
      previousDeploymentId: null,
      deployments: project.key === 'game-demo' ? [{
        id: 1, position: 'current', status: 'success', createdAt: '2026-10-21T03:00:00.000Z',
        project: 'game-demo', target: 'game-demo-staging', version: '0.1.1', tag: 'dep_game-demo_v0.1.1',
        sourceRef: 'dep_game-demo_v0.1.1', commit: 'a'.repeat(40), cloudflareVersionId: 'cf-version',
        environmentUrl: project.stagingUrl, runUrl: 'https://github.example/run/1', releaseUrl: 'https://github.example/release/1',
        artifactSource: 'release', artifactName: 'game-demo_v0.1.1_aaaaaaa.zip', zipSha256: 'b'.repeat(64),
        minimumSchemaVersion: null, smoke: 'passed',
      }] : [],
      releases: project.key === 'game-demo' ? [{
        tag: 'dep_game-demo_v0.1.1', version: '0.1.1', commit: 'a'.repeat(40),
        releaseUrl: 'https://github.example/release/1', builtAt: '2026-10-21T01:59:00.000Z', publishedAt: '2026-10-21T02:00:00.000Z',
        artifact: {
          zip: { name: 'game-demo_v0.1.1_aaaaaaa.zip', url: 'https://github.example/zip', size: 123, digest: `sha256:${'b'.repeat(64)}` },
          manifest: { name: 'manifest.json', url: 'https://github.example/manifest', size: 45, digest: `sha256:${'c'.repeat(64)}` },
          checksum: { name: 'checksums.txt', url: 'https://github.example/checksum', size: 80, digest: `sha256:${'d'.repeat(64)}` },
          zipSha256: 'b'.repeat(64), manifestSchemaVersion: 1, fileCount: 12,
          minimumSchemaVersion: null, completeness: 'complete', integrity: 'verified',
        },
      }] : [], issues: [],
    })),
    issues: [],
  }
}

test('完整 Snapshot 契約可通過', () => {
  const value = snapshot()
  assert.equal(validateReleaseConsoleSnapshot(value), value)
})

test('Project 白名單、來源與 Deployment 列舉不可由前端猜測', () => {
  const missingProject = snapshot()
  missingProject.projects.pop()
  assert.throws(() => validateReleaseConsoleSnapshot(missingProject), /白名單完整輸出/)

  const unavailableAsEmpty = snapshot()
  unavailableAsEmpty.sources.githubDeployments = 'empty'
  assert.throws(() => validateReleaseConsoleSnapshot(unavailableAsEmpty), /列舉值錯誤/)

  const invalidSmoke = snapshot()
  invalidSmoke.projects[0].deployments[0].smoke = 'probably'
  assert.throws(() => validateReleaseConsoleSnapshot(invalidSmoke), /列舉值錯誤/)
})

test('問題狀態使用固定代碼與嚴重度', () => {
  const value = snapshot()
  value.status = 'degraded'
  value.issues.push({ code: 'SOURCE_UNAVAILABLE', severity: 'warning', source: 'cloudflareDeployments', message: '暫時無法查詢', occurredAt: value.generatedAt })
  assert.doesNotThrow(() => validateReleaseConsoleSnapshot(value))
  value.issues[0].code = 'SOMETHING_ELSE'
  assert.throws(() => validateReleaseConsoleSnapshot(value), /列舉值錯誤/)
})

test('Release 與 Artifact 必須提供完整且可判讀的欄位', () => {
  const missingAsset = snapshot()
  delete missingAsset.projects[0].releases[0].artifact.manifest.url
  assert.throws(() => validateReleaseConsoleSnapshot(missingAsset), /manifest Asset 缺少 url/)

  const invalidIntegrity = snapshot()
  invalidIntegrity.projects[0].releases[0].artifact.integrity = 'maybe'
  assert.throws(() => validateReleaseConsoleSnapshot(invalidIntegrity), /列舉值錯誤/)

  const danglingCurrent = snapshot()
  danglingCurrent.projects[0].currentDeploymentId = 999
  assert.throws(() => validateReleaseConsoleSnapshot(danglingCurrent), /找不到對應 Deployment/)

  const incomplete = snapshot()
  incomplete.projects[0].releases[0].artifact.manifest = null
  incomplete.projects[0].releases[0].artifact.completeness = 'missing_assets'
  incomplete.projects[0].releases[0].artifact.integrity = 'unavailable'
  assert.doesNotThrow(() => validateReleaseConsoleSnapshot(incomplete))
})
