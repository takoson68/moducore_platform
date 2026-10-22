import test from 'node:test'
import assert from 'node:assert/strict'
import { assertProductionIsolation, parseProductionTag, productionTargets } from '../scripts/production-release-plan.mjs'

const stagingTargets = ['game-demo-staging', 'dinecore-staging', 'project-b-staging']

test('Production Tag 只接受三個白名單專案與完整 SemVer', () => {
  assert.deepEqual(parseProductionTag('prod_game-demo_v1.0.0'), {
    target: 'game-demo-production', project: 'game-demo', database: false, databaseName: null,
    projectKey: 'game-demo', version: '1.0.0', tag: 'prod_game-demo_v1.0.0',
    environment: 'production', artifactSource: 'build',
  })
  assert.equal(parseProductionTag('prod_dinecore_v1.2.3-rc.1').target, 'dinecore-production')
  assert.equal(parseProductionTag('prod_project-b_v2.0.0').databaseName, 'project-b-production-db')
})

test('Staging Tag、Branch、未知專案與不完整版本不能發布 Production', () => {
  for (const value of ['world-oop', 'dep_game-demo_v1.0.0', 'prod_unknown_v1.0.0', 'prod_game-demo_v1']) {
    assert.throws(() => parseProductionTag(value), /正式發布 Tag 格式錯誤/)
  }
})

test('Production 計畫不得重用 Staging Worker、Environment 或 D1 名稱', () => {
  for (const tag of ['prod_game-demo_v1.0.0', 'prod_dinecore_v1.0.0', 'prod_project-b_v1.0.0']) {
    assert.equal(assertProductionIsolation(parseProductionTag(tag), stagingTargets).environment, 'production')
  }
  assert.throws(() => assertProductionIsolation({ ...parseProductionTag('prod_game-demo_v1.0.0'), target: 'game-demo-staging' }, stagingTargets), /REUSES_STAGING/)
  assert.throws(() => assertProductionIsolation({ ...productionTargets.dinecore, environment: 'staging' }, stagingTargets), /ENVIRONMENT_REQUIRED/)
  assert.throws(() => assertProductionIsolation({ ...productionTargets.dinecore, environment: 'production', databaseName: 'dinecore-staging-db' }, stagingTargets), /DATABASE_REUSES_STAGING/)
})
