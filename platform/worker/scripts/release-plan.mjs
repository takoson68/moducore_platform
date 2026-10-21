import { appendFileSync } from 'node:fs'
import { pathToFileURL } from 'node:url'

const targets = {
  'game-demo': { target: 'game-demo-staging', project: 'game-demo', database: false },
  dinecore: { target: 'dinecore-staging', project: 'dineCore', database: true },
  'project-b': { target: 'project-b-staging', project: 'project-b', database: true },
}

// 僅接受明確的部署 Tag，不讓一般 Push 或任意字串觸發部署。
export function parseDeploymentTag(tag) {
  const match = /^dep_(game-demo|dinecore|project-b)_v(\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?)$/.exec(tag || '')
  if (!match) throw new Error('部署 Tag 格式錯誤，應為 dep_<project>_v<semver>')
  const projectKey = match[1]
  return { ...targets[projectKey], projectKey, version: match[2], tag }
}

// 手動救援仍需從白名單選擇單一專案，版本名稱不冒充正式 Tag。
export function manualDeploymentPlan(projectKey, ref = '') {
  if (!Object.hasOwn(targets, projectKey)) throw new Error('未知的手動部署專案')
  return { ...targets[projectKey], projectKey, version: `manual-${process.env.GITHUB_RUN_NUMBER || 'current'}`, tag: '', ref }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const event = process.env.DEPLOY_EVENT
  const plan = event === 'push'
    ? parseDeploymentTag(process.env.DEPLOY_TAG)
    : manualDeploymentPlan(process.env.DEPLOY_PROJECT, process.env.DEPLOY_REF)
  const output = process.env.GITHUB_OUTPUT
  if (!output) throw new Error('缺少 GITHUB_OUTPUT')
  appendFileSync(output, [
    `matrix=${JSON.stringify({ include: [plan] })}`,
    'has-targets=true',
    `checkout-ref=${event === 'push' ? plan.tag : process.env.DEPLOY_REF || ''}`,
    `is-tag-release=${event === 'push'}`,
    '',
  ].join('\n'))
  console.log(`本次部署：${plan.project} ${plan.version} → ${plan.target}`)
}
