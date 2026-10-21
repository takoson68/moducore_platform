import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import { resolve } from 'node:path'
import {
  RELEASE_CONSOLE_SCHEMA_VERSION,
  releaseConsoleProjects,
  validateReleaseConsoleSnapshot,
} from '../worker/scripts/release-console-contract.mjs'

const exec = promisify(execFile)
const repository = 'takoson68/moducore_platform'
const workerRoot = resolve(import.meta.dirname, '../worker')

export const workerConfigs = Object.freeze({
  'game-demo': 'wrangler.game-demo-staging.json',
  dinecore: 'wrangler.dinecore-staging.json',
  'project-b': 'wrangler.project-b-staging.json',
})

async function commandJson(command, args, options = {}) {
  const { stdout } = await exec(command, args, { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024, ...options })
  return JSON.parse(stdout)
}

function assetDescriptor(asset) {
  return asset ? { name: asset.name, url: asset.browser_download_url, size: asset.size, digest: asset.digest || null } : null
}

function deploymentFromApi(item, position) {
  const payload = item.payload
  return {
    id: item.id,
    position,
    status: item.state,
    createdAt: item.created_at,
    project: payload.project,
    target: payload.target,
    version: payload.version,
    tag: payload.tag,
    sourceRef: payload.sourceRef,
    commit: payload.commit,
    cloudflareVersionId: payload.cloudflareVersionId,
    environmentUrl: item.environment_url || null,
    runUrl: payload.runUrl || null,
    releaseUrl: payload.releaseUrl || null,
    artifactSource: payload.artifactSource || 'build',
    artifactName: payload.artifact,
    zipSha256: payload.zipSha256,
    minimumSchemaVersion: payload.minimumSchemaVersion || null,
    smoke: payload.smoke || 'unknown',
  }
}

export function assembleSnapshot({ deployments, releases, cloudflare, actions = [], generatedAt = new Date().toISOString(), sourceErrors = {} }) {
  const source = (name) => sourceErrors[name] ? 'unavailable' : 'ok'
  const projects = releaseConsoleProjects.map((fixed) => {
    const matchingDeployments = deployments
      .filter((item) => item.environment === fixed.environment && item.payload?.target === fixed.target)
      .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    const current = matchingDeployments.find((item) => item.state === 'success' && item.payload?.smoke === 'passed') || null
    const previous = matchingDeployments.find((item) => item.id !== current?.id && ['success', 'inactive'].includes(item.state) && item.payload?.smoke === 'passed') || null
    const deploymentRows = matchingDeployments.map((item) => deploymentFromApi(item, item.id === current?.id ? 'current' : item.id === previous?.id ? 'previous' : 'historical'))
    const projectReleases = releases.filter((item) => item.projectKey === fixed.key)
    const issues = []
    const actualVersion = cloudflare[fixed.key]?.versionId || null
    if (!current) issues.push({ code: 'CURRENT_MISSING', severity: 'error', source: 'githubDeployments', message: '找不到 Smoke 通過的 current Deployment', occurredAt: generatedAt })
    if (current && actualVersion && current.payload.cloudflareVersionId !== actualVersion) issues.push({ code: 'CLOUDFLARE_VERSION_MISMATCH', severity: 'error', source: 'cloudflareDeployments', message: 'GitHub Deployment 與 Cloudflare 線上版本不一致', occurredAt: generatedAt })
    for (const release of projectReleases) {
      if (release.artifact.completeness !== 'complete') issues.push({ code: 'RELEASE_INCOMPLETE', severity: 'error', source: 'githubReleases', message: `${release.tag} 缺少必要 Release 資產`, occurredAt: release.publishedAt })
      if (release.artifact.integrity === 'checksum_failed') issues.push({ code: 'CHECKSUM_FAILED', severity: 'error', source: 'githubReleases', message: `${release.tag} ZIP Hash 不一致`, occurredAt: release.publishedAt })
      if (release.artifact.integrity === 'manifest_invalid') issues.push({ code: 'MANIFEST_INVALID', severity: 'error', source: 'githubReleases', message: `${release.tag} manifest 無法驗證`, occurredAt: release.publishedAt })
    }
    const latestRun = actions.find((run) => run.projectKey === fixed.key)
    if (latestRun?.conclusion === 'failure') issues.push({ code: 'RUN_FAILED', severity: 'warning', source: 'githubActions', message: `最近失敗：${latestRun.name}`, occurredAt: latestRun.createdAt })
    for (const [name] of Object.entries(sourceErrors)) issues.push({ code: 'SOURCE_UNAVAILABLE', severity: 'warning', source: name, message: sourceErrors[name], occurredAt: generatedAt })
    const unavailable = !current || sourceErrors.githubDeployments
    const degraded = issues.length > 0
    return {
      ...fixed,
      status: unavailable ? 'unavailable' : degraded ? 'degraded' : 'healthy',
      currentDeploymentId: current?.id || null,
      previousDeploymentId: previous?.id || null,
      cloudflareCurrentVersionId: actualVersion,
      cloudflareDeployedAt: cloudflare[fixed.key]?.createdAt || null,
      deployments: deploymentRows,
      releases: projectReleases,
      issues,
    }
  })
  const issues = projects.flatMap((project) => project.issues)
  const snapshot = {
    schemaVersion: RELEASE_CONSOLE_SCHEMA_VERSION,
    generatedAt,
    status: projects.some((project) => project.status === 'unavailable') ? 'unavailable' : issues.length ? 'degraded' : 'healthy',
    sources: {
      githubDeployments: source('githubDeployments'),
      githubReleases: source('githubReleases'),
      githubActions: source('githubActions'),
      cloudflareDeployments: source('cloudflareDeployments'),
    },
    projects,
    issues,
  }
  return validateReleaseConsoleSnapshot(snapshot)
}

