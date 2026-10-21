import { randomUUID } from 'node:crypto'
import { authorizeConsoleAction } from './access-policy.mjs'
import { authorizeGitHubIdentity, loadAccessPolicy, resolveCliGitHubIdentity } from './github-identity.mjs'
import { releaseConsoleProjects } from '../worker/scripts/release-console-contract.mjs'

const terminal = new Set(['success', 'failed', 'cancelled'])
const allowedActions = new Set(['deploy', 'rollback', 'delete_release', 'delete_artifact'])

function fail(code) { throw new Error(code) }
function projectFrom(snapshot, key) { return snapshot.projects.find((item) => item.key === key) || fail('PROJECT_NOT_ALLOWED') }
function deployment(project, position) { return project.deployments.find((item) => item.position === position) || null }
function verifiedRelease(project, tag) { return project.releases.find((item) => item.tag === tag && item.artifact.completeness === 'complete' && item.artifact.integrity === 'verified') || null }
function safeActor(actor) { return { provider: actor.provider, id: actor.id, login: actor.login, role: actor.role, repositoryPermission: actor.repositoryPermission } }

export function createSimulationAdapter({ clock = () => new Date().toISOString() } = {}) {
  const refreshes = new Map()
  return {
    mode: 'simulation',
    async submit(operation) { return { status: 'queued', simulatedAt: clock(), operationId: operation.id } },
    async refresh(operation) {
      const count = (refreshes.get(operation.id) || 0) + 1
      refreshes.set(operation.id, count)
      return { status: count === 1 ? operation.status : operation.status === 'queued' ? 'running' : 'success' }
    },
    async cancel() { return { status: 'cancelled' } },
  }
}

export function createConsoleOperations({ snapshotLoader, identityLoader, policyLoader = loadAccessPolicy, adapter = createSimulationAdapter(), audit = async () => {}, clock = () => new Date().toISOString(), id = randomUUID } = {}) {
  const operations = new Map()
  const authenticate = async () => {
    const policy = await policyLoader()
    const identity = await (identityLoader || (() => resolveCliGitHubIdentity(policy.repository)))()
    return authorizeGitHubIdentity(identity, policy, clock()) || fail('IDENTITY_FORBIDDEN')
  }
  const record = async (operation, result, reasonCode) => audit({
    schemaVersion: 1, eventId: id(), occurredAt: clock(), requestId: operation.requestId, operationId: operation.id,
    actor: operation.actor, action: operation.action, project: operation.project, target: operation.target,
    source: operation.source, destination: operation.destination, result, reasonCode,
    workflowRunId: operation.runId || null, githubDeploymentId: null, cloudflareVersionId: null,
  })

  return {
    mode: adapter.mode || 'controlled',
    async session() {
      const actor = await authenticate()
      return { actor: safeActor(actor), authenticatedAt: actor.authenticatedAt, mode: adapter.mode || 'controlled' }
    },
    async start(input) {
      if (!allowedActions.has(input.action)) fail('ACTION_NOT_ALLOWED')
      const [actor, snapshot] = await Promise.all([authenticate(), snapshotLoader()])
      const project = projectFrom(snapshot, input.project)
      const current = deployment(project, 'current')
      const previous = deployment(project, 'previous')
      if (!current) fail('CURRENT_MISSING')
      let targetTag = input.tag
      if (input.action === 'rollback') {
        if (!previous || input.tag !== previous.tag) fail('PREVIOUS_REQUIRED')
        targetTag = previous.tag
      }
      let releases = [verifiedRelease(project, targetTag)]
      if (input.action.startsWith('delete_') && Array.isArray(input.tags)) {
        const tags = [...new Set(input.tags)]
        if (!tags.length || tags.length > 20) fail('BATCH_SIZE_INVALID')
        releases = tags.map((tag) => verifiedRelease(project, tag))
        if (releases.some((item) => !item)) fail('VERIFIED_RELEASE_REQUIRED')
        targetTag = tags.sort().join(',')
      }
      const release = releases[0]
      if (!release) fail('VERIFIED_RELEASE_REQUIRED')
      if (input.action.startsWith('delete_')) {
        const deletionTags = targetTag.split(',')
        if (deletionTags.includes(current.tag)) fail('CURRENT_PROTECTED')
        if (previous && deletionTags.includes(previous.tag)) fail('PREVIOUS_PROTECTED')
        if (project.releases.filter((item) => item.artifact.completeness === 'complete' && item.artifact.integrity === 'verified' && !deletionTags.includes(item.tag)).length < 1) fail('LAST_VERIFIED_RELEASE')
      }
      const fixed = releaseConsoleProjects.find((item) => item.key === input.project)
      const operation = {
        id: id(), requestId: input.requestId || id(), action: input.action, project: input.project, target: fixed.target,
        tag: targetTag, status: 'queued', runId: null, runUrl: null, actor: safeActor(actor),
        source: { tag: current.tag, version: current.version, commit: current.commit, deploymentId: current.id, cloudflareVersionId: current.cloudflareVersionId },
        destination: { tag: targetTag, version: releases.length > 1 ? 'batch' : release.version, commit: release.commit },
        impact: input.action === 'delete_release' ? targetTag.split(',').map((tag) => `${tag}：GitHub Release 與其附加資產將不可恢復`) : input.action === 'delete_artifact' ? targetTag.split(',').map((tag) => `${tag}：Release ZIP、manifest 與 checksum 將不可恢復`) : [],
        mode: adapter.mode || 'controlled', createdAt: clock(), updatedAt: clock(),
      }
      const authorization = authorizeConsoleAction({ role: actor.role, capability: input.action, authenticatedAt: actor.authenticatedAt, now: clock(), confirmation: input.confirmation, project: input.project, tag: targetTag })
      if (!authorization.allowed) { await record(operation, 'rejected', authorization.reasonCode); fail(authorization.reasonCode) }
      if ([...operations.values()].some((item) => item.project === input.project && !terminal.has(item.status))) { await record(operation, 'rejected', 'PROJECT_BUSY'); fail('PROJECT_BUSY') }
      operations.set(operation.id, operation)
      await record(operation, 'queued', 'AUTHORIZED')
      try { Object.assign(operation, await adapter.submit(operation), { updatedAt: clock() }) }
      catch { operation.status = 'failed'; operation.updatedAt = clock(); await record(operation, 'failed', 'SUBMIT_FAILED') }
      return { ...operation }
    },
    async cancel(input) {
      const actor = await authenticate()
      const operation = operations.get(input.operationId)
      if (!operation) fail('OPERATION_NOT_FOUND')
      if (operation.status !== 'queued') fail('OPERATION_NOT_QUEUED')
      const authorization = authorizeConsoleAction({ role: actor.role, capability: 'cancel', authenticatedAt: actor.authenticatedAt, now: clock(), confirmation: input.confirmation, project: operation.project, tag: operation.tag })
      if (!authorization.allowed) fail(authorization.reasonCode)
      Object.assign(operation, await adapter.cancel(operation), { updatedAt: clock(), actor: safeActor(actor) })
      await record(operation, 'cancelled', 'CANCELLED_BY_OPERATOR')
      return { ...operation }
    },
    async refreshAll() {
      for (const operation of operations.values()) {
        if (terminal.has(operation.status)) continue
        const before = operation.status
        Object.assign(operation, await adapter.refresh(operation), { updatedAt: clock() })
        if (before !== operation.status) await record(operation, operation.status, `OPERATION_${operation.status.toUpperCase()}`)
      }
      return [...operations.values()].map((item) => ({ ...item }))
    },
    list() { return [...operations.values()].map((item) => ({ ...item })) },
  }
}
