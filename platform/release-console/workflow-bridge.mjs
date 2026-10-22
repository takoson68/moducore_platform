import { execFile } from 'node:child_process'
import { appendFile, mkdir } from 'node:fs/promises'
import { dirname } from 'node:path'
import { promisify } from 'node:util'
import { randomUUID } from 'node:crypto'
import { authorizeConsoleAction, validateAuditEvent } from './access-policy.mjs'
import { releaseConsoleProjects } from '../worker/scripts/release-console-contract.mjs'
import { parseDeploymentTag } from '../worker/scripts/release-plan.mjs'

const exec = promisify(execFile)
const repository = 'takoson68/moducore_platform'
const workflow = 'deploy-staging.yml'
const activeResults = new Set(['queued', 'running'])

function operationTarget(projectKey) {
  return releaseConsoleProjects.find((item) => item.key === projectKey) || null
}

// 控制台只接受正式 Tag 與 Release 原件，不接受任意 Ref、Project 或動作。
export function validateWorkflowRequest(input) {
  if (!['deploy', 'rollback'].includes(input.action)) throw new Error('ACTION_NOT_ALLOWED')
  const project = operationTarget(input.project)
  if (!project) throw new Error('PROJECT_NOT_ALLOWED')
  const plan = parseDeploymentTag(input.tag)
  if (plan.projectKey !== input.project) throw new Error('TAG_PROJECT_MISMATCH')
  if (!/^[a-f0-9]{40}$/.test(input.commit || '')) throw new Error('COMMIT_NOT_ALLOWED')
  for (const field of ['tag', 'version', 'commit', 'deploymentId', 'cloudflareVersionId']) {
    if (!(field in (input.source || {}))) throw new Error(`SOURCE_${field.toUpperCase()}_REQUIRED`)
  }
  return { action: input.action, project, tag: input.tag, version: plan.version, commit: input.commit }
}

