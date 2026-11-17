import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const sourceRoot = path.join(corpusDir, 'raw', 'wikisource-zhouyi')
const targetRoot = path.join(corpusDir, 'raw', 'wikisource-yizhuan-targets')
const apiUrl = 'https://zh.wikisource.org/w/api.php'
const userAgent = 'yi-ly-corpus-experiment/1.0 (read-only public text snapshot)'
const sourceManifest = JSON.parse(await readFile(path.join(sourceRoot, 'manifest.json'), 'utf8'))
const commentaryAliases = []

for (const entry of sourceManifest.pageInventory.filter(page => page.category === 'commentary')) {
  const snapshot = JSON.parse(await readFile(path.join(sourceRoot, entry.snapshotFile), 'utf8'))
  const redirect = snapshot.content.match(/^\s*#(?:重定向|REDIRECT)\s*\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/imu)
  if (!redirect) continue
  commentaryAliases.push({
    aliasTitle: entry.title,
    aliasPageId: entry.pageId,
    aliasRevisionId: entry.revisionId,
    aliasRevisionUrl: entry.revisionUrl,
    aliasSnapshotFile: entry.snapshotFile,
    redirectTargetTitle: redirect[1].trim()
  })
}

if (commentaryAliases.length !== 5) {
  throw new Error(`預期 5 個傳文子頁是 redirect alias，實際為 ${commentaryAliases.length}；停止並檢查已固定來源快照。`)
}

const manifestPath = path.join(targetRoot, 'manifest.json')
const previous = await readOptionalJson(manifestPath)
const fetchedAt = new Date().toISOString()
const pages = []
const pinnedTargetByTitle = new Map((previous?.pageInventory || []).map(page => [page.title, page]))

if (previous) {
  const expectedAliases = JSON.stringify(commentaryAliases.map(alias => [alias.aliasTitle, alias.redirectTargetTitle]).sort())
  const previousAliases = JSON.stringify(previous.redirectAliases.map(alias => [alias.aliasTitle, alias.redirectTargetTitle]).sort())
  if (expectedAliases !== previousAliases) {
    throw new Error('固定傳文頁的 redirect 對應已改變；請建立新的快照批次，不可覆寫既有批次。')
  }
}

const targetTitles = [...new Set(commentaryAliases.map(alias => alias.redirectTargetTitle))]
const requests = previous
  ? targetTitles.map(title => {
      const pinned = pinnedTargetByTitle.get(title)
      if (!pinned) throw new Error(`既有 target manifest 缺少頁面：${title}`)
      return { revids: String(pinned.revisionId) }
    })
  : [
      ...Array.from({ length: Math.ceil(targetTitles.length / 50) }, (_, index) => ({
        titles: targetTitles.slice(index * 50, index * 50 + 50).join('|')
      }))
    ]

for (const selector of requests) {
  const response = await api({
    action: 'query',
    prop: 'revisions|info',
    ...selector,
    rvprop: 'ids|timestamp|content',
    rvslots: 'main',
    inprop: 'url',
    format: 'json',
    formatversion: 2
  })

  for (const page of response.query?.pages || []) {
    if (page.missing || page.invalid) throw new Error(`redirect 目標頁不存在或無效：${page.title}`)
    const revision = page.revisions?.[0]
    const content = revision?.slots?.main?.content
    if (!revision || typeof content !== 'string') throw new Error(`無法取得 redirect 目標本文：${page.title}`)
    pages.push({
      sourceId: 'wikisource-zh-yizhuan',
      sourceTitle: page.title,
      pageId: page.pageid,
      revisionId: revision.revid,
      revisionTimestamp: revision.timestamp,
      canonicalUrl: page.canonicalurl,
      revisionUrl: `https://zh.wikisource.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${revision.revid}`,
      contentFormat: 'mediawiki-wikitext',
      contentSha256: sha256(content),
      content
    })
  }
}

pages.sort((a, b) => a.sourceTitle.localeCompare(b.sourceTitle, 'zh-Hant'))
if (pages.length !== targetTitles.length || pages.some(page => !targetTitles.includes(page.sourceTitle))) {
  throw new Error(`redirect 目標應有 ${targetTitles.length} 頁，實際取得 ${pages.length} 頁；停止建立快照。`)
}

await mkdir(path.join(targetRoot, 'pages'), { recursive: true })
const pageInventory = []
for (const page of pages) {
  const filename = `${String(page.pageId).padStart(6, '0')}-${slug(page.sourceTitle)}-${page.revisionId}.json`
  const snapshotFile = `pages/${filename}`
  await writeImmutableJson(path.join(targetRoot, snapshotFile), page)
  pageInventory.push({
    title: page.sourceTitle,
    pageId: page.pageId,
    revisionId: page.revisionId,
    revisionTimestamp: page.revisionTimestamp,
    canonicalUrl: page.canonicalUrl,
    revisionUrl: page.revisionUrl,
    contentFormat: page.contentFormat,
    contentSha256: page.contentSha256,
    snapshotFile,
    redirectAliases: commentaryAliases
      .filter(alias => alias.redirectTargetTitle === page.sourceTitle)
      .map(alias => alias.aliasTitle)
      .sort((a, b) => a.localeCompare(b, 'zh-Hant'))
  })
}

const manifest = {
  manifestVersion: 1,
  sourceId: 'wikisource-zh-yizhuan',
  sourceName: '中文維基文庫《易傳》傳文目標頁',
  baseSnapshot: '../wikisource-zhouyi/manifest.json',
  fetchedAt: previous?.fetchedAt || fetchedAt,
  apiUrl,
  contentFormat: 'mediawiki-wikitext',
  license: {
    sourcePageStatement: '依各來源頁頁尾所示授權條款',
    code: 'CC-BY-SA-4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/'
  },
  attribution: '來源：中文維基文庫《易傳》各傳文頁及各頁貢獻者。本文由「周易」傳文子頁 redirect 指向，已保存目標頁固定 revision；尚未正規化或改寫正文。',
  redirectAliases: commentaryAliases,
  pageCount: pageInventory.length,
  pageInventory
}

await writeImmutableManifest(manifestPath, manifest)
process.stdout.write(`已保存 ${pageInventory.length} 個傳文 redirect 目標頁，對應 ${commentaryAliases.length} 個《周易》子頁 alias。\n`)
process.stdout.write(`${path.relative(corpusDir, manifestPath)}\n`)

async function api(parameters) {
  const url = new URL(apiUrl)
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value))
  const response = await fetch(url, { headers: { 'user-agent': userAgent } })
  if (!response.ok) throw new Error(`MediaWiki API HTTP ${response.status}`)
  const body = await response.json()
  if (body.error) throw new Error(`MediaWiki API ${body.error.code}: ${body.error.info}`)
  return body
}

async function readOptionalJson(filename) {
  try {
    return JSON.parse(await readFile(filename, 'utf8'))
  } catch (error) {
    if (error.code === 'ENOENT') return null
    throw error
  }
}

async function writeImmutableJson(destination, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  try {
    const existing = await readFile(destination, 'utf8')
    if (existing !== serialized) throw new Error(`拒絕覆寫既有快照：${path.relative(corpusDir, destination)}`)
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, serialized, { flag: 'wx' })
  }
}

async function writeImmutableManifest(destination, value) {
  const existing = await readOptionalJson(destination)
  if (!existing) return writeImmutableJson(destination, value)
  const sameSnapshot = JSON.stringify(existing.redirectAliases) === JSON.stringify(value.redirectAliases) &&
    JSON.stringify(existing.pageInventory) === JSON.stringify(value.pageInventory)
  if (!sameSnapshot) throw new Error('redirect 目標 revision 或 checksum 已改變；請建立新的快照批次，不可覆寫既有 manifest。')
}

function slug(value) {
  return value.replaceAll('/', '-').replaceAll(/[^\p{L}\p{N}-]/gu, '-')
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`
}
