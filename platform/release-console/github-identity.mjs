import { execFile } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { promisify } from 'node:util'
import { resolveEffectiveRole } from './access-policy.mjs'

const exec = promisify(execFile)

async function commandJson(args) {
  const { stdout } = await exec('gh', args, { encoding: 'utf8', maxBuffer: 1024 * 1024 })
  return JSON.parse(stdout)
}

// 讀取由 Git 管理的操作員白名單，不接受瀏覽器提供替代路徑。
export async function loadAccessPolicy(path = new URL('./access-policy.json', import.meta.url)) {
  const policy = JSON.parse(await readFile(path, 'utf8'))
  if (policy.schemaVersion !== 1 || typeof policy.repository !== 'string' || !Array.isArray(policy.operators)) throw new Error('Access policy 格式錯誤')
  return policy
}

// 只從伺服器端 gh 身份與 Repository API 取得權威 claims，不回傳任何憑證。
export async function resolveCliGitHubIdentity(repository) {
  const user = await commandJson(['api', 'user'])
  const permission = await commandJson(['api', `repos/${repository}/collaborators/${encodeURIComponent(user.login)}/permission`])
  return { provider: 'github', id: Number(user.id), login: user.login, repositoryPermission: permission.permission }
}

// 以不可變 GitHub ID 命中白名單，再套用 Repository 權限上限。
export function authorizeGitHubIdentity(identity, policy, authenticatedAt) {
  const operator = policy.operators.find((item) => item.enabled === true && item.githubId === identity.id)
  if (!operator) return null
  const role = resolveEffectiveRole(operator.role, identity.repositoryPermission)
  if (!role) return null
  return { ...identity, login: identity.login, role, authenticatedAt }
}
