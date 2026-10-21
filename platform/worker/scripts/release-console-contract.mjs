export const RELEASE_CONSOLE_SCHEMA_VERSION = 1

export const releaseConsoleProjects = Object.freeze([
  { key: 'game-demo', project: 'game-demo', target: 'game-demo-staging', environment: 'staging/game-demo-staging', stagingUrl: 'https://game-demo-staging.takoson68.workers.dev', database: false },
  { key: 'dinecore', project: 'dineCore', target: 'dinecore-staging', environment: 'staging/dinecore-staging', stagingUrl: 'https://dinecore-staging.takoson68.workers.dev', database: true },
  { key: 'project-b', project: 'project-b', target: 'project-b-staging', environment: 'staging/project-b-staging', stagingUrl: 'https://project-b-staging.takoson68.workers.dev', database: true },
])

export const releaseConsoleEnums = Object.freeze({
  snapshotStatus: ['healthy', 'degraded', 'unavailable'],
  sourceStatus: ['ok', 'unavailable'],
  projectStatus: ['healthy', 'degraded', 'unavailable'],
  deploymentPosition: ['current', 'previous', 'historical'],
  artifactSource: ['build', 'release'],
  smokeStatus: ['passed', 'failed', 'unknown'],
  completeness: ['complete', 'missing_assets', 'duplicate_assets', 'unavailable'],
  integrity: ['verified', 'checksum_failed', 'manifest_invalid', 'not_checked', 'unavailable'],
  issueSeverity: ['warning', 'error'],
  issueCode: [
    'SOURCE_UNAVAILABLE', 'CURRENT_MISSING', 'RELEASE_INCOMPLETE', 'CHECKSUM_FAILED',
    'MANIFEST_INVALID', 'CLOUDFLARE_VERSION_MISMATCH', 'SMOKE_FAILED', 'RUN_FAILED',
  ],
})

const requiredSources = ['githubDeployments', 'githubReleases', 'githubActions', 'cloudflareDeployments']
const requiredDeploymentFields = [
  'id', 'position', 'status', 'createdAt', 'project', 'target', 'version', 'tag', 'sourceRef',
  'commit', 'cloudflareVersionId', 'environmentUrl', 'runUrl', 'releaseUrl', 'artifactSource',
  'artifactName', 'zipSha256', 'minimumSchemaVersion', 'smoke',
]
const requiredReleaseFields = ['tag', 'version', 'commit', 'releaseUrl', 'publishedAt', 'artifact']
const requiredArtifactFields = [
  'zip', 'manifest', 'checksum', 'zipSha256', 'manifestSchemaVersion', 'fileCount',
  'minimumSchemaVersion', 'completeness', 'integrity',
]
const requiredAssetFields = ['name', 'url', 'size', 'digest']

function requireObject(value, name) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} 必須是物件`)
}

function requireEnum(value, values, name) {
  if (!values.includes(value)) throw new Error(`${name} 列舉值錯誤`)
}

function validateIssue(issue, name) {
  requireObject(issue, name)
  requireEnum(issue.code, releaseConsoleEnums.issueCode, `${name}.code`)
  requireEnum(issue.severity, releaseConsoleEnums.issueSeverity, `${name}.severity`)
}

export function validateReleaseConsoleSnapshot(snapshot) {
  requireObject(snapshot, 'snapshot')
  if (snapshot.schemaVersion !== RELEASE_CONSOLE_SCHEMA_VERSION) throw new Error('schemaVersion 不支援')
  if (Number.isNaN(Date.parse(snapshot.generatedAt))) throw new Error('generatedAt 必須是 ISO 時間')
  requireEnum(snapshot.status, releaseConsoleEnums.snapshotStatus, 'status')
  requireObject(snapshot.sources, 'sources')
  for (const source of requiredSources) requireEnum(snapshot.sources[source], releaseConsoleEnums.sourceStatus, `sources.${source}`)
  if (!Array.isArray(snapshot.projects) || !Array.isArray(snapshot.issues)) throw new Error('projects 與 issues 必須是陣列')
  const expectedKeys = releaseConsoleProjects.map((project) => project.key)
  const actualKeys = snapshot.projects.map((project) => project.key)
  if (JSON.stringify(actualKeys) !== JSON.stringify(expectedKeys)) throw new Error('Project 必須依白名單完整輸出')
  for (const project of snapshot.projects) {
    const fixed = releaseConsoleProjects.find((item) => item.key === project.key)
    for (const field of ['project', 'target', 'environment', 'stagingUrl', 'database']) {
      if (project[field] !== fixed[field]) throw new Error(`${project.key}.${field} 與白名單不一致`)
    }
    requireEnum(project.status, releaseConsoleEnums.projectStatus, `${project.key}.status`)
    if (!Array.isArray(project.deployments) || !Array.isArray(project.releases) || !Array.isArray(project.issues)) throw new Error(`${project.key} 集合欄位錯誤`)
    for (const deployment of project.deployments) {
      for (const field of requiredDeploymentFields) if (!(field in deployment)) throw new Error(`Deployment 缺少 ${field}`)
      requireEnum(deployment.position, releaseConsoleEnums.deploymentPosition, 'deployment.position')
      requireEnum(deployment.artifactSource, releaseConsoleEnums.artifactSource, 'deployment.artifactSource')
      requireEnum(deployment.smoke, releaseConsoleEnums.smokeStatus, 'deployment.smoke')
    }
    const deploymentIds = new Set(project.deployments.map((deployment) => deployment.id))
    for (const field of ['currentDeploymentId', 'previousDeploymentId']) {
      if (project[field] !== null && !deploymentIds.has(project[field])) throw new Error(`${project.key}.${field} 找不到對應 Deployment`)
    }
    for (const release of project.releases) {
      requireObject(release, `${project.key}.release`)
      for (const field of requiredReleaseFields) if (!(field in release)) throw new Error(`Release 缺少 ${field}`)
      requireObject(release.artifact, `${project.key}.release.artifact`)
      for (const field of requiredArtifactFields) if (!(field in release.artifact)) throw new Error(`Artifact 缺少 ${field}`)
      for (const assetName of ['zip', 'manifest', 'checksum']) {
        const asset = release.artifact[assetName]
        requireObject(asset, `${project.key}.release.artifact.${assetName}`)
        for (const field of requiredAssetFields) if (!(field in asset)) throw new Error(`${assetName} Asset 缺少 ${field}`)
      }
      requireEnum(release.artifact.completeness, releaseConsoleEnums.completeness, 'artifact.completeness')
      requireEnum(release.artifact.integrity, releaseConsoleEnums.integrity, 'artifact.integrity')
    }
    for (const issue of project.issues) validateIssue(issue, `${project.key}.issue`)
  }
  for (const issue of snapshot.issues) validateIssue(issue, 'issue')
  return snapshot
}
