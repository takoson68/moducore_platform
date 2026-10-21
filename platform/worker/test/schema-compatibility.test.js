import assert from 'node:assert/strict'
import test from 'node:test'
import { evaluateSchemaCompatibility, orderedMigrations } from '../scripts/schema-compatibility.mjs'

const available = ['0001_init.sql', '0002_auth.sql', '0003_members.sql']

test('最低 Schema 由連續正式 Migration 推導', () => {
  const migrations = orderedMigrations(new URL('../migrations', import.meta.url))
  assert.equal(migrations.at(-1), '0004_project_b_employees.sql')
})

test('遠端低於最低需求時只允許先 Migration，不宣告相容', () => {
  assert.deepEqual(evaluateSchemaCompatibility({
    available, applied: ['0001_init.sql'], minimum: '0002_auth.sql',
  }), {
    minimum: '0002_auth.sql', current: '0001_init.sql', compatible: false,
    needsMigration: true, pending: ['0002_auth.sql', '0003_members.sql'],
  })
  assert.throws(() => evaluateSchemaCompatibility({
    available, applied: ['0001_init.sql'], minimum: '0002_auth.sql', requireMinimum: true,
  }), /尚未達最低需求/)
})

test('遠端已達最低需求時相容，較新的 Schema 不會被倒退', () => {
  const result = evaluateSchemaCompatibility({
    available, applied: available, minimum: '0002_auth.sql', requireMinimum: true,
  })
  assert.equal(result.compatible, true)
  assert.equal(result.current, '0003_members.sql')
  assert.deepEqual(result.pending, [])
})

test('未知、跳號或不存在的 Migration 一律拒絕', () => {
  assert.throws(() => evaluateSchemaCompatibility({ available, applied: ['9999_unknown.sql'], minimum: available[0] }), /未知 Migration/)
  assert.throws(() => evaluateSchemaCompatibility({ available, applied: ['0001_init.sql', '0003_members.sql'], minimum: available[0] }), /連續前綴/)
  assert.throws(() => evaluateSchemaCompatibility({ available, applied: [], minimum: '0009_missing.sql' }), /不存在/)
})