async function loadDeployments() {
  const rows = await commandJson('gh', ['api', '-X', 'GET', `repos/${repository}/deployments`, '-f', 'per_page=100'])
  const relevant = rows.filter((item) => releaseConsoleProjects.some((project) => project.environment === item.environment) && item.payload?.schemaVersion === 1)
  return Promise.all(relevant.map(async (item) => {
    const statuses = await commandJson('gh', ['api', '-X', 'GET', `repos/${repository}/deployments/${item.id}/statuses`, '-f', 'per_page=1'])
    return { ...item, state: statuses[0]?.state || 'unknown', environment_url: statuses[0]?.environment_url || null }
  }))
}

async function loadReleases() {
  const rows = await commandJson('gh', ['api', '-X', 'GET', `repos/${repository}/releases`, '-f', 'per_page=100'])
  return Promise.all(rows.filter((release) => /^dep_(game-demo|dinecore|project-b)_v\d+\.\d+\.\d+$/.test(release.tag_name)).map(async (release) => {
    const match = release.tag_name.match(/^dep_(game-demo|dinecore|project-b)_v(.+)$/)
    const projectKey = match[1]
    const zipAssets = release.assets.filter((asset) => asset.name.endsWith('.zip'))
    const manifestAssets = release.assets.filter((asset) => asset.name.endsWith('.manifest.json'))
    const checksumAssets = release.assets.filter((asset) => asset.name.endsWith('.sha256'))
    const complete = zipAssets.length === 1 && manifestAssets.length === 1 && checksumAssets.length === 1
    let manifest = null
    let checksum = null
    let integrity = complete ? 'not_checked' : 'unavailable'
    if (complete) {
      try {
        const [manifestResponse, checksumResponse] = await Promise.all([fetch(manifestAssets[0].browser_download_url), fetch(checksumAssets[0].browser_download_url)])
        if (!manifestResponse.ok || !checksumResponse.ok) throw new Error('asset download failed')
        manifest = await manifestResponse.json()
        checksum = (await checksumResponse.text()).trim().split(/\s+/)[0]
        const zipDigest = zipAssets[0].digest?.replace(/^sha256:/, '')
        if (checksum !== zipDigest) integrity = 'checksum_failed'
        else integrity = manifest.tag === release.tag_name && manifest.project === releaseConsoleProjects.find((item) => item.key === projectKey)?.project ? 'verified' : 'manifest_invalid'
      } catch {
        integrity = 'manifest_invalid'
      }
    }
    return {
      projectKey,
      tag: release.tag_name,
      version: match[2],
      commit: manifest?.commit || release.target_commitish,
      releaseUrl: release.html_url,
      builtAt: manifest?.builtAt || release.published_at,
      publishedAt: release.published_at,
      artifact: {
        zip: assetDescriptor(zipAssets[0]), manifest: assetDescriptor(manifestAssets[0]), checksum: assetDescriptor(checksumAssets[0]),
        zipSha256: checksum || zipAssets[0]?.digest?.replace(/^sha256:/, '') || null,
        manifestSchemaVersion: manifest?.schemaVersion || null,
        fileCount: manifest?.files?.length || null,
        minimumSchemaVersion: manifest?.minimumSchemaVersion || null,
        completeness: complete ? 'complete' : [zipAssets, manifestAssets, checksumAssets].some((assets) => assets.length > 1) ? 'duplicate_assets' : 'missing_assets',
        integrity,
      },
    }
  }))
}

async function loadCloudflare() {
  const entries = await Promise.all(Object.entries(workerConfigs).map(async ([key, config]) => {
    const rows = await commandJson('npx', ['wrangler', 'deployments', 'list', '--config', config, '--json'], { cwd: workerRoot })
    const current = rows.at(-1)
    return [key, { versionId: current?.versions?.find((item) => item.percentage === 100)?.version_id || null, createdAt: current?.created_on || null }]
  }))
  return Object.fromEntries(entries)
}

async function loadActions() {
  const data = await commandJson('gh', ['api', '-X', 'GET', `repos/${repository}/actions/runs`, '-f', 'per_page=50'])
  return data.workflow_runs.map((run) => {
    const text = `${run.head_branch || ''} ${run.display_title || ''}`
    const key = ['game-demo', 'dinecore', 'project-b'].find((item) => text.includes(item)) || null
    return { projectKey: key, conclusion: run.conclusion, name: run.display_title, createdAt: run.created_at }
  })
}

export async function buildReleaseConsoleSnapshot() {
  const sourceErrors = {}
  const safe = async (name, loader, fallback) => {
    try { return await loader() } catch { sourceErrors[name] = `${name} 暫時無法查詢`; return fallback }
  }
  const [deployments, releases, cloudflare, actions] = await Promise.all([
    safe('githubDeployments', loadDeployments, []),
    safe('githubReleases', loadReleases, []),
    safe('cloudflareDeployments', loadCloudflare, {}),
    safe('githubActions', loadActions, []),
  ])
  return assembleSnapshot({ deployments, releases, cloudflare, actions, sourceErrors })
}
