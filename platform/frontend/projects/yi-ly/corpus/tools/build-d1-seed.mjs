#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const corpusRoot = path.resolve(here, '..');
const outputPath = process.argv[2];
if (!outputPath) {
  console.error('用法：node build-d1-seed.mjs <輸出 SQL 檔案路徑>');
  process.exit(2);
}

const read = (relative) => JSON.parse(fs.readFileSync(path.join(corpusRoot, relative), 'utf8'));
const sha = (value) => String(value ?? '').replace(/^sha256:/, '');
const hashText = (value) => createHash('sha256').update(String(value ?? ''), 'utf8').digest('hex');
const q = (value) => value == null ? 'NULL' : `'${String(value).replaceAll("'", "''")}'`;
const n = (value) => value == null || value === '' ? 'NULL' : String(Number(value));
const j = (value) => q(JSON.stringify(value ?? {}));
const sql = [];
const insert = (table, columns, values) => sql.push(`INSERT OR IGNORE INTO ${table} (${columns.join(', ')}) VALUES (${values.join(', ')});`);
const version = 'source-snapshot-2026-11-17-v1';

const hexStage = read('staging/wikisource-zhouyi-hexagrams.json');
const commentaryStage = read('staging/wikisource-zhouyi-commentaries.json');
const yilinStage = read('staging/eee-learning-jiaoshi-yilin-siku-v2.json');
const zhouyiManifest = read('raw/wikisource-zhouyi/manifest.json');
const yizhuanManifest = read('raw/wikisource-yizhuan-targets/manifest.json');
const yilinSource = read('sources/jiaoshi-yilin-candidates.json');

const trigramNames = { '111': '乾', '110': '兌', '101': '離', '100': '震', '011': '巽', '010': '坎', '001': '艮', '000': '坤' };
const hexagrams = new Map(hexStage.hexagrams.map((g) => [g.hexagramNumber, g]));
if (hexagrams.size !== 64 || yilinStage.entries.length !== 4096 || commentaryStage.works.reduce((sum, work) => sum + work.records.length, 0) !== 795) {
  throw new Error('來源資料筆數與預期不符，停止產生 seed。');
}
const lineByGua = new Map();
for (const [number, gua] of hexagrams) {
  const lines = gua.records.filter((record) => record.provisionalKind === 'line_statement' && Number.isInteger(record.linePosition));
  if (lines.length !== 6 || new Set(lines.map((line) => line.linePosition)).size !== 6) throw new Error(`第 ${number} 卦六爻映射不完整。`);
  const pattern = Array.from({ length: 6 }, (_, index) => {
    const line = lines.find((candidate) => candidate.linePosition === index + 1);
    const yang = /九/.test(line.textDisplay.split(/[：:]/, 1)[0]);
    const yin = /六/.test(line.textDisplay.split(/[：:]/, 1)[0]);
    if (yang === yin) throw new Error(`第 ${number} 卦第 ${index + 1} 爻陰陽無法由來源標籤唯一判定。`);
    return yang ? '1' : '0';
  }).join('');
  lineByGua.set(number, pattern);
}
if (new Set(lineByGua.values()).size !== 64) throw new Error('六爻來源標籤導出的卦畫並非 64 個唯一組合。');

insert('yi_ly_corpus_versions', ['corpus_version', 'schema_version', 'source_snapshot_date', 'import_status'], [q(version), '1', q('2026-11-17'), q('source_derived_unedited')]);

const sourceDefs = [
  { id: zhouyiManifest.sourceId, name: zhouyiManifest.sourceName, url: 'https://zh.wikisource.org/wiki/周易', edition: `入口 revision ${zhouyiManifest.entryPage.revisionId}`, license: zhouyiManifest.license, attribution: zhouyiManifest.attribution, metadata: zhouyiManifest },
  { id: yizhuanManifest.sourceId, name: yizhuanManifest.sourceName, url: 'https://zh.wikisource.org/wiki/易傳', edition: '轉址目標頁固定 revision snapshots', license: yizhuanManifest.license, attribution: yizhuanManifest.attribution, metadata: yizhuanManifest },
  { id: yilinStage.sourceId, name: '易學網《焦氏易林［四庫全書版］》', url: yilinStage.sourceIndexUrl, edition: yilinStage.edition, license: null, attribution: yilinStage.attribution, metadata: { source: yilinSource, staging: { sourceId: yilinStage.sourceId, capturedAt: yilinStage.capturedAt, rightsNote: yilinStage.rightsNote, entryCount: yilinStage.entryCount, pairCount: yilinStage.pairCount } } },
];
for (const source of sourceDefs) insert('yi_ly_sources', ['source_id', 'source_name', 'source_url', 'edition', 'license_code', 'license_url', 'attribution', 'rights_note', 'source_metadata_json'], [q(source.id), q(source.name), q(source.url), q(source.edition), q(source.license?.code), q(source.license?.url), q(source.attribution), q(source.license?.sourcePageStatement ?? yilinStage.rightsNote), j(source.metadata)]);

