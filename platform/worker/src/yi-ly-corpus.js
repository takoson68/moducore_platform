import { errorResponse, HttpError, json } from './response.js'

const SOURCE_PROJECTION = `
  p.passage_id, p.corpus_version, p.work_id, p.work_name, p.work_type,
  p.passage_kind, p.source_locator, p.hexagram_number, p.line_position,
  p.text_display, p.source_text_sha256, p.display_text_sha256,
  p.parser_version, p.extraction_status,
  s.source_id, s.source_name, s.source_url, s.edition,
  s.license_code, s.license_url, s.attribution, s.rights_note,
  sp.page_title, sp.fixed_url, sp.content_sha256, sp.page_role
`

async function passageRows(env, sql, ...params) {
  const result = await env.DB.prepare(sql).bind(...params).all()
  return (result.results || []).map((row) => ({
    id: row.passage_id,
    corpusVersion: row.corpus_version,
    work: { id: row.work_id, name: row.work_name, type: row.work_type },
    kind: row.passage_kind,
    hexagramNumber: row.hexagram_number,
    linePosition: row.line_position,
    text: row.text_display,
    locator: row.source_locator,
    extractionStatus: row.extraction_status,
    parserVersion: row.parser_version,
    checksum: row.display_text_sha256 || row.source_text_sha256,
    source: {
      id: row.source_id,
      name: row.source_name,
      url: row.fixed_url || row.source_url,
      edition: row.edition,
      licenseCode: row.license_code,
      licenseUrl: row.license_url,
      attribution: row.attribution,
      rightsNote: row.rights_note,
      pageTitle: row.page_title,
      pageRole: row.page_role,
      pageChecksum: row.content_sha256,
    },
  }))
}

export async function getYiLyReading(request, env) {
  if (env.PROJECT_ID !== 'yi-ly') throw new HttpError(404, 'NOT_FOUND', '找不到 API')

  const url = new URL(request.url)
  const basePattern = url.searchParams.get('basePattern') || ''
  const changedPattern = url.searchParams.get('changedPattern') || ''
  if (!/^[01]{6}$/.test(basePattern) || !/^[01]{6}$/.test(changedPattern)) {
    throw new HttpError(400, 'INVALID_PATTERN', '卦畫格式錯誤')
  }

  const hexagramResult = await env.DB.prepare(`
    SELECT hexagram_number, hexagram_name, pattern_bottom_up,
      lower_trigram_name, upper_trigram_name
    FROM yi_ly_hexagrams
    WHERE pattern_bottom_up IN (?, ?)
    ORDER BY hexagram_number
  `).bind(basePattern, changedPattern).all()
  const hexagrams = hexagramResult.results || []
  const baseHexagram = hexagrams.find((item) => item.pattern_bottom_up === basePattern)
  const changedHexagram = hexagrams.find((item) => item.pattern_bottom_up === changedPattern)
  if (!baseHexagram || !changedHexagram) throw new HttpError(404, 'HEXAGRAM_NOT_FOUND', '找不到對應卦象資料')

  const numbers = [...new Set([baseHexagram.hexagram_number, changedHexagram.hexagram_number])]
  const placeholders = numbers.map(() => '?').join(', ')
  const corePassages = await passageRows(env, `
    SELECT ${SOURCE_PROJECTION}
    FROM yi_ly_passages p
    JOIN yi_ly_sources s ON s.source_id = p.source_id
    JOIN yi_ly_source_pages sp ON sp.source_page_key = p.source_page_key
    WHERE p.work_type = 'base_text'
      AND p.hexagram_number IN (${placeholders})
    ORDER BY p.hexagram_number, p.line_position, p.passage_id
  `, ...numbers)

  const commentaryPassages = await passageRows(env, `
    SELECT ${SOURCE_PROJECTION}
    FROM yi_ly_passages p
    JOIN yi_ly_sources s ON s.source_id = p.source_id
    JOIN yi_ly_source_pages sp ON sp.source_page_key = p.source_page_key
    WHERE p.work_type IN ('embedded_section_witness', 'redirected_commentary')
      AND p.hexagram_number IN (${placeholders})
    ORDER BY p.work_name, p.hexagram_number, p.line_position, p.passage_id
  `, ...numbers)

  const yilin = await passageRows(env, `
    SELECT ${SOURCE_PROJECTION}
    FROM yi_ly_passages p
    JOIN yi_ly_sources s ON s.source_id = p.source_id
    JOIN yi_ly_source_pages sp ON sp.source_page_key = p.source_page_key
    WHERE p.work_type = 'yilin'
      AND p.base_hexagram_number = ?
      AND p.changed_hexagram_number = ?
    LIMIT 1
  `, baseHexagram.hexagram_number, changedHexagram.hexagram_number)

  const version = corePassages[0]?.corpusVersion || commentaryPassages[0]?.corpusVersion || yilin[0]?.corpusVersion || null
  return json({
    corpusVersion: version,
    baseHexagram,
    changedHexagram,
    corePassages,
    commentaryPassages,
    yilin: yilin[0] || null,
  })
}
