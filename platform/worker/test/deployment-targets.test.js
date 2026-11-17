import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deploymentTarget } from '../scripts/deployment-targets.mjs'

test('固定目標各自核對 Project、網址、設定與獨立 D1', () => {
  const a = deploymentTarget('dinecore-staging')
  const b = deploymentTarget('project-b-staging')
  const c = deploymentTarget('eatgomap-staging')
  const yiLy = deploymentTarget('yi-ly-staging')
  assert.equal(a.project, 'dineCore')
  assert.equal(b.project, 'project-b')
  assert.equal(c.project, 'eatGoMap')
  assert.equal(c.database, 'eatgomap-staging-db')
  assert.equal(c.base, 'https://eatgomap-staging.takoson68.workers.dev')
  assert.equal(yiLy.project, 'yi-ly')
  assert.equal(yiLy.database, 'yi-ly-staging-db')
  assert.equal(yiLy.base, 'https://yi-ly-staging.takoson68.workers.dev')
  for (const key of ['config', 'base', 'database', 'databaseId']) assert.notEqual(a[key], b[key])
  assert.equal(deploymentTarget().name, 'moducore-staging')
  for (const name of ['../wrangler', 'toString', 'https://example.test', 'production']) {
    assert.throws(() => deploymentTarget(name))
  }
})
