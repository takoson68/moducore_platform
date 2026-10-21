import assert from 'node:assert/strict'
import test from 'node:test'
import { authorizeGitHubIdentity, loadAccessPolicy } from '../github-identity.mjs'

test('GitHub 不可變 ID 命中白名單並受 Repository 權限降級', async () => {
  const policy = await loadAccessPolicy()
  const authenticatedAt = '2026-10-21T08:00:00.000Z'
  const admin = authorizeGitHubIdentity({ provider: 'github', id: 95896770, login: 'takoson68', repositoryPermission: 'admin' }, policy, authenticatedAt)
  assert.equal(admin.role, 'admin')
  assert.equal(admin.authenticatedAt, authenticatedAt)
  assert.equal(authorizeGitHubIdentity({ provider: 'github', id: 95896770, login: 'renamed-account', repositoryPermission: 'write' }, policy, authenticatedAt).role, 'deployer')
  assert.equal(authorizeGitHubIdentity({ provider: 'github', id: 999, login: 'unknown', repositoryPermission: 'admin' }, policy, authenticatedAt), null)
})
