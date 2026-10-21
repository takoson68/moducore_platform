import test from 'node:test'
import assert from 'node:assert/strict'
import { manualDeploymentPlan, parseDeploymentTag } from '../scripts/release-plan.mjs'

test('部署 Tag 只解析白名單專案與語意版本', () => {
  assert.deepEqual(parseDeploymentTag('dep_game-demo_v0.1.0'), {
    target: 'game-demo-staging', project: 'game-demo', database: false,
    projectKey: 'game-demo', version: '0.1.0', tag: 'dep_game-demo_v0.1.0',
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
