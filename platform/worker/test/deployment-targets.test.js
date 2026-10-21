import { test } from 'node:test'
import assert from 'node:assert/strict'
import { deploymentTarget } from '../scripts/deployment-targets.mjs'

test('固定目標各自核對 Project、網址、設定與獨立 D1', () => {
  const a = deploymentTarget('dinecore-staging')
  const b = deploymentTarget('project-b-staging')
  assert.equal(a.project, 'dineCore')
  assert.equal(b.project, 'project-b')
  for (const key of ['config', 'base', 'database', 'databaseId']) assert.notEqual(a[key], b[key])
  assert.equal(deploymentTarget().name, 'moducore-staging')
  for (const name of ['../wrangler', 'toString', 'https://example.test', 'production']) {
    assert.throws(() => deploymentTarget(name))
  }
})
