import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const rawDir = path.join(corpusDir, 'raw', 'wikisource-zhouyi', 'pages')
const stagingDir = path.join(corpusDir, 'staging')
const rawManifest = JSON.parse(await readFile(path.join(corpusDir, 'raw', 'wikisource-zhouyi', 'manifest.json'), 'utf8'))
const targetPages = rawManifest.pageInventory.filter(page => page.category === 'hexagram')
const targetTitles = new Set(targetPages.map(page => page.title))
const inputs = (await readdir(rawDir)).filter(name => name.endsWith('.json'))
const hexagrams = []

for (const filename of inputs) {
  const page = JSON.parse(await readFile(path.join(rawDir, filename), 'utf8'))
  if (!targetTitles.has(page.sourceTitle)) continue
  hexagrams.push({
    sourceId: page.sourceId,
    sourceTitle: page.sourceTitle,
    hexagramNumber: parseHexagramNumber(page.content),
    pageId: page.pageId,
    revisionId: page.revisionId,
    revisionTimestamp: page.revisionTimestamp,
    sourceUrl: page.revisionUrl,
    sourceContentSha256: page.contentSha256,
    parserVersion: 1,
    stagingStatus: 'needs-human-review',
    records: parsePage(page)
  })
}

if (targetPages.length !== 64 || hexagrams.length !== 64) {
  throw new Error(`來源目錄應有 64 個卦頁並完整找到，目錄 ${targetPages.length} 頁、實際解析 ${hexagrams.length} 頁。`)
}

