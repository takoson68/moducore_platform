import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { mkdir, readFile, readdir, stat } from 'node:fs/promises'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import { parseDeploymentTag } from './release-plan.mjs'

const MAX_FILES = 5000
const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_TOTAL_BYTES = 250 * 1024 * 1024

function args(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 2) parsed[values[index]?.replace(/^--/, '')] = values[index + 1]
  return parsed
}

function digest(content) {
  return createHash('sha256').update(content).digest('hex')
}

export function safeRelativePath(value) {
  if (!value || value.includes('\\') || value.includes('\0') || path.posix.isAbsolute(value)) return false
  const segments = value.split('/').filter(Boolean)
  return segments.length > 0 && !segments.includes('.') && !segments.includes('..')
}

export function validateArchiveEntries(entries) {
  if (!Array.isArray(entries) || entries.length === 0) throw new Error('ZIP 沒有內容')
  if (entries.length > MAX_FILES) throw new Error('ZIP 檔案數超過安全上限')
  let total = 0
  for (const entry of entries) {
    if (!safeRelativePath(entry.name)) throw new Error(`ZIP 含不安全路徑：${entry.name}`)
    if (entry.symlink) throw new Error(`ZIP 含符號連結：${entry.name}`)
    if (!Number.isSafeInteger(entry.bytes) || entry.bytes < 0 || entry.bytes > MAX_FILE_BYTES) {
      throw new Error(`ZIP 單檔大小異常：${entry.name}`)
    }
    total += entry.bytes
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('ZIP 解壓大小超過安全上限')
  return { count: entries.length, totalBytes: total }
}

export function validateManifest(manifest, expected) {
  if (manifest?.schemaVersion !== 1) throw new Error('不支援的 manifest schemaVersion')
  for (const key of ['project', 'target', 'version', 'tag']) {
    if (manifest[key] !== expected[key]) throw new Error(`manifest ${key} 不一致`)
  }
  if (!/^[a-f0-9]{40}$/.test(manifest.commit || '')) throw new Error('manifest commit 格式錯誤')
  if (!Array.isArray(manifest.files) || manifest.files.length === 0 || manifest.files.length > MAX_FILES) {
    throw new Error('manifest files 數量異常')
  }
  const names = new Set()
  let total = 0
  for (const file of manifest.files) {
    if (!safeRelativePath(file.path) || names.has(file.path)) throw new Error(`manifest 路徑不安全或重複：${file.path}`)
    if (!Number.isSafeInteger(file.bytes) || file.bytes < 0 || file.bytes > MAX_FILE_BYTES) throw new Error(`manifest 檔案大小異常：${file.path}`)
    if (!/^[a-f0-9]{64}$/.test(file.sha256 || '')) throw new Error(`manifest SHA-256 格式錯誤：${file.path}`)
    names.add(file.path)
    total += file.bytes
  }
  if (total > MAX_TOTAL_BYTES) throw new Error('manifest 總大小超過安全上限')
  return { count: names.size, totalBytes: total }
}

function archiveEntries(zipPath) {
  const listing = execFileSync('zipinfo', ['-l', zipPath], { encoding: 'utf8' })
  const entries = []
  for (const line of listing.split('\n')) {
    const match = /^([dl-])[rwx-]{9}\s+\S+\s+\S+\s+(\d+)\s+\S+\s+\d+\s+\S+\s+\S+\s+\S+\s+(.+)$/.exec(line.trim())
    if (!match) continue
    const type = match[1]
    if (type === 'd') continue
    entries.push({ name: match[3], bytes: Number(match[2]), symlink: type === 'l' })
  }
  return entries
}

async function filesUnder(root, current = root) {
  const result = []
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name)
    if (entry.isSymbolicLink()) throw new Error(`解壓結果含符號連結：${absolute}`)
    if (entry.isDirectory()) result.push(...await filesUnder(root, absolute))
    else if (entry.isFile()) result.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
  return result.sort()
}

