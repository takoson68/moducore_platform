import { createHash } from 'node:crypto'
import { cp, mkdir, readFile, readdir, rm, writeFile } from 'node:fs/promises'
import { spawnSync } from 'node:child_process'
import path from 'node:path'

function args(values) {
  const parsed = {}
  for (let index = 0; index < values.length; index += 2) parsed[values[index]?.replace(/^--/, '')] = values[index + 1]
  return parsed
}

async function filesUnder(root, current = root) {
  const result = []
  for (const entry of await readdir(current, { withFileTypes: true })) {
    const absolute = path.join(current, entry.name)
    if (entry.isDirectory()) result.push(...await filesUnder(root, absolute))
    else if (entry.isFile()) result.push(path.relative(root, absolute).split(path.sep).join('/'))
  }
  return result.sort()
}

function digest(content) {
  return createHash('sha256').update(content).digest('hex')
}

const options = args(process.argv.slice(2))
for (const name of ['project', 'target', 'version', 'commit', 'assets', 'output']) {
  if (!options[name]) throw new Error(`缺少 --${name}`)
}
if (!/^[A-Za-z0-9._-]+$/.test(options.project) || !/^[A-Za-z0-9._-]+$/.test(options.version)) {
  throw new Error('專案或版本含有不安全字元')
}

const assets = path.resolve(options.assets)
const output = path.resolve(options.output)
const artifact = `${options.project}_v${options.version}_${options.commit.slice(0, 7)}`
const packageDir = path.join(output, artifact)
const siteDir = path.join(packageDir, 'site')
const zipPath = path.join(output, `${artifact}.zip`)
const manifestPath = path.join(output, `${artifact}.manifest.json`)
const checksumPath = path.join(output, `${artifact}.sha256`)

await rm(output, { recursive: true, force: true })
await mkdir(siteDir, { recursive: true })
await cp(assets, siteDir, { recursive: true })
const fileNames = await filesUnder(siteDir)
const fileEntries = []
for (const name of fileNames) {
  const content = await readFile(path.join(siteDir, name))
  fileEntries.push({ path: name, bytes: content.length, sha256: digest(content) })
}
const manifest = {
  schemaVersion: 1,
  project: options.project,
  target: options.target,
  version: options.version,
  tag: options.tag || null,
  commit: options.commit,
  builtAt: new Date().toISOString(),
  artifact: `${artifact}.zip`,
  files: fileEntries,
}
const manifestJson = `${JSON.stringify(manifest, null, 2)}\n`
await writeFile(path.join(packageDir, 'manifest.json'), manifestJson)
await writeFile(manifestPath, manifestJson)
const zipped = spawnSync('zip', ['-q', '-r', zipPath, artifact], { cwd: output, stdio: 'inherit' })
if (zipped.error) throw zipped.error
if (zipped.status !== 0) throw new Error(`zip 結束碼 ${zipped.status}`)
const zipDigest = digest(await readFile(zipPath))
await writeFile(checksumPath, `${zipDigest}  ${path.basename(zipPath)}\n`)

if (process.env.GITHUB_OUTPUT) {
  await writeFile(process.env.GITHUB_OUTPUT, [
    `artifact=${artifact}`,
    `zip=${zipPath}`,
    `zip-sha256=${zipDigest}`,
    `manifest=${manifestPath}`,
    `checksum=${checksumPath}`,
    '',
  ].join('\n'), { flag: 'a' })
}
console.log(`已建立 ${zipPath}`)