const pageKeys = new Map();
const addPage = (sourceId, page, role, snapshotFile = null, extra = {}) => {
  if (!page) return null;
  const key = `${sourceId}:${page.pageId ?? page.page_id ?? page.title}:${page.revisionId ?? page.revision_id ?? 'web-snapshot'}`;
  if (pageKeys.has(key)) return key;
  pageKeys.set(key, true);
  insert('yi_ly_source_pages', ['source_page_key', 'source_id', 'page_title', 'page_id', 'revision_id', 'revision_timestamp', 'canonical_url', 'fixed_url', 'content_format', 'content_sha256', 'snapshot_file', 'page_role', 'metadata_json'], [q(key), q(sourceId), q(page.title ?? page.sourceTitle ?? page.pageTitle), q(page.pageId), q(page.revisionId), q(page.revisionTimestamp ?? page.revision_timestamp), q(page.canonicalUrl), q(page.revisionUrl ?? page.sourceUrl), q(page.contentFormat ?? 'html-text-capture'), q(sha(page.contentSha256 ?? page.sourcePageSha256)), q(snapshotFile), q(role), j({ ...page, ...extra })]);
  return key;
};
for (const item of zhouyiManifest.pageInventory) addPage(zhouyiManifest.sourceId, item, item.category, item.snapshotFile);
for (const item of yizhuanManifest.pageInventory) addPage(yizhuanManifest.sourceId, item, 'commentary_target', item.snapshotFile);
for (const alias of yizhuanManifest.redirectAliases) addPage(zhouyiManifest.sourceId, { title: alias.aliasTitle, pageId: alias.aliasPageId, revisionId: alias.aliasRevisionId, revisionUrl: alias.aliasRevisionUrl }, 'redirect_alias', alias.aliasSnapshotFile, { redirectTargetTitle: alias.redirectTargetTitle });
for (let base = 1; base <= 64; base++) {
  const page = read(`raw/eee-learning-jiaoshi-yilin-siku-v2/${String(base).padStart(2, '0')}.json`);
  addPage(yilinStage.sourceId, { title: page.pageTitle, pageId: `base-${base}`, revisionId: page.capturedAt, revisionTimestamp: page.capturedAt, canonicalUrl: page.sourceUrl, revisionUrl: page.sourceUrl, contentFormat: 'extracted-html-paragraphs', sourcePageSha256: page.sourcePageSha256 }, 'yilin_hexagram_page', `raw/eee-learning-jiaoshi-yilin-siku-v2/${String(base).padStart(2, '0')}.json`, { baseHexagramNumber: base });
}

const findSourcePageKey = (sourceId, pageId, revisionId) => `${sourceId}:${pageId}:${revisionId}`;
for (const [number, gua] of hexagrams) {
  const name = gua.sourceTitle.split('/').at(-1);
  const pattern = lineByGua.get(number);
  const lower = pattern.slice(0, 3); const upper = pattern.slice(3, 6);
  const pageKey = findSourcePageKey(zhouyiManifest.sourceId, gua.pageId, gua.revisionId);
  insert('yi_ly_hexagrams', ['hexagram_number', 'hexagram_name', 'pattern_bottom_up', 'lower_trigram_pattern', 'lower_trigram_name', 'upper_trigram_pattern', 'upper_trigram_name', 'source_page_key'], [String(number), q(name), q(pattern), q(lower), q(trigramNames[lower]), q(upper), q(trigramNames[upper]), q(pageKey)]);
}

