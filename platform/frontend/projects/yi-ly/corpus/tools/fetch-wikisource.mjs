import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawRoot = path.join(corpusDir, 'raw', 'wikisource-zhouyi')
const sourcePageId = 200
const sourceRevisionId = 7907208
const apiUrl = 'https://zh.wikisource.org/w/api.php'
const userAgent = 'yi-ly-corpus-experiment/1.0 (read-only public domain text snapshot)'

const pinnedLinks = await api({
  action: 'parse',
  oldid: sourceRevisionId,
  prop: 'links',
  format: 'json',
  formatversion: 2
})

const titles = [...new Set(
  (pinnedLinks.parse?.links || [])
    .map(link => link.title)
    .filter(title => title.startsWith('周易/'))
)].sort((a, b) => a.localeCompare(b, 'zh-Hant'))

if (titles.length !== 73) {
  throw new Error(`固定目錄頁預期列出 73 個《周易》子頁，實際為 ${titles.length}；停止下載並檢查來源頁結構。`)
}

const fetchedAt = new Date().toISOString()
const pages = []

for (let offset = 0; offset < titles.length; offset += 50) {
  const batchTitles = titles.slice(offset, offset + 50)
  const response = await api({
    action: 'query',
    prop: 'revisions|info',
    titles: batchTitles.join('|'),
    rvprop: 'ids|timestamp|content',
    rvslots: 'main',
    inprop: 'url',
    format: 'json',
    formatversion: 2
  })

  for (const page of response.query?.pages || []) {
    if (page.missing || page.invalid) {
      throw new Error(`來源頁不存在或無效：${page.title}`)
    }
    const revision = page.revisions?.[0]
    const content = revision?.slots?.main?.content
    if (!revision || typeof content !== 'string') {
      throw new Error(`無法取得來源頁本文：${page.title}`)
    }

    const pageSnapshot = {
      sourceId: 'wikisource-zh-zhouyi',
      sourceTitle: page.title,
      pageId: page.pageid,
      revisionId: revision.revid,
      revisionTimestamp: revision.timestamp,
      canonicalUrl: page.canonicalurl,
      revisionUrl: `https://zh.wikisource.org/w/index.php?title=${encodeURIComponent(page.title)}&oldid=${revision.revid}`,
      contentFormat: 'mediawiki-wikitext',
      contentSha256: sha256(content),
      content
    }
    const filename = `${String(page.pageid).padStart(6, '0')}-${slug(page.title)}-${revision.revid}.json`
    const destination = path.join(rawRoot, 'pages', filename)
    await writeImmutableJson(destination, pageSnapshot)
    pages.push({
      title: page.title,
      pageId: page.pageid,
      revisionId: revision.revid,
      revisionTimestamp: revision.timestamp,
      canonicalUrl: page.canonicalurl,
      revisionUrl: pageSnapshot.revisionUrl,
      contentFormat: pageSnapshot.contentFormat,
      contentSha256: pageSnapshot.contentSha256,
      snapshotFile: `pages/${filename}`,
      category: classify(page.title)
    })
  }
}

pages.sort((a, b) => a.title.localeCompare(b.title, 'zh-Hant'))

const manifest = {
  manifestVersion: 1,
  sourceId: 'wikisource-zh-zhouyi',
  sourceName: '中文維基文庫《周易》',
  entryPage: {
    title: '周易',
    pageId: sourcePageId,
    revisionId: sourceRevisionId,
    revisionUrl: `https://zh.wikisource.org/w/index.php?title=周易&oldid=${sourceRevisionId}`
  },
  fetchedAt,
  apiUrl,
  contentFormat: 'mediawiki-wikitext',
  pageCount: pages.length,
  categories: {
    hexagramPages: pages.filter(page => page.category === 'hexagram').length,
    commentaryPages: pages.filter(page => page.category === 'commentary').length
  },
  license: {
    sourcePageStatement: '依各來源頁頁尾所示授權條款',
    code: 'CC-BY-SA-4.0',
    url: 'https://creativecommons.org/licenses/by-sa/4.0/'
  },
  attribution: '來源：中文維基文庫《周易》及各頁貢獻者。此快照保存各頁固定 revision，尚未正規化或改寫正文。',
  pageInventory: pages
}

await mkdir(rawRoot, { recursive: true })
await writeSnapshotManifest(path.join(rawRoot, 'manifest.json'), manifest)
process.stdout.write(`已擷取 ${pages.length} 個固定目錄子頁：64 卦頁、${manifest.categories.commentaryPages} 個傳文頁。\n`)
process.stdout.write(`Manifest：${path.relative(corpusDir, path.join(rawRoot, 'manifest.json'))}\n`)

async function api(parameters) {
  const url = new URL(apiUrl)
  for (const [key, value] of Object.entries(parameters)) url.searchParams.set(key, String(value))
  const response = await fetch(url, { headers: { 'user-agent': userAgent } })
  if (!response.ok) throw new Error(`MediaWiki API HTTP ${response.status}`)
  const body = await response.json()
  if (body.error) throw new Error(`MediaWiki API ${body.error.code}: ${body.error.info}`)
  return body
}

function classify(title) {
  const commentaryNames = new Set(['大象', '小象', '序卦', '彖', '文言', '繫辭上', '繫辭下', '說卦', '雜卦'])
  return commentaryNames.has(title.slice('周易/'.length)) ? 'commentary' : 'hexagram'
}

function slug(value) {
  return value.replaceAll('/', '-').replaceAll(/[^\p{L}\p{N}-]/gu, '-')
}

function sha256(value) {
  return `sha256:${createHash('sha256').update(value, 'utf8').digest('hex')}`
}

async function writeImmutableJson(destination, value) {
  const serialized = `${JSON.stringify(value, null, 2)}\n`
  try {
    const existing = await readFile(destination, 'utf8')
    if (existing !== serialized) {
      throw new Error(`拒絕覆寫既有快照：${path.relative(corpusDir, destination)}`)
    }
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
    await mkdir(path.dirname(destination), { recursive: true })
    await writeFile(destination, serialized, { flag: 'wx' })
  }
}

async function writeSnapshotManifest(destination, value) {
  try {
    const existing = JSON.parse(await readFile(destination, 'utf8'))
    const sameSnapshot = existing.entryPage?.revisionId === value.entryPage.revisionId &&
      JSON.stringify(existing.pageInventory) === JSON.stringify(value.pageInventory)
    if (!sameSnapshot) {
      throw new Error('來源頁 revision 或 checksum 已變更；請建立新的快照批次目錄，不可覆寫既有 manifest。')
    }
    return
  } catch (error) {
    if (error.code !== 'ENOENT') throw error
  }
  await writeImmutableJson(destination, value)
}
