import assert from 'node:assert/strict'
import test from 'node:test'
import { assessReleaseStorage, assertReleaseDeletionAllowed, releaseRetentionPolicy } from '../retention-policy.mjs'

const asset = (size) => ({ completeness: 'complete', integrity: 'verified', zip: { size }, manifest: { size: 100 }, checksum: { size: 100 } })
const release = (tag, publishedAt = '2026-08-01T00:00:00.000Z', size = 1000) => ({ tag, publishedAt, artifact: asset(size) })

test('Release 永久保存、Artifact 七天且刪除至少留下三個 verified 版本', () => {
  assert.equal(releaseRetentionPolicy.releaseRetention, 'permanent')
  assert.equal(releaseRetentionPolicy.actionsArtifactDays, 7)
  const project = { releases: [release('v1'), release('v2'), release('v3'), release('v4')] }
  assert.equal(assertReleaseDeletionAllowed(project, ['v1'], '2026-10-22T00:00:00.000Z'), true)
  assert.throws(() => assertReleaseDeletionAllowed(project, ['v1', 'v2'], '2026-10-22T00:00:00.000Z'), /MINIMUM_VERIFIED_RELEASES/)
})

test('未滿最低保留數時全部保存，且 30 天冷卻期內禁止刪除', () => {
  assert.throws(() => assertReleaseDeletionAllowed({ releases: [release('v1')] }, ['v1'], '2026-10-22T00:00:00.000Z'), /MINIMUM_VERIFIED_RELEASES/)
  const project = { releases: [release('v1', '2026-10-01T00:00:00.000Z'), release('v2'), release('v3'), release('v4')] }
  assert.throws(() => assertReleaseDeletionAllowed(project, ['v1'], '2026-10-22T00:00:00.000Z'), /RELEASE_COOLDOWN_ACTIVE/)
})

test('容量警戒線可判斷 normal、warning、critical 與 R2 評估時機', () => {
  const normal = assessReleaseStorage([{ key: 'game-demo', releases: [release('v1')] }])
  assert.deepEqual({ severity: normal.severity, evaluateR2: normal.evaluateR2 }, { severity: 'normal', evaluateR2: false })
  const warning = assessReleaseStorage([{ key: 'game-demo', releases: Array.from({ length: 20 }, (_, i) => release(`v${i}`)) }])
  assert.equal(warning.severity, 'warning')
  const critical = assessReleaseStorage([{ key: 'game-demo', releases: Array.from({ length: 40 }, (_, i) => release(`v${i}`)) }])
  assert.deepEqual({ severity: critical.severity, evaluateR2: critical.evaluateR2 }, { severity: 'critical', evaluateR2: true })
})
