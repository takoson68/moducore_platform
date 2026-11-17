import { mkdir, readFile, readdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const corpusDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const zhouyiRoot = path.join(corpusDir, 'raw', 'wikisource-zhouyi')
const yizhuanRoot = path.join(corpusDir, 'raw', 'wikisource-yizhuan-targets')
const stagingDir = path.join(corpusDir, 'staging')
const zhouyiManifest = JSON.parse(await readFile(path.join(zhouyiRoot, 'manifest.json'), 'utf8'))
const yizhuanManifest = JSON.parse(await readFile(path.join(yizhuanRoot, 'manifest.json'), 'utf8'))
const hexagramStaging = JSON.parse(await readFile(path.join(stagingDir, 'wikisource-zhouyi-hexagrams.json'), 'utf8'))
const hexagramNameToNumber = new Map(hexagramStaging.hexagrams.map(hexagram => [hexagram.sourceTitle.slice('周易/'.length), hexagram.hexagramNumber]))
const hexagramNameAliases = new Map([
  ['讼', '訟'], ['师', '師'], ['谦', '謙'], ['随', '隨'], ['蛊', '蠱'], ['临', '臨'],
  ['观', '觀'], ['贲', '賁'], ['剥', '剝'], ['复', '復'], ['颐', '頤'], ['离', '離'],
  ['大过', '大過'], ['大壮', '大壯'], ['晋', '晉'], ['损', '損'], ['渐', '漸'], ['归妹', '歸妹'],
  ['丰', '豐'], ['兑', '兌'], ['涣', '渙'], ['节', '節'], ['小过', '小過'], ['既济', '既濟'], ['未济', '未濟'],
  ['無妄', '无妄'], ['恆', '恒']
])
const aliasPages = new Map()
const targetPages = new Map()
const commentaryAliases = zhouyiManifest.pageInventory.filter(page => page.category === 'commentary')

for (const page of commentaryAliases) {
  const snapshot = JSON.parse(await readFile(path.join(zhouyiRoot, page.snapshotFile), 'utf8'))
  aliasPages.set(page.title, { page, snapshot })
}
for (const page of yizhuanManifest.pageInventory) {
  const snapshot = JSON.parse(await readFile(path.join(yizhuanRoot, page.snapshotFile), 'utf8'))
  targetPages.set(page.title, { page, snapshot })
}

const targetByAlias = new Map(yizhuanManifest.redirectAliases.map(alias => [alias.aliasTitle, alias]))
const works = []
for (const aliasEntry of commentaryAliases) {
  const aliasTitle = aliasEntry.title
  const alias = aliasPages.get(aliasTitle)
  const redirect = targetByAlias.get(aliasTitle)
  const content = redirect ? targetPages.get(redirect.redirectTargetTitle) : alias
  if (!content) throw new Error(`找不到傳文正文來源：${aliasTitle}`)
  const workName = aliasTitle.slice('周易/'.length)
  const workId = workIdFor(workName)
  const records = parseWork(workName, content.snapshot)
  works.push({
    workId,
    workName,
    workType: redirect ? 'redirected_commentary' : 'embedded_section_witness',
    relationToHexagrams: ['大象', '小象', '彖', '文言'].includes(workName)
      ? 'parallel_witness_to_hexagram_pages'
      : 'standalone_commentary_text',
    aliasPage: pageReference(alias.page, alias.snapshot),
    redirectTarget: redirect ? {
      targetTitle: redirect.redirectTargetTitle,
      targetPage: pageReference(content.page, content.snapshot)
    } : null,
    contentPage: pageReference(content.page, content.snapshot),
    parserVersion: 4,
    stagingStatus: 'needs-human-review',
    records
  })
}

works.sort((a, b) => a.workName.localeCompare(b.workName, 'zh-Hant'))
const audit = buildOverlapAudit(works, hexagramStaging.hexagrams)
const output = `${JSON.stringify({
  stagingVersion: 4,
  sourceId: 'wikisource-zh-zhouyi-and-yizhuan',
  sourceManifests: [
    '../raw/wikisource-zhouyi/manifest.json',
    '../raw/wikisource-yizhuan-targets/manifest.json'
  ],
  works,
  overlapAudit: audit
}, null, 2)}\n`
const destination = path.join(stagingDir, 'wikisource-zhouyi-commentaries.json')
await mkdir(stagingDir, { recursive: true })
try {
  const previous = await readFile(destination, 'utf8')
  if (previous !== output) {
    throw new Error(`拒絕覆寫既有傳文 staging：${path.relative(corpusDir, destination)}；請先檢視差異並調整 parser version。`)
  }
} catch (error) {
  if (error.code !== 'ENOENT') throw error
  await writeFile(destination, output, { flag: 'wx' })
}

const totalRecords = works.reduce((total, work) => total + work.records.length, 0)
process.stdout.write(`已整理 ${works.length} 個傳文項目、${totalRecords} 段候選資料。\n`)
for (const row of audit.parallelWitnesses) {
  process.stdout.write(`${row.workName}：對照 ${row.mappedHexagramCount}/${row.expectedHexagramCount} 卦；候選 ${row.recordCount} 段。\n`)
}
process.stdout.write(`${path.relative(corpusDir, destination)}\n`)

function pageReference(entry, snapshot) {
  return {
    sourceId: snapshot.sourceId,
    title: snapshot.sourceTitle,
    pageId: snapshot.pageId,
    revisionId: snapshot.revisionId,
    revisionTimestamp: snapshot.revisionTimestamp,
    revisionUrl: snapshot.revisionUrl,
    contentSha256: snapshot.contentSha256,
    snapshotFile: entry.snapshotFile
  }
}

function parseWork(workName, page) {
  const records = []
  let heading = null
  let sourceHexagramName = null
  let hexagramName = null
  let hexagramNumber = null
  let variantLabel = null
  let activeLinePosition = null
  let blockIndex = 0
  const smallImageCounts = new Map()

  for (const sourceWikitext of page.content.split(/\r?\n/)) {
    const trimmed = sourceWikitext.trim()
    if (!trimmed) {
      activeLinePosition = null
      continue
    }
    if (/^'{3,}$/u.test(trimmed)) continue
    if (workName === '文言' && /^周易\s+文言$/u.test(cleanWikiText(trimmed))) continue

    // {{gap}} is a formatting template that may share a line with the actual prose.
    // cleanWikiText removes the template while preserving the text that follows it.
    if (/^\{\{(?:Header|NoteTA|DEFAULTSORT|繫辭)/i.test(trimmed) || /^\[\[Category:/i.test(trimmed)) continue

    const headingMatch = trimmed.match(/^(={2,6})\s*(.*?)\s*\1$/u)
    const plainXiaoHeading = !headingMatch && workName === '小象' ? trimmed.match(/^([^#:=]+?)卦$/u) : null
    if (headingMatch || plainXiaoHeading) {
      heading = cleanWikiText(headingMatch ? headingMatch[2] : plainXiaoHeading[1])
      const sourceName = extractHexagramName(heading, workName)
      const namedHexagram = sourceName ? (hexagramNameAliases.get(sourceName) || sourceName) : null
      if (namedHexagram && hexagramNameToNumber.has(namedHexagram)) {
        sourceHexagramName = sourceName
        hexagramName = namedHexagram
        hexagramNumber = hexagramNameToNumber.get(hexagramName) ?? null
        variantLabel = workName === '文言' ? 'main-text' : null
      } else if (heading === '校詁版' && workName === '文言') {
        variantLabel = '校詁版'
      } else if (['小象', '彖', '文言'].includes(workName)) {
        sourceHexagramName = sourceName
        hexagramName = null
        hexagramNumber = null
        variantLabel = workName === '文言' ? 'main-text' : null
      }
      activeLinePosition = null
      continue
    }

    let marker = ''
    let rawText = trimmed
    const markerMatch = trimmed.match(/^([#:*;]+)\s*(.*)$/u)
    if (markerMatch) {
      marker = markerMatch[1]
      rawText = markerMatch[2].trim()
    }
    if (!rawText) continue

    const fragments = splitSourceBlock(workName, rawText)
    for (const [fragmentIndex, fragment] of fragments.entries()) {
      const rawTextDisplay = cleanWikiText(fragment)
      const sourceLineLabel = workName === '小象'
        ? rawTextDisplay.match(/^((?:初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)《象》[曰日])(?:[：:]\s*)?(.*)$/u)
        : null
      const textDisplay = sourceLineLabel ? sourceLineLabel[2].trim() : rawTextDisplay
      const lineMatch = rawTextDisplay.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)[曰：，,]/u)
      if (lineMatch) activeLinePosition = linePosition(lineMatch[1])
      const record = classifyRecord(workName, heading, hexagramName, hexagramNumber, marker, rawTextDisplay, smallImageCounts)
      if (workName === '文言' && !lineMatch && marker.startsWith(':') && activeLinePosition) {
        record.linePosition = activeLinePosition
        record.lineMapping = 'inherited_within_source_paragraph'
      }

      records.push({
        recordId: `wikisource.${page.pageId}.block.${String(++blockIndex).padStart(4, '0')}`,
        sectionHeading: heading,
        sourceMarker: marker,
        sourceSegment: fragments.length > 1 ? fragmentIndex + 1 : null,
        sourceSegmentCount: fragments.length > 1 ? fragments.length : null,
        workVariant: variantLabel,
        sourceChapterName: record.sourceName ?? sourceHexagramName,
        hexagramNameMapping: (record.sourceName ?? sourceHexagramName) && (record.hexagramName ?? hexagramName)
          ? ((record.sourceName ?? sourceHexagramName) === (record.hexagramName ?? hexagramName) ? 'exact_name' : 'explicit_script_variant')
          : (record.sourceName ?? sourceHexagramName) ? 'unmapped_name' : null,
        candidateHexagramName: record.hexagramName ?? hexagramName,
        candidateHexagramNumber: record.hexagramNumber ?? hexagramNumber,
        provisionalKind: record.kind,
        linePosition: record.linePosition ?? null,
        lineMapping: record.lineMapping ?? null,
        sourceLineLabel: sourceLineLabel ? sourceLineLabel[1] : null,
        textDisplay,
        sourceWikitext,
        sourceFragmentWikitext: fragments.length > 1 ? `${marker}${fragment}` : null,
        sourceLocator: `${page.sourceTitle}／${heading || 'body'}／block-${blockIndex}`,
        reviewStatus: 'needs-human-review'
      })
    }
  }

  return records
}

function classifyRecord(workName, heading, currentName, currentNumber, marker, text, smallImageCounts) {
  if (workName === '大象') {
    const match = text.match(/^([^：:]+)[：:]/u)
    const sourceName = match?.[1]
    const name = hexagramNameAliases.get(sourceName) || sourceName
    return { kind: 'great_image', sourceName, hexagramName: name, hexagramNumber: hexagramNameToNumber.get(name) ?? null }
  }
  const smallImageLine = workName === '小象'
    ? text.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)《象》[曰日]/u)
    : null
  if (workName === '小象' && (marker.startsWith('#') || smallImageLine)) {
    const name = currentName
    const index = (smallImageCounts.get(name) || 0) + 1
    smallImageCounts.set(name, index)
    const special = /用[九六]/u.test(text)
    return {
      kind: special ? 'small_image_special_line' : 'small_image_line',
      hexagramName: name,
      hexagramNumber: currentNumber,
      linePosition: special ? null : smallImageLine ? linePosition(smallImageLine[1]) : index <= 6 ? index : null,
      lineMapping: special ? 'explicit_text_label' : smallImageLine ? 'explicit_text_label' : index <= 6 ? 'inferred_from_source_order' : 'unmapped'
    }
  }
  if (workName === '彖') return { kind: 'tuan_text', hexagramName: currentName, hexagramNumber: currentNumber }
  if (workName === '文言') {
    const match = text.match(/^(初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)[曰：，,]/u)
    return {
      kind: match ? 'wenyan_line_discussion' : 'wenyan_text',
      hexagramName: currentName,
      hexagramNumber: currentNumber,
      linePosition: match ? linePosition(match[1]) : null,
      lineMapping: match ? 'explicit_text_label' : null
    }
  }
  return { kind: 'commentary_paragraph', hexagramName: null, hexagramNumber: null }
}

function splitSourceBlock(workName, rawText) {
  if (workName !== '小象') return [rawText]
  return rawText.split(/(?<=。)\s*(?=(?:初九|九二|九三|九四|九五|上九|初六|六二|六三|六四|六五|上六)《象》[曰日])/u)
}

function buildOverlapAudit(works, hexagrams) {
  const byName = new Map(works.map(work => [work.workName, work]))
  const parallelWitnesses = []

  for (const workName of ['大象', '小象', '彖', '文言']) {
    const work = byName.get(workName)
    const relevant = work.records.filter(record => record.candidateHexagramNumber !== null)
    const names = new Set(relevant.map(record => record.candidateHexagramNumber))
    const expectedKinds = ({ 大象: ['great_image'], 小象: ['small_image_line', 'small_image_special_line'], 彖: ['tuan_text'], 文言: ['wenyan_text', 'wenyan_line_discussion'] })[workName]
    const expectedSection = ({ 大象: 'xiang', 小象: 'xiang', 彖: 'tuan', 文言: 'wenyan' })[workName]
    const embeddedHexagrams = hexagrams.filter(hexagram => hexagram.records.some(record => record.section === expectedSection))
    parallelWitnesses.push({
      workId: work.workId,
      workName,
      relation: 'parallel_witness_to_hexagram_pages',
      expectedHexagramCount: workName === '文言' ? 2 : 64,
      mappedHexagramCount: names.size,
      recordCount: relevant.length,
      embeddedHexagramCount: embeddedHexagrams.length,
      sourceSectionCount: workName === '大象' ? names.size : new Set(work.records.map(record => record.sectionHeading).filter(Boolean)).size,
      sourceRecordKinds: Object.fromEntries([...new Set(expectedKinds)].map(kind => [kind, work.records.filter(record => record.provisionalKind === kind).length])),
      unresolvedSourceNames: [...new Set(work.records.filter(record => record.hexagramNameMapping === 'unmapped_name').map(record => record.sourceChapterName))],
      coverageStatus: names.size === (workName === '文言' ? 2 : 64) && !work.records.some(record => record.hexagramNameMapping === 'unmapped_name')
        ? 'candidate_coverage_complete'
        : 'coverage_needs_review',
      textPolicy: '保留為獨立來源見證；未做文字合併或版本取捨。'
    })
  }

  const standaloneWorks = works.filter(work => work.relationToHexagrams === 'standalone_commentary_text')
  return {
    parallelWitnesses,
    standaloneWorks: standaloneWorks.map(work => ({
      workId: work.workId,
      workName: work.workName,
      redirectTargetTitle: work.redirectTarget.targetTitle,
      recordCount: work.records.length,
      relation: 'standalone_work; no one-to-one embedded passage mapping assumed'
    })),
    globalStatus: 'needs-human-review'
  }
}

function extractHexagramName(heading, workName) {
  if (workName === '彖') return heading.split('（')[0]
  if (workName === '文言' && heading.endsWith('文言')) return heading.slice(0, -2)
  if (workName === '小象') return heading
  return null
}

function workIdFor(name) {
  const ids = {
    大象: 'zhouyi.commentary.great-image',
    小象: 'zhouyi.commentary.small-image',
    彖: 'zhouyi.commentary.tuan',
    文言: 'zhouyi.commentary.wenyan',
    序卦: 'zhouyi.commentary.xugua',
    說卦: 'zhouyi.commentary.shuogua',
    雜卦: 'zhouyi.commentary.zagua',
    繫辭上: 'zhouyi.commentary.xici-upper',
    繫辭下: 'zhouyi.commentary.xici-lower'
  }
  return ids[name]
}

function linePosition(label) {
  return ({ 初九: 1, 初六: 1, 九二: 2, 六二: 2, 九三: 3, 六三: 3, 九四: 4, 六四: 4, 九五: 5, 六五: 5, 上九: 6, 上六: 6 })[label] ?? null
}

function cleanWikiText(value) {
  return value
    .replace(/\{\{gap\}\}/gi, '')
    .replace(/<span[^>]*>/gi, '').replace(/<\/span>/gi, '')
    .replace(/'''([^']+)'''/g, '$1').replace(/''([^']+)''/g, '$1')
    .replace(/-\{([^{}|]+)\}-/g, '$1')
    .replace(/\{\{另\|([^{}|]+)\|([^{}|]+)\}\}/gu, '$1一作「$2」')
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
    .replace(/\[\[([^\]]+)\]\]/g, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ').trim()
}