hexagrams.sort((a, b) => (a.hexagramNumber ?? 999) - (b.hexagramNumber ?? 999))
const output = `${JSON.stringify({ stagingVersion: 1, sourceId: 'wikisource-zh-zhouyi', hexagrams }, null, 2)}\n`
const destination = path.join(stagingDir, 'wikisource-zhouyi-hexagrams.json')
await mkdir(stagingDir, { recursive: true })
try {
  const previous = await readFile(destination, 'utf8')
  if (previous !== output) {
    throw new Error(`拒絕覆寫既有 staging 樣本：${path.relative(corpusDir, destination)}；請檢查 parser 版本並人工處理差異。`)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  await writeFile(destination, output, { flag: 'wx' })
}

const totalRecords = hexagrams.reduce((sum, hexagram) => sum + hexagram.records.length, 0)
process.stdout.write(`已產生 64 卦 staging：${hexagrams.length} 卦、${totalRecords} 段候選資料。\n`)
process.stdout.write(`${path.relative(corpusDir, destination)}\n`)

function parsePage(page) {
  const records = []
  let smallImageItemIndex = 0
  let wenyanGroup = 0
  let wenyanGroupFirstRecord = true
  let section = 'page_header'
  let index = 0

  const physicalLines = page.content.split(/\r?\n/)
  const logicalLines = []
  for (let lineIndex = 0; lineIndex < physicalLines.length; lineIndex += 1) {
    let sourceWikitext = physicalLines[lineIndex]
    while (sourceWikitext.trim().endsWith('<span') && lineIndex + 1 < physicalLines.length) {
      sourceWikitext += physicalLines[++lineIndex]
    }
    logicalLines.push(sourceWikitext)
  }

  for (const sourceWikitext of logicalLines) {
    const heading = cleanWikiText(sourceWikitext).match(/^\*(易經|彖曰|象曰|文言曰)：?$/)
    if (heading) {
      section = heading[1] === '易經' ? 'scripture' : heading[1] === '彖曰' ? 'tuan' : heading[1] === '象曰' ? 'xiang' : 'wenyan'
      continue
    }

    if (section === 'wenyan' && sourceWikitext.trim() === '*:') {
      wenyanGroup += 1
      wenyanGroupFirstRecord = true
      continue
    }

    const listItem = sourceWikitext.match(/^(\*#\*#?|\*#\*?|\*:|\*+)(.+)$/)
    if (!listItem || section === 'page_header' || !sourceWikitext.trim()) continue

    const marker = listItem[1]
    if (section === 'wenyan' && marker === '*:') {
      wenyanGroup += 1
      wenyanGroupFirstRecord = true
      continue
    }
    const rawText = listItem[2].trim()
    if (!rawText) continue
    const cleanedText = cleanWikiText(rawText)
    if (section === 'xiang' && marker.startsWith('*#')) smallImageItemIndex += 1
    const record = classifyRecord(section, marker, cleanedText, smallImageItemIndex)
    records.push({
      recordId: `wikisource.${page.pageId}.block.${String(++index).padStart(3, '0')}`,
      section,
      listMarker: marker,
      provisionalKind: record.kind,
      linePosition: record.linePosition,
      lineMapping: record.lineMapping,
      sourceGroup: section === 'wenyan' ? wenyanGroup : null,
      sourceGroupStart: section === 'wenyan' ? wenyanGroupFirstRecord : null,
      textDisplay: cleanedText,
      sourceWikitext,
      sourceLocator: `${page.sourceTitle}／${section}／block-${index}`,
      reviewStatus: 'needs-human-review'
    })
    if (section === 'wenyan') wenyanGroupFirstRecord = false
  }

  return records
}

function classifyRecord(section, marker, text, sectionItemIndex) {
  if (section === 'scripture') {
    const line = text.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)[：，,]/)
    if (line) return { kind: 'line_statement', linePosition: linePosition(line[1]) }
    if (/^用九：/.test(text)) return { kind: 'use_nine', linePosition: null }
    if (/^用六：/.test(text)) return { kind: 'use_six', linePosition: null }
    if (marker.startsWith('**')) return { kind: marker.length > 2 ? 'judgment_continuation' : 'judgment', linePosition: null }
  }

  if (section === 'tuan') return { kind: marker.length > 2 ? 'tuan_continuation' : 'tuan_text', linePosition: null }
  if (section === 'xiang') {
    if (marker.startsWith('*#')) {
      const line = text.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六|用九|用六)[，,：]/)
      if (line && /^用[九六]/.test(line[1])) return { kind: 'small_image_special_line', linePosition: null, lineMapping: 'explicit_text_label' }
      if (line) return { kind: 'small_image_line', linePosition: linePosition(line[1]), lineMapping: 'explicit_text_label' }
      if (sectionItemIndex <= 7) return {
        kind: sectionItemIndex === 7 ? 'small_image_special_line' : 'small_image_line',
        linePosition: sectionItemIndex <= 6 ? sectionItemIndex : null,
        lineMapping: sectionItemIndex <= 6 ? 'inferred_from_source_order' : 'special_line_by_source_order'
      }
      return { kind: 'small_image_unmapped', linePosition: null, lineMapping: 'unmapped' }
    }
    return { kind: 'great_image', linePosition: null }
  }
  if (section === 'wenyan') {
    const line = text.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)[曰：]/)
    return { kind: marker.startsWith('*:') ? 'wenyan_subsection' : line ? 'wenyan_line_discussion' : 'wenyan_paragraph', linePosition: line ? linePosition(line[1]) : null }
  }

  return { kind: 'unclassified', linePosition: null }
}

function linePosition(label) {
  return ({ 初九: 1, 初六: 1, 九二: 2, 六二: 2, 九三: 3, 六三: 3, 九四: 4, 六四: 4, 九五: 5, 六五: 5, 上九: 6, 上六: 6 })[label] ?? null
}

function parseHexagramNumber(content) {
  const numeral = content.match(/^(?:\[\[周易(?:\|[^\]]+)?\]\]|周易)\s*第([一二三四五六七八九十]+)卦/mu)?.[1]
  if (!numeral) return null
  const digit = { 一: 1, 二: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 }
  if (numeral === '十') return 10
  const compound = numeral.match(/^([一二三四五六七八九])?十([一二三四五六七八九])?$/u)
  if (compound) return (compound[1] ? digit[compound[1]] * 10 : 10) + (compound[2] ? digit[compound[2]] : 0)
  return digit[numeral] ?? null
}

function cleanWikiText(value) {
  return value
    .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
    .replace(/'''([^']+)'''/g, '$1').replace(/''([^']+)''/g, '$1')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/\{\{\*\|([^{}]+)\}\}/g, '（$1）')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
}