let zhouyiCount = 0; let commentaryCount = 0; let yilinCount = 0;
for (const [number, gua] of hexagrams) {
  const pageKey = findSourcePageKey(zhouyiManifest.sourceId, gua.pageId, gua.revisionId);
  for (const record of gua.records) {
    const metadata = { ...record, parserStagingStatus: gua.stagingStatus, sourceTitle: gua.sourceTitle, sourceContentSha256: gua.sourceContentSha256, revisionId: gua.revisionId };
    insert('yi_ly_passages', ['passage_id','corpus_version','work_id','work_name','work_type','passage_kind','source_id','source_page_key','source_locator','source_entry_number','hexagram_number','line_position','text_source','text_display','source_text_sha256','display_text_sha256','parser_version','extraction_status','source_marker','source_metadata_json'], [q(`zhouyi:${record.recordId}`), q(version), q('zhouyi'), q('周易'), q('base_text'), q(record.provisionalKind), q(gua.sourceId), q(pageKey), q(record.sourceLocator), 'NULL', String(number), n(record.linePosition), q(record.sourceWikitext), q(record.textDisplay), q(sha(gua.sourceContentSha256)), q(null), n(gua.parserVersion), q(record.reviewStatus), q(record.listMarker), j(metadata)]);
    sql.push(`UPDATE yi_ly_passages SET source_text_sha256=${q(hashText(record.sourceWikitext))}, display_text_sha256=${q(hashText(record.textDisplay))} WHERE passage_id=${q(`zhouyi:${record.recordId}`)} AND text_source=${q(record.sourceWikitext)};`);
    zhouyiCount++;
  }
}
for (const work of commentaryStage.works) {
  const page = work.contentPage;
  const pageKey = findSourcePageKey(page.sourceId, page.pageId, page.revisionId);
  for (const record of work.records) {
    const metadata = { ...record, parserStagingStatus: work.stagingStatus, workType: work.workType, relationToHexagrams: work.relationToHexagrams, aliasPage: work.aliasPage, redirectTarget: work.redirectTarget, contentPage: work.contentPage };
    insert('yi_ly_passages', ['passage_id','corpus_version','work_id','work_name','work_type','passage_kind','source_id','source_page_key','source_locator','source_entry_number','hexagram_number','line_position','text_source','text_display','source_text_sha256','display_text_sha256','parser_version','extraction_status','source_marker','source_metadata_json'], [q(`commentary:${work.workId}:${record.recordId}`), q(version), q(work.workId), q(work.workName), q(work.workType), q(record.provisionalKind), q(page.sourceId), q(pageKey), q(record.sourceLocator), 'NULL', n(record.candidateHexagramNumber), n(record.linePosition), q(record.sourceWikitext), q(record.textDisplay), q(sha(page.contentSha256)), q(null), n(work.parserVersion), q(record.reviewStatus), q(record.sourceMarker), j(metadata)]);
    sql.push(`UPDATE yi_ly_passages SET source_text_sha256=${q(hashText(record.sourceWikitext))}, display_text_sha256=${q(hashText(record.textDisplay))} WHERE passage_id=${q(`commentary:${work.workId}:${record.recordId}`)} AND text_source=${q(record.sourceWikitext)};`);
    commentaryCount++;
  }
}
for (const entry of yilinStage.entries) {
  const sourcePageKey = findSourcePageKey(yilinStage.sourceId, `base-${entry.baseHexagramNumber}`, read(`raw/eee-learning-jiaoshi-yilin-siku-v2/${String(entry.baseHexagramNumber).padStart(2, '0')}.json`).capturedAt);
  const page = `raw/eee-learning-jiaoshi-yilin-siku-v2/${String(entry.baseHexagramNumber).padStart(2, '0')}.json`;
  const metadata = { ...entry, sourcePageUrl: entry.sourcePageUrl, parserVersion: yilinStage.parserVersion, traditionalAttribution: yilinSource.traditionalAttribution };
  insert('yi_ly_passages', ['passage_id','corpus_version','work_id','work_name','work_type','passage_kind','source_id','source_page_key','source_locator','source_entry_number','hexagram_number','base_hexagram_number','changed_hexagram_number','text_source','text_display','source_text_sha256','display_text_sha256','parser_version','extraction_status','source_marker','source_metadata_json'], [q(`yilin:${entry.baseHexagramNumber}:${entry.changedHexagramNumber}`), q(version), q(yilinStage.workId), q(yilinStage.displayTitle), q('yilin'), q('yilin_poem'), q(yilinStage.sourceId), q(sourcePageKey), q(entry.sourcePageUrl), String(entry.sourceEntryNumber), n(entry.baseHexagramNumber), n(entry.baseHexagramNumber), n(entry.changedHexagramNumber), q(entry.poemText), q(entry.poemText), q(sha(entry.sourceParagraphSha256)), q(sha(entry.textSha256)), n(yilinStage.parserVersion), q('machine_extracted_unedited'), q(null), j(metadata)]);
  yilinCount++;
}
if (zhouyiCount !== 1005 || commentaryCount !== 795 || yilinCount !== 4096) throw new Error(`匯入筆數異常：周易 ${zhouyiCount}，傳文 ${commentaryCount}，易林 ${yilinCount}`);
fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
fs.writeFileSync(path.resolve(outputPath), `${sql.join('\n')}\n`);
console.log(JSON.stringify({ outputPath: path.resolve(outputPath), corpusVersion: version, hexagrams: 64, zhouyiPassages: zhouyiCount, commentaryPassages: commentaryCount, yilinPassages: yilinCount, sourcePages: pageKeys.size }, null, 2));