export async function verifyReleasePackage({ tag, repository, output }) {
  const plan = parseDeploymentTag(tag)
  if (!repository || !/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/.test(repository)) throw new Error('Repository 格式錯誤')
  const outputPath = path.resolve(output)
  await mkdir(outputPath, { recursive: true })
  if ((await readdir(outputPath)).length > 0) throw new Error('輸出目錄必須為空')

  const release = JSON.parse(execFileSync('gh', ['release', 'view', tag, '--repo', repository, '--json', 'tagName,assets'], { encoding: 'utf8' }))
  if (release.tagName !== tag) throw new Error('Release Tag 不一致')
  const prefix = `${plan.project}_v${plan.version}_[a-f0-9]{7}`
  const patterns = {
    zip: new RegExp(`^${prefix}\\.zip$`),
    manifest: new RegExp(`^${prefix}\\.manifest\\.json$`),
    checksum: new RegExp(`^${prefix}\\.sha256$`),
  }
  const selected = {}
  for (const [kind, pattern] of Object.entries(patterns)) {
    const matches = release.assets.map((asset) => asset.name).filter((name) => pattern.test(name))
    if (matches.length !== 1) throw new Error(`Release ${kind} 資產數量必須為 1`)
    selected[kind] = matches[0]
    execFileSync('gh', ['release', 'download', tag, '--repo', repository, '--dir', outputPath, '--pattern', matches[0]], { stdio: 'inherit' })
  }

  const zipPath = path.join(outputPath, selected.zip)
  const checksum = (await readFile(path.join(outputPath, selected.checksum), 'utf8')).trim()
  const checksumMatch = /^([a-f0-9]{64})  ([A-Za-z0-9._-]+\.zip)$/.exec(checksum)
  if (!checksumMatch || checksumMatch[2] !== selected.zip) throw new Error('checksum 格式或 ZIP 檔名不一致')
  if (digest(await readFile(zipPath)) !== checksumMatch[1]) throw new Error('ZIP SHA-256 驗證失敗')

  const manifestText = await readFile(path.join(outputPath, selected.manifest), 'utf8')
  const manifest = JSON.parse(manifestText)
  validateManifest(manifest, { project: plan.project, target: plan.target, version: plan.version, tag })
  if (manifest.artifact !== selected.zip) throw new Error('manifest artifact 與 ZIP 不一致')

  const entries = archiveEntries(zipPath)
  validateArchiveEntries(entries)
  const artifactRoot = selected.zip.replace(/\.zip$/, '')
  if (entries.some((entry) => !entry.name.startsWith(`${artifactRoot}/`))) throw new Error('ZIP 根目錄與 artifact 不一致')
  execFileSync('unzip', ['-q', zipPath, '-d', outputPath])
  const packageRoot = path.join(outputPath, artifactRoot)
  const internalManifest = await readFile(path.join(packageRoot, 'manifest.json'), 'utf8')
  if (internalManifest !== manifestText) throw new Error('ZIP 內外 manifest 不一致')

  const siteRoot = path.join(packageRoot, 'site')
  const actualFiles = await filesUnder(siteRoot)
  const expectedFiles = manifest.files.map((file) => file.path).sort()
  if (JSON.stringify(actualFiles) !== JSON.stringify(expectedFiles)) throw new Error('site 檔案清單與 manifest 不一致')
  for (const file of manifest.files) {
    const absolute = path.join(siteRoot, file.path)
    const content = await readFile(absolute)
    if ((await stat(absolute)).size !== file.bytes || digest(content) !== file.sha256) throw new Error(`site 檔案驗證失敗：${file.path}`)
  }
  return { plan, manifest, zipSha256: checksumMatch[1], siteRoot, artifactRoot, files: actualFiles.length }
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const options = args(process.argv.slice(2))
  for (const name of ['tag', 'repository', 'output']) if (!options[name]) throw new Error(`缺少 --${name}`)
  const result = await verifyReleasePackage(options)
  console.log(JSON.stringify({
    project: result.plan.project,
    target: result.plan.target,
    version: result.plan.version,
    commit: result.manifest.commit,
    zipSha256: result.zipSha256,
    files: result.files,
    siteRoot: result.siteRoot,
  }, null, 2))
}
