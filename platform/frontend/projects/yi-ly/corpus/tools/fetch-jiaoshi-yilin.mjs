import { createHash } from 'node:crypto'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url))
const corpusDirectory = path.resolve(scriptDirectory, '..')
const outputDirectory = path.join(corpusDirectory, 'raw/eee-learning-jiaoshi-yilin-siku-v2')
const stagingFile = path.join(corpusDirectory, 'staging/eee-learning-jiaoshi-yilin-siku-v2.json')
const sourceBaseUrl = 'https://www.eee-learning.com/book/giauii'
const sourceId = 'eee-learning-jiaoshi-yilin-siku'
const attribution = '來源：《焦氏易林》，易學網《焦氏易林［四庫全書版］》（依據版本：《欽定四庫全書》子部術數類），https://www.eee-learning.com/book/giauii 。依來源要求標示出處及原網頁連結；本站僅整理林辭原文，並記錄收錄、標點及文字整理修改。'

function sha256(value) {
  return createHash('sha256').update(value, 'utf8').digest('hex')
}

function decodeHtml(value) {
  return value
    .replace(/&#x([\da-f]+);?/gi, (_, hex) => String.fromCodePoint(Number.parseInt(hex, 16)))
    .replace(/&#(\d+);?/g, (_, decimal) => String.fromCodePoint(Number.parseInt(decimal, 10)))
    .replace(/&nbsp;|&#160;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&apos;|&#39;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
}

function plainText(markup) {
  return decodeHtml(markup.replace(/<br\s*\/?>/gi, ' ').replace(/<[^>]+>/g, ''))
    .replace(/[\u00a0\u3000\t\r\n]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function parsePage(html, baseHexagramNumber, sourceUrl) {
  const bodyStart = html.indexOf('<div class="clearfix text-formatted field field--name-body')
  if (bodyStart < 0) throw new Error(`找不到正文容器：${sourceUrl}`)
  const bodyEnd = html.indexOf('</div>', bodyStart)
  if (bodyEnd < 0) throw new Error(`正文容器未結束：${sourceUrl}`)
  const searchRange = html.slice(bodyStart, bodyEnd)
  const paragraphs = [...searchRange.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)]
  const entries = []

  for (const [, markup] of paragraphs) {
    const numberMatch = plainText(markup).match(/^(\d{1,2})\s*[.．]?/)
    if (!numberMatch) continue
    const changedHexagramNumber = Number(numberMatch[1])
    if (changedHexagramNumber < 1 || changedHexagramNumber > 64) continue
    const titleMatch = markup.match(/<strong[^>]*>([\s\S]*?)<\/strong>/i)
    if (!titleMatch) continue

    const iconMatch = markup.match(/\/image\/yi(\d{2})\.png/i)
    if (!iconMatch) throw new Error(`找不到來源卦圖標記：${sourceUrl} 第 ${changedHexagramNumber} 條`)

    const poemMarkup = markup.slice(markup.indexOf(titleMatch[0]) + titleMatch[0].length)
      .replace(/<span\b[^>]*font-size:\s*(?:x-small|small)[^>]*>[\s\S]*?<\/span>/gi, '')
      .replace(/<img\b[^>]*>/gi, '')
    const poemText = plainText(poemMarkup)
      .replace(/^[\s　]+/, '')
      .replace(/[（(][^（）()]*[）)]\s*$/, '')
      .trim()
    if (!poemText) throw new Error(`林辭正文為空：${sourceUrl} 第 ${changedHexagramNumber} 條`)

    entries.push({
      baseHexagramNumber,
      changedHexagramNumber,
      sourceEntryNumber: changedHexagramNumber,
      sourceIconHexagramNumber: Number(iconMatch[1]),
      hexagramName: plainText(titleMatch[1]),
      poemText,
      sourceParagraphSha256: `sha256:${sha256(markup.trim())}`,
      sourceLabelIconMismatch: Number(iconMatch[1]) !== changedHexagramNumber,
      textSha256: `sha256:${sha256(poemText)}`
    })
  }

  const targets = entries.map(entry => entry.changedHexagramNumber)
  if (entries.length < 48 || entries.length > 64 || new Set(targets).size !== entries.length || targets.some(value => value < 1 || value > 64)) {
    throw new Error(`本卦 ${baseHexagramNumber} 頁的林辭數量或卦序無效：實得 ${entries.length} 條 (${sourceUrl})`)
  }

  const title = decodeHtml(html.match(/<title>([\s\S]*?)<\/title>/i)?.[1] ?? '').trim()
  if (!title.startsWith(`${baseHexagramNumber}.`)) {
    throw new Error(`頁面標題與本卦序不一致：預期 ${baseHexagramNumber}，實際「${title}」`)
  }

  const targetSet = new Set(targets)
  const missingTargets = Array.from({ length: 64 }, (_, index) => index + 1).filter(value => !targetSet.has(value))
  return { title, sourceUrl, entries, missingTargets }
}

async function fetchPage(baseHexagramNumber) {
  const sourceUrl = `${sourceBaseUrl}${baseHexagramNumber}`
  const response = await fetch(sourceUrl, { headers: { 'User-Agent': 'yi-ly corpus research; non-commercial; attribution in project data' } })
  if (!response.ok) throw new Error(`取得來源失敗：${response.status} ${sourceUrl}`)
  const html = await response.text()
  const parsed = parsePage(html, baseHexagramNumber, sourceUrl)
  const capturedAt = new Date().toISOString()
  const pageDocument = {
    schemaVersion: 1,
    sourceId,
    workId: 'jiaoshi-yilin',
    baseHexagramNumber,
    pageTitle: parsed.title,
    sourceUrl,
    capturedAt,
    sourcePageSha256: `sha256:${sha256(html)}`,
    attribution,
    entryCount: parsed.entries.length,
    missingTargets: parsed.missingTargets,
    entries: parsed.entries
  }
  return pageDocument
}

await mkdir(outputDirectory, { recursive: true })
const pages = []
for (let baseHexagramNumber = 1; baseHexagramNumber <= 64; baseHexagramNumber += 1) {
  const targetFile = path.join(outputDirectory, `${String(baseHexagramNumber).padStart(2, '0')}.json`)
  try {
    const existing = JSON.parse(await readFile(targetFile, 'utf8'))
    if (existing.sourceId === sourceId
      && existing.baseHexagramNumber === baseHexagramNumber
      && existing.entryCount >= 48 && existing.entryCount <= 64) {
      pages.push(existing)
      continue
    }
  } catch {
    // 不存在或格式不完整時，才重新取得該來源頁。
  }

  const page = await fetchPage(baseHexagramNumber)
  await writeFile(targetFile, `${JSON.stringify(page, null, 2)}\n`, 'utf8')
  pages.push(page)
  process.stdout.write(`已收錄本卦 ${baseHexagramNumber}/64（${page.entryCount} 首）\n`)
  await new Promise(resolve => setTimeout(resolve, 350))
}

const entries = pages.flatMap(page => page.entries.map(entry => ({
  ...entry,
  sourcePageUrl: page.sourceUrl
})))
const pairIds = entries.map(entry => `${entry.baseHexagramNumber}.${entry.changedHexagramNumber}`)
const pairSet = new Set(pairIds)
const missingPairs = []
for (let base = 1; base <= 64; base += 1) {
  for (let changed = 1; changed <= 64; changed += 1) {
    if (!pairSet.has(`${base}.${changed}`)) missingPairs.push(`${base}.${changed}`)
  }
}
if (pages.length !== 64 || entries.length < 3072 || new Set(pairIds).size !== entries.length || missingPairs.length > 1024) {
  throw new Error(`全書覆蓋檢查失敗：頁 ${pages.length}/64、條目 ${entries.length}/4096、唯一配對 ${new Set(pairIds).size}/4096、缺漏 ${missingPairs.length}`)
}

const staging = {
  schemaVersion: 1,
  parserVersion: 1,
  workId: 'jiaoshi-yilin',
  sourceId,
  displayTitle: '焦氏易林',
  edition: '易學網《焦氏易林［四庫全書版］》；依據版本：《欽定四庫全書》子部術數類',
  sourceIndexUrl: sourceBaseUrl,
  attribution,
  rightsNote: '依易學網頁面聲明，古籍原文為公共領域；非商業合理轉載與引用須完整標註出處及原網頁連結。',
  capturedAt: new Date().toISOString(),
  entryCount: entries.length,
  pairCount: pairSet.size,
  coverage: {
    baseHexagrams: 64,
    expectedChangedHexagramsPerBase: 64,
    capturedEntries: entries.length,
    expectedEntries: 4096,
    missingPairs,
    missingRate: Number((missingPairs.length / 4096).toFixed(6)),
    withinUserAcceptedMissingThreshold: missingPairs.length <= 1024
  },
  reviewStatus: 'needs-human-review',
  entries
}
await writeFile(stagingFile, `${JSON.stringify(staging, null, 2)}\n`, 'utf8')
process.stdout.write(`完成：${pages.length} 頁、${entries.length} 首、${new Set(pairIds).size} 個唯一卦變配對。\n`)
