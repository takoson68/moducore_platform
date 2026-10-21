import { pathToFileURL } from 'node:url'

export function deploymentEnvironment(target) {
  if (!/^[a-z0-9-]+-staging$/.test(target || '')) throw new Error('部署目標格式錯誤')
  return `staging/${target}`
}

export function verifiedDeploymentPayload(input) {
  for (const key of ['project', 'target', 'version', 'commit', 'artifact', 'zipSha256', 'runUrl', 'environmentUrl']) {
    if (!input[key]) throw new Error(`缺少 ${key}`)
  }
  if (!/^[a-f0-9]{40}$/.test(input.commit)) throw new Error('Commit SHA 格式錯誤')
  if (!/^[a-f0-9]{64}$/.test(input.zipSha256)) throw new Error('ZIP SHA-256 格式錯誤')
  return {
    schemaVersion: 1,
    project: input.project,
    target: input.target,
    version: input.version,
    tag: input.tag || null,
    sourceRef: input.sourceRef || input.tag || input.commit,
    commit: input.commit,
    artifact: input.artifact,
    zipSha256: input.zipSha256,
    cloudflareVersionId: input.cloudflareVersionId,
    smoke: 'passed',
    runUrl: input.runUrl,
    releaseUrl: input.releaseUrl || null,
  }
}

export function selectCurrentPrevious(deployments) {
  const verified = deployments
    .filter((item) => ['success', 'inactive'].includes(item?.latestStatus) && item?.payload?.smoke === 'passed')
    .sort((left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt))
  return { current: verified[0] || null, previous: verified[1] || null }
}

async function request(url, token, options = {}) {
  const response = await fetch(url, {
    ...options,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status}: ${await response.text()}`)
  return response.json()
}

export async function recordVerifiedDeployment(input, { token, repository, apiUrl = 'https://api.github.com' }) {
  if (!token || !repository) throw new Error('缺少 GitHub API 認證或 Repository')
  const environment = deploymentEnvironment(input.target)
  const payload = verifiedDeploymentPayload(input)
  const deployment = await request(`${apiUrl}/repos/${repository}/deployments`, token, {
    method: 'POST',
    body: JSON.stringify({
      ref: input.commit,
      task: 'deploy',
      auto_merge: false,
      required_contexts: [],
      environment,
      description: `Verified ${input.project} ${input.version}`,
      transient_environment: false,
      production_environment: false,
      payload,
    }),
  })
  await request(`${apiUrl}/repos/${repository}/deployments/${deployment.id}/statuses`, token, {
    method: 'POST',
    body: JSON.stringify({
      state: 'success',
      log_url: input.runUrl,
      environment_url: input.environmentUrl,
      description: `Smoke passed · ${input.cloudflareVersionId}`.slice(0, 140),
      auto_inactive: true,
    }),
  })
  return { deploymentId: deployment.id, environment, payload }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const env = process.env
  const result = await recordVerifiedDeployment({
    project: env.DEPLOY_PROJECT,
    target: env.DEPLOY_TARGET,
    version: env.DEPLOY_VERSION,
    tag: env.DEPLOY_TAG,
    sourceRef: env.DEPLOY_SOURCE_REF,
    commit: env.DEPLOY_COMMIT,
    artifact: env.DEPLOY_ARTIFACT,
    zipSha256: env.DEPLOY_ZIP_SHA256,
    cloudflareVersionId: env.CLOUDFLARE_VERSION_ID,
    runUrl: env.DEPLOY_RUN_URL,
    releaseUrl: env.DEPLOY_RELEASE_URL,
    environmentUrl: env.DEPLOY_ENVIRONMENT_URL,
  }, { token: env.GITHUB_TOKEN, repository: env.GITHUB_REPOSITORY, apiUrl: env.GITHUB_API_URL })
  console.log(`已記錄 GitHub Deployment ${result.deploymentId}（${result.environment}）`)
}
