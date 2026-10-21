import assert from 'node:assert/strict'
import test from 'node:test'
import {
  safeRelativePath,
  validateArchiveEntries,
  validateManifest,
} from '../scripts/download-release-package.mjs'

const expected = {
  project: 'game-demo', target: 'game-demo-staging', version: '0.1.0', tag: 'dep_game-demo_v0.1.0', database: false,
}
const validManifest = {
  schemaVersion: 1,
  ...expected,
  commit: 'a'.repeat(40),
  files: [{ path: 'index.html', bytes: 12, sha256: 'b'.repeat(64) }],
}

test('Release 路徑只接受安全相對路徑', () => {
  assert.equal(safeRelativePath('assets/index.js'), true)
  for (const value of ['', '/etc/passwd', '../secret', 'site/../../secret', 'site\\secret', './index.html']) {
    assert.equal(safeRelativePath(value), false, value)
  }
})

test('ZIP 拒絕路徑穿越、符號連結與異常大小', () => {
  assert.deepEqual(validateArchiveEntries([{ name: 'release/site/index.html', bytes: 12, symlink: false }]), { count: 1, totalBytes: 12 })
  assert.throws(() => validateArchiveEntries([{ name: '../secret', bytes: 1, symlink: false }]), /不安全路徑/)
  assert.throws(() => validateArchiveEntries([{ name: 'release/link', bytes: 1, symlink: true }]), /符號連結/)
  assert.throws(() => validateArchiveEntries([{ name: 'release/huge', bytes: 26 * 1024 * 1024, symlink: false }]), /大小異常/)
})

test('manifest 綁定 Project、Target、Tag 並拒絕重複檔案', () => {
  assert.deepEqual(validateManifest(validManifest, expected), { count: 1, totalBytes: 12 })
  assert.throws(() => validateManifest({ ...validManifest, tag: 'dep_game-demo_v9.9.9' }, expected), /tag 不一致/)
  assert.throws(() => validateManifest({ ...validManifest, files: [validManifest.files[0], validManifest.files[0]] }, expected), /重複/)
})

test('D1 Project 必須宣告最低 Schema，靜態 Project 不得偽造', () => {
  assert.doesNotThrow(() => validateManifest({ ...validManifest, project: 'project-b', target: 'project-b-staging', tag: 'dep_project-b_v1.0.0', minimumSchemaVersion: '0004_project_b_employees.sql' }, { project: 'project-b', target: 'project-b-staging', version: '0.1.0', tag: 'dep_project-b_v1.0.0', database: true }))
  assert.throws(() => validateManifest(validManifest, { ...expected, database: true }), /minimumSchemaVersion/)
  assert.throws(() => validateManifest({ ...validManifest, minimumSchemaVersion: '0004_fake.sql' }, expected), /不得宣告/)
})