// 真實 adapter 只透過既有 GitHub Workflow Dispatch，不直接持有 Cloudflare 寫入能力。
export async function dispatchGitHubWorkflow(operation) {
  await exec('gh', ['workflow', 'run', workflow, '--repo', repository, '--ref', 'world-oop',
    '-f', `target=${operation.projectKey}`, '-f', `ref=${operation.tag}`,
    '-f', 'artifact_source=release', '-f', 'simulate_failure=false', '-f', `operation_id=${operation.id}`],
  { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  return { status: 'queued', runId: null, runUrl: null }
}

async function findWorkflowRun(operation) {
  const { stdout } = await exec('gh', ['run', 'list', '--repo', repository, '--workflow', workflow, '--event', 'workflow_dispatch', '--limit', '30', '--json', 'databaseId,displayTitle,status,conclusion,url'], { encoding: 'utf8', maxBuffer: 2 * 1024 * 1024 })
  return JSON.parse(stdout).find((item) => item.displayTitle?.includes(operation.id)) || null
}

// 以 run-name 中的 Operation ID 定位唯一 Run，並轉換為控制台狀態。
export function mapWorkflowRunStatus(run) {
  if (!run) return { status: 'queued', runId: null, runUrl: null }
  if (run.status === 'queued' || run.status === 'requested') return { status: 'queued', runId: run.databaseId, runUrl: run.url }
  if (run.status !== 'completed') return { status: 'running', runId: run.databaseId, runUrl: run.url }
  return { status: run.conclusion === 'success' ? 'success' : run.conclusion === 'cancelled' ? 'cancelled' : 'failed', runId: run.databaseId, runUrl: run.url }
}

export async function readGitHubWorkflowStatus(operation) {
  return mapWorkflowRunStatus(await findWorkflowRun(operation))
}

// 僅取消已由 Operation ID 精確找到、且尚未開始的 GitHub Run。
export async function cancelGitHubWorkflow(operation) {
  const run = await findWorkflowRun(operation)
  if (!run) throw new Error('WORKFLOW_RUN_NOT_FOUND')
  if (run.status !== 'queued' && run.status !== 'requested') throw new Error('OPERATION_NOT_QUEUED')
  await exec('gh', ['run', 'cancel', String(run.databaseId), '--repo', repository], { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  return { status: 'cancelled', runId: run.databaseId, runUrl: run.url }
}

// 將控制台操作接到既有 Staging Workflow；永遠使用 Release 原件，不直接呼叫 Cloudflare。
export function createGitHubWorkflowAdapter({ dispatch = dispatchGitHubWorkflow, readStatus = readGitHubWorkflowStatus, cancel = cancelGitHubWorkflow } = {}) {
  return {
    mode: 'controlled',
    async submit(operation) {
      if (!['deploy', 'rollback'].includes(operation.action)) throw new Error('ACTION_NOT_SUPPORTED')
      validateWorkflowRequest({
        action: operation.action,
        project: operation.project,
        tag: operation.tag,
        commit: operation.destination.commit,
        source: operation.source,
      })
      return dispatch({ ...operation, projectKey: operation.project, commit: operation.destination.commit })
    },
    async refresh(operation) { return readStatus(operation) },
    async cancel(operation) { return cancel(operation) },
  }
}

// Audit 使用 append-only NDJSON；每次狀態變化新增一列，不覆寫舊事件。
export function fileAuditSink(path) {
  return async (event) => {
    validateAuditEvent(event)
    await mkdir(dirname(path), { recursive: true })
    await appendFile(path, `${JSON.stringify(event)}\n`, { encoding: 'utf8', mode: 0o600 })
  }
}

function auditEvent(operation, result, reasonCode, now) {
  return {
    schemaVersion: 1, eventId: randomUUID(), occurredAt: now, requestId: operation.requestId, operationId: operation.id,
    actor: operation.actor, action: operation.action, project: operation.projectKey, target: operation.target,
    source: operation.source, destination: operation.destination, result, reasonCode,
    workflowRunId: operation.runId, githubDeploymentId: null, cloudflareVersionId: null,
  }
}

// Operation controller 提供 Project 互斥、狀態更新及完整 Audit；不同 Project 可並行。
export function createOperationController({ dispatch = dispatchGitHubWorkflow, readStatus = readGitHubWorkflowStatus, audit = async () => {}, clock = () => new Date().toISOString(), id = randomUUID } = {}) {
  const operations = new Map()
  return {
    async start(input) {
      const validated = validateWorkflowRequest(input)
      const timestamp = clock()
      const operation = {
        id: id(), requestId: input.requestId || id(), action: validated.action, projectKey: input.project,
        target: validated.project.target, tag: validated.tag, status: 'queued', runId: null, runUrl: null,
        actor: { provider: 'github', id: input.actor.id, login: input.actor.login, role: input.actor.role, repositoryPermission: input.actor.repositoryPermission },
        source: input.source, destination: { tag: validated.tag, version: validated.version, commit: validated.commit },
        createdAt: timestamp, updatedAt: timestamp,
      }
      const authorization = authorizeConsoleAction({ role: input.actor?.role, capability: validated.action, authenticatedAt: input.actor?.authenticatedAt, now: clock(), confirmation: input.confirmation, project: input.project, tag: input.tag })
      if (!authorization.allowed) {
        await audit(auditEvent(operation, 'rejected', authorization.reasonCode, operation.createdAt))
        throw new Error(authorization.reasonCode)
      }
      if ([...operations.values()].some((item) => item.projectKey === input.project && activeResults.has(item.status))) {
        await audit(auditEvent(operation, 'rejected', 'PROJECT_BUSY', operation.createdAt))
        throw new Error('PROJECT_BUSY')
      }
      operations.set(operation.id, operation)
      await audit(auditEvent(operation, 'queued', 'AUTHORIZED', operation.createdAt))
      try {
        Object.assign(operation, await dispatch(operation), { updatedAt: clock() })
      } catch {
        operation.status = 'failed'; operation.updatedAt = clock()
        await audit(auditEvent(operation, 'failed', 'DISPATCH_FAILED', operation.updatedAt))
      }
      return { ...operation }
    },
    async refresh(operationId) {
      const operation = operations.get(operationId)
      if (!operation) throw new Error('OPERATION_NOT_FOUND')
      if (!activeResults.has(operation.status)) return { ...operation }
      const previous = operation.status
      Object.assign(operation, await readStatus(operation), { updatedAt: clock() })
      if (operation.status !== previous) await audit(auditEvent(operation, operation.status, `WORKFLOW_${operation.status.toUpperCase()}`, operation.updatedAt))
      return { ...operation }
    },
    list() { return [...operations.values()].map((item) => ({ ...item })) },
  }
}
