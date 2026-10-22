import test from 'node:test'
import assert from 'node:assert/strict'
import { assertNewTagPush, manualDeploymentPlan, parseDeploymentTag } from '../scripts/release-plan.mjs'

test('Tag push 只接受首次建立，手動救援不受影響', () => {
  assert.doesNotThrow(() => assertNewTagPush('push', 'true'))
  assert.throws(() => assertNewTagPush('push', 'false'), /首次建立/)
  assert.throws(() => assertNewTagPush('push', ''), /首次建立/)
  assert.doesNotThrow(() => assertNewTagPush('workflow_dispatch', 'false'))
})

test('部署 Tag 只解析白名單專案與語意版本', () => {
  assert.deepEqual(parseDeploymentTag('dep_game-demo_v0.1.0'), {
    target: 'game-demo-staging', project: 'game-demo', database: false,
    projectKey: 'game-demo', version: '0.1.0', tag: 'dep_game-demo_v0.1.0', artifactSource: 'build',
  })
  assert.equal(parseDeploymentTag('dep_dinecore_v1.2.3-rc.1').target, 'dinecore-staging')
  assert.equal(parseDeploymentTag('dep_project-b_v2.0.0').database, true)
})

test('一般分支、未知專案與不完整版本不能成為部署 Tag', () => {
  for (const value of ['world-oop', 'dep_game-demo', 'dep_unknown_v1.0.0', 'dep_game-demo_v1']) {
    assert.throws(() => parseDeploymentTag(value), /部署 Tag 格式錯誤/)
  }
})

test('手動救援只允許單一白名單專案', () => {
  assert.equal(manualDeploymentPlan('project-b', 'abc123').target, 'project-b-staging')
  assert.throws(() => manualDeploymentPlan('all'), /未知的手動部署專案/)
})

test('手動救援使用正式 Tag 時保留版本，且拒絕跨專案 Tag', () => {
  const plan = manualDeploymentPlan('game-demo', 'dep_game-demo_v0.1.0')
  assert.equal(plan.version, '0.1.0')
  assert.equal(plan.tag, 'dep_game-demo_v0.1.0')
  assert.throws(
    () => manualDeploymentPlan('game-demo', 'dep_project-b_v1.0.0'),
    /專案與 Tag 不一致/,
  )
})

test('Release 原件模式只接受同專案正式 Tag', () => {
  const plan = manualDeploymentPlan('game-demo', 'dep_game-demo_v0.1.0', 'release')
  assert.equal(plan.artifactSource, 'release')
  assert.equal(plan.version, '0.1.0')
  assert.throws(() => manualDeploymentPlan('game-demo', 'world-oop', 'release'), /必須指定部署 Tag/)
  assert.throws(() => manualDeploymentPlan('game-demo', 'dep_project-b_v1.0.0', 'release'), /專案與 Tag 不一致/)
  assert.throws(() => manualDeploymentPlan('game-demo', '', 'unknown'), /未知的成品來源/)
})
