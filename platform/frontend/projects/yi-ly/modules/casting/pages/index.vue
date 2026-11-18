<script setup>
import { computed, onBeforeUnmount, ref } from 'vue'
import world from '@/world.js'
import { fetchReadingForPatterns } from '../api/corpus.js'
import { buildCastingResult, selectKaoBianPassages } from '../service.js'

const lineNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
const categories = ['事業', '感情', '財運', '健康', '其他']
const timedOrder = [6, 5, 4, 3, 2, 1]

const mode = ref('timed')
const stage = ref('input')
const question = ref('')
const category = ref('事業')
const manualLines = ref(makeManualLines())
const timedLines = ref([])
const countdown = ref(3)
const countdownTimer = ref(null)
const timerStartedAt = ref(null)
const casting = ref(null)
const reading = ref(null)
const readingLoading = ref(false)
const readingError = ref('')
const readingFramework = ref('overview')
const copyMessage = ref('')
const copyFallbackText = ref('')
const historyOpen = ref(false)
const historyLoading = ref(false)
const historyEntries = ref([])
const historyMessage = ref('')
const historySearch = ref('')
const selectedHistoryIds = ref([])
const editingHistoryId = ref('')
const historyNameDraft = ref('')
const importingHistory = ref(false)
const historyImportInput = ref(null)
const saveOpen = ref(false)
const saveName = ref('')
const saveNameLoading = ref(false)
const saveMessage = ref('')
const savedReadingId = ref('')

const manualComplete = computed(() => manualLines.value.every((line) => line.coins.every((coin) => coin !== null)))
const manualLineDisplay = computed(() => [...manualLines.value].reverse())
const timedComplete = computed(() => timedLines.value.length === 6)
const visibleHistoryEntries = computed(() => {
  const keyword = historySearch.value.trim().toLocaleLowerCase()
  if (!keyword) return historyEntries.value
  return historyEntries.value.filter((entry) => {
    const data = entry.data || {}
    const searchableText = [
      data.name,
      data.question,
      data.category,
      data.reading?.baseHexagram?.hexagram_name,
      data.reading?.changedHexagram?.hexagram_name,
      data.reading?.yilin?.text,
    ].filter(Boolean).join(' ').toLocaleLowerCase()
    return searchableText.includes(keyword)
  })
})
const baseCorePassages = computed(() => passagesFor(reading.value?.corePassages, reading.value?.baseHexagram?.hexagram_number))
const changedCorePassages = computed(() => passagesFor(reading.value?.corePassages, reading.value?.changedHexagram?.hexagram_number))
const movingPassages = computed(() => baseCorePassages.value.filter((passage) => passage.kind === 'line_statement' && casting.value?.movingPositions.includes(passage.linePosition)))
const baseJudgment = computed(() => baseCorePassages.value.filter((passage) => ['judgment', 'judgment_continuation'].includes(passage.kind)))
const changedJudgment = computed(() => {
  if (casting.value?.basePatternBottomUp === casting.value?.changedPatternBottomUp) return []
  return changedCorePassages.value.filter((passage) => ['judgment', 'judgment_continuation'].includes(passage.kind))
})
const specialStatements = computed(() => baseCorePassages.value.filter((passage) => {
  if (passage.kind === 'use_nine') return casting.value?.movingPositions.length === 6 && reading.value?.baseHexagram?.hexagram_name === '乾'
  if (passage.kind === 'use_six') return casting.value?.movingPositions.length === 6 && reading.value?.baseHexagram?.hexagram_name === '坤'
  return false
}))
const commentaryPassages = computed(() => reading.value?.commentaryPassages || [])
const lineDisplay = computed(() => [...(casting.value?.lines || [])].reverse())
const standardReadingSections = computed(() => [
  { title: '本卦卦辭', passages: baseJudgment.value },
  { title: '動爻爻辭', passages: movingPassages.value },
  { title: '特殊用爻', passages: specialStatements.value },
  { title: '之卦卦辭', passages: changedJudgment.value },
].filter((section) => section.passages.length))
const readingSections = computed(() => {
  if (readingFramework.value !== 'zhu-xi-kao-bian' || !casting.value || !reading.value) return standardReadingSections.value
  return selectKaoBianPassages({
    movingPositions: casting.value.movingPositions,
    baseHexagramName: reading.value.baseHexagram?.hexagram_name,
    basePassages: baseCorePassages.value,
    changedPassages: changedCorePassages.value,
  })
})

function makeManualLines() {
  return Array.from({ length: 6 }, (_, index) => ({ position: index + 1, coins: [null, null, null] }))
}

function passagesFor(passages, hexagramNumber) {
  if (!Array.isArray(passages) || !hexagramNumber) return []
  return passages.filter((passage) => passage.hexagramNumber === hexagramNumber)
}

function selectCoin(position, coinIndex, value) {
  const line = manualLines.value.find((item) => item.position === position)
  if (!line) return
  line.coins[coinIndex] = value
}

function manualRawLines() {
  return manualLines.value.map((line) => ({ position: line.position, coins: [...line.coins] }))
}

async function beginManualCasting() {
  if (!manualComplete.value) return
  await finishCasting('manual-coins-v1', manualRawLines())
}

function clearCountdown() {
  if (countdownTimer.value !== null) {
    window.clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

function beginTimedCasting() {
  clearCountdown()
  timedLines.value = []
  countdown.value = 3
  timerStartedAt.value = null
  stage.value = 'countdown'
  countdownTimer.value = window.setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1
      return
    }
    clearCountdown()
    countdown.value = 0
    timerStartedAt.value = performance.now()
    stage.value = 'timed'
  }, 850)
}

async function tapTimedLine(position) {
  if (stage.value !== 'timed' || timerStartedAt.value === null || timedLines.value.some((line) => line.position === position)) return
  const elapsedMilliseconds = Math.max(0, Math.floor(performance.now() - timerStartedAt.value))
  timedLines.value.push({ position, elapsedMilliseconds })
  if (timedComplete.value) {
    await finishCasting('timed-six-key-v1', [...timedLines.value])
  }
}

async function finishCasting(inputMode, rawLines) {
  clearCountdown()
  reading.value = null
  readingError.value = ''
  copyMessage.value = ''
  copyFallbackText.value = ''
  savedReadingId.value = ''
  readingFramework.value = 'overview'
  stage.value = 'result'

  try {
    casting.value = buildCastingResult({
      inputMode,
      rawLines,
      question: question.value,
      category: category.value,
    })
  } catch (error) {
    stage.value = 'input'
    readingError.value = error.message || '起卦資料不完整，請重新確認六爻。'
    return
  }

  readingLoading.value = true
  try {
    reading.value = await fetchReadingForPatterns(casting.value.basePatternBottomUp, casting.value.changedPatternBottomUp)
  } catch (error) {
    readingError.value = error.message || '經文資料暫時無法讀取。'
  } finally {
    readingLoading.value = false
  }
}

async function retryReading() {
  if (!casting.value) return
  const existingSavedId = savedReadingId.value
  const rawLines = casting.value.lines.map((line) => (
    casting.value.inputMode === 'manual-coins-v1'
      ? { position: line.position, coins: line.rawInput }
      : { position: line.position, elapsedMilliseconds: line.rawInput.elapsedMilliseconds }
  ))
  await finishCasting(casting.value.inputMode, rawLines)
  if (existingSavedId) savedReadingId.value = existingSavedId
}

function resetCasting() {
  clearCountdown()
  stage.value = 'input'
  question.value = ''
  category.value = '事業'
  manualLines.value = makeManualLines()
  timedLines.value = []
  countdown.value = 3
  timerStartedAt.value = null
  casting.value = null
  reading.value = null
  readingError.value = ''
  readingLoading.value = false
  readingFramework.value = 'overview'
  savedReadingId.value = ''
  copyMessage.value = ''
  copyFallbackText.value = ''
  saveMessage.value = ''
}

function refreshScreen() {
  window.location.reload()
}

function formatLineValue(value) {
  if (value === 6) return '老陰 · 6'
  if (value === 7) return '少陽 · 7'
  if (value === 8) return '少陰 · 8'
  return '老陽 · 9'
}

// 將每爻保留的輸入資料整理成可核對的文字。
function rawLineDescription(line) {
  if (casting.value?.inputMode === 'manual-coins-v1') {
    return (line.rawInput || []).map((coin) => coin === 3 ? '正面' : '反面').join('、')
  }
  const timing = line.rawInput || {}
  return `${timing.elapsedMilliseconds} 毫秒 % 8 = ${timing.remainder} → ${formatLineValue(line.value)}`
}

// 顯示保存紀錄所附語料的版本與來源。
function historySourceLabel(entry) {
  const readingData = entry.data?.reading
  const source = readingData?.yilin?.source || readingData?.corePassages?.find((passage) => passage.source)?.source
  return [source?.name, source?.edition].filter(Boolean).join('・')
}

function patternRows(pattern) {
  if (!pattern) return []
  return [...pattern].reverse().map((line, index) => ({ position: 6 - index, yang: line === '1' }))
}

function baseHexagramTitle() {
  return reading.value?.baseHexagram?.hexagram_name || '本卦'
}

function changedHexagramTitle() {
  return reading.value?.changedHexagram?.hexagram_name || '之卦'
}

function sourceList() {
  const selected = [
    ...(reading.value?.corePassages || []),
    ...(reading.value?.yilin ? [reading.value.yilin] : []),
  ]
  const seen = new Set()
  return selected.filter((passage) => {
    const key = `${passage.source?.id}:${passage.source?.url}`
    if (!passage.source || seen.has(key)) return false
    seen.add(key)
    return true
  }).map((passage) => passage.source)
}

function questionAndPoemPrompt() {
  if (!reading.value?.yilin) return ''
  const poem = reading.value.yilin
  const source = poem.source
  const sourceName = source?.name?.trim() || '來源未標示'
  const rawEdition = source?.edition?.trim() || ''
  const edition = rawEdition.startsWith(sourceName)
    ? rawEdition.slice(sourceName.length).replace(/^[｜|；;：:\s]+/, '').trim()
    : rawEdition
  const sourceCitation = [sourceName, edition, source?.url].filter(Boolean).join('｜')
  return [
    '請依序解讀：一、逐句說明關鍵字詞在詩中的可能意思，以及整體意象；若有多種解釋，簡要列出。二、整理詩句呈現的情勢、象徵與變化，說明判讀依據。三、將詩意與我的問題、對象或目標進行對照和類比，提出可能的回應方向，並指出哪些詩句或意象支持這種理解。請以詩籤原文為主要依據，不額外引入其他卦辭、爻辭、傳文、術數或未提供的背景。清楚區分原文、字義和推論；類比解讀不代表必然預言。若詩意或問題資訊不足以支持明確對應，請說明不同可能性與不確定處，不必勉強下結論。',
    '【我的問題】',
    casting.value.question || '（尚未填寫）',
    '【《焦氏易林》詩籤原文】',
    poem.text,
    `【來源】${sourceCitation}`,
  ].filter(Boolean).join('\n\n')
}

async function copyQuestionAndPoem() {
  if (!reading.value?.yilin) return
  const prompt = questionAndPoemPrompt()
  copyFallbackText.value = ''
  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(prompt)
        copyMessage.value = '問題與詩籤已複製，現在可以貼到外部 AI 詢問。'
        return
      } catch {
        // 區網 HTTP 或瀏覽器權限限制時，改用使用者點擊觸發的相容複製方式。
      }
    }
    const textarea = document.createElement('textarea')
    textarea.value = prompt
    textarea.setAttribute('readonly', '')
    textarea.style.position = 'fixed'
    textarea.style.top = '0'
    textarea.style.left = '-9999px'
    textarea.style.fontSize = '16px'
    document.body.appendChild(textarea)
    textarea.focus()
    textarea.select()
    textarea.setSelectionRange(0, textarea.value.length)
    let copied = false
    try {
      copied = document.execCommand('copy')
    } finally {
      textarea.remove()
    }
    if (!copied) throw new Error('clipboard unavailable')
    copyMessage.value = '問題與詩籤已複製，現在可以貼到外部 AI 詢問。'
  } catch {
    copyFallbackText.value = prompt
    copyMessage.value = '瀏覽器未允許自動複製，請長按下方文字並選取複製。'
  }
}

function selectFallbackText(event) {
  event.target.focus()
  event.target.select()
  event.target.setSelectionRange(0, event.target.value.length)
}

function makeReadingId() {
  if (globalThis.crypto?.randomUUID) return globalThis.crypto.randomUUID()
  return `reading-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

async function openHistory() {
  historyOpen.value = true
  historyMessage.value = ''
  historySearch.value = ''
  selectedHistoryIds.value = []
  editingHistoryId.value = ''
  historyLoading.value = true
  try {
    const entries = await world.iDB.list({ module: 'casting', category: 'history' })
    historyEntries.value = entries.sort((a, b) => (
      new Date(b.data?.savedAt || b.data?.casting?.createdAt || 0).getTime()
      - new Date(a.data?.savedAt || a.data?.casting?.createdAt || 0).getTime()
    ))
  } catch (error) {
    historyEntries.value = []
    historyMessage.value = `讀取本機紀錄失敗：${error?.message || 'IndexedDB 無法使用。'}`
  } finally {
    historyLoading.value = false
  }
}

// 依照使用者勾選的本機紀錄更新批次選取清單。
function toggleHistorySelection(id) {
  selectedHistoryIds.value = selectedHistoryIds.value.includes(id)
    ? selectedHistoryIds.value.filter((selectedId) => selectedId !== id)
    : [...selectedHistoryIds.value, id]
}

// 將選取的紀錄另存成 JSON，供使用者自行備份或搬移裝置。
function exportHistory() {
  if (!historyEntries.value.length) return
  const payload = {
    format: 'yi-ly-casting-history',
    schemaVersion: 1,
    exportedAt: new Date().toISOString(),
    entries: historyEntries.value.map(({ id, data }) => ({ id, data })),
  }
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  anchor.href = url
  anchor.download = `yi-ly-history-${new Date().toISOString().slice(0, 10)}.json`
  anchor.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
  historyMessage.value = `已匯出 ${historyEntries.value.length} 筆本機紀錄。`
}

// 驗證備份格式後以新 ID 匯入，不覆蓋現有紀錄或連線後端。
async function importHistory(event) {
  const file = event.target.files?.[0]
  if (!file) return
  importingHistory.value = true
  historyMessage.value = ''
  let importedCount = 0
  try {
    if (file.size > 25 * 1024 * 1024) throw new Error('備份檔超過 25 MB，請確認選擇正確的檔案。')
    const payload = JSON.parse(await file.text())
    if (payload?.format !== 'yi-ly-casting-history' || payload.schemaVersion !== 1 || !Array.isArray(payload.entries)) {
      throw new Error('檔案格式或版本不支援。')
    }
    if (!payload.entries.every((entry) => (
      entry?.data?.casting?.schemaVersion === 1
      && Array.isArray(entry.data.casting.lines)
      && entry.data.casting.lines.length === 6
    ))) {
      throw new Error('備份內含無效或不完整的卦象紀錄，沒有匯入任何資料。')
    }
    for (const entry of payload.entries) {
      await world.iDB.save({
        module: 'casting',
        category: 'history',
        id: makeReadingId(),
        data: { ...entry.data, importedAt: new Date().toISOString() },
      })
      importedCount += 1
    }
    historyMessage.value = `已匯入 ${importedCount} 筆紀錄；原有紀錄均保留。`
  } catch (error) {
    historyMessage.value = importedCount
      ? `已匯入 ${importedCount} 筆，其餘未完成：${error?.message || '本機儲存失敗。'}`
      : `匯入失敗：${error?.message || '請確認備份檔案。'}`
  } finally {
    event.target.value = ''
    importingHistory.value = false
    try {
      const entries = await world.iDB.list({ module: 'casting', category: 'history' })
      historyEntries.value = entries.sort((a, b) => (
        new Date(b.data?.savedAt || b.data?.casting?.createdAt || 0).getTime()
        - new Date(a.data?.savedAt || a.data?.casting?.createdAt || 0).getTime()
      ))
    } catch {
      // 匯入狀態訊息保留主要結果；清單載入錯誤會在下次開啟時顯示。
    }
  }
}

// 開始在歷史清單中編輯單筆紀錄名稱。
function beginRenameHistory(entry) {
  editingHistoryId.value = entry.id
  historyNameDraft.value = entry.data?.name || ''
  historyMessage.value = ''
}

// 將更新後的名稱寫回本機 IndexedDB。
async function renameHistory(entry) {
  const name = historyNameDraft.value.trim()
  if (!name) {
    historyMessage.value = '紀錄名稱不可空白。'
    return
  }
  try {
    const data = { ...entry.data, name, nameOrigin: 'user', updatedAt: new Date().toISOString() }
    await world.iDB.save({ module: 'casting', category: 'history', id: entry.id, data })
    historyEntries.value = historyEntries.value.map((item) => item.id === entry.id ? { ...item, data } : item)
    editingHistoryId.value = ''
    historyMessage.value = '紀錄名稱已更新。'
  } catch (error) {
    historyMessage.value = `改名失敗：${error?.message || '本機儲存失敗。'}`
  }
}

// 依使用者確認刪除所選本機紀錄。
async function removeSelectedHistory() {
  const ids = [...selectedHistoryIds.value]
  if (!ids.length || !window.confirm(`確定刪除選取的 ${ids.length} 筆紀錄？此操作無法復原。`)) return
  let removedCount = 0
  for (const id of ids) {
    try {
      await world.iDB.remove({ module: 'casting', category: 'history', id })
      removedCount += 1
      if (savedReadingId.value === id) savedReadingId.value = ''
    } catch (error) {
      historyMessage.value = `已刪除 ${removedCount} 筆；後續刪除失敗：${error?.message || '本機儲存失敗。'}`
      break
    }
  }
  const removedIds = new Set(ids.slice(0, removedCount))
  historyEntries.value = historyEntries.value.filter((entry) => !removedIds.has(entry.id))
  selectedHistoryIds.value = []
  if (removedCount === ids.length) historyMessage.value = `已刪除 ${removedCount} 筆紀錄。`
}

async function openSaveDialog() {
  saveName.value = ''
  saveNameLoading.value = true
  saveMessage.value = ''
  saveOpen.value = true
  try {
    const entries = await world.iDB.list({ module: 'casting', category: 'history' })
    const latestUserNamedEntry = entries
      .filter((entry) => entry.data?.nameOrigin === 'user' && entry.data?.name?.trim())
      .sort((a, b) => new Date(b.data.savedAt || 0).getTime() - new Date(a.data.savedAt || 0).getTime())[0]
    saveName.value = latestUserNamedEntry?.data?.name || ''
  } catch {
    saveName.value = ''
  } finally {
    saveNameLoading.value = false
  }
}

async function saveReading() {
  if (!casting.value) return
  const name = saveName.value.trim()
  if (!name) {
    saveMessage.value = '請先輸入紀錄名稱。'
    return
  }
  const id = makeReadingId()
  try {
    await world.iDB.save({
      module: 'casting',
      category: 'history',
      id,
      data: {
        name,
        nameOrigin: 'user',
        question: casting.value.question,
        category: casting.value.category,
        casting: casting.value,
        reading: reading.value || null,
        readingFramework: readingFramework.value,
        savedAt: new Date().toISOString(),
      },
    })
    savedReadingId.value = id
    saveOpen.value = false
  } catch (error) {
    saveMessage.value = error?.message
      ? `本機保存失敗：${error.message}`
      : '目前無法保存到本機，卦象仍保留在這個畫面。'
  }
}

async function restoreReading(entry) {
  const data = entry?.data
  if (!data?.casting) return
  casting.value = data.casting
  reading.value = data.reading || null
  question.value = data.question || ''
  category.value = data.category || '其他'
  readingFramework.value = data.readingFramework || 'overview'
  savedReadingId.value = entry.id
  readingError.value = reading.value ? '' : '這筆紀錄只有卦象資料；經文尚未載入，可連線後重試。'
  historyOpen.value = false
  stage.value = 'result'
}

async function removeHistory(entry) {
  if (!window.confirm(`確定刪除「${entry.data?.name || '本次卦象'}」？此操作無法復原。`)) return
  try {
    await world.iDB.remove({ module: 'casting', category: 'history', id: entry.id })
    historyEntries.value = historyEntries.value.filter((item) => item.id !== entry.id)
    selectedHistoryIds.value = selectedHistoryIds.value.filter((id) => id !== entry.id)
    if (savedReadingId.value === entry.id) savedReadingId.value = ''
    historyMessage.value = '紀錄已刪除。'
  } catch (error) {
    historyMessage.value = `刪除失敗：${error?.message || '本機儲存失敗。'}`
  }
}

onBeforeUnmount(() => {
  clearCountdown()
})
</script>

<template lang="pug">
.yi-casting
  svg.yi-casting__paper-grain(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 160" preserveAspectRatio="none" aria-hidden="true" focusable="false")
    defs
      filter#paper-fiber
        feTurbulence(type="fractalNoise" baseFrequency="0.78 0.035" numOctaves="3" seed="8")
        feColorMatrix(type="saturate" values="0")
    rect(width="100%" height="100%" filter="url(#paper-fiber)")
  svg.yi-casting__landscape(xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 480" preserveAspectRatio="xMidYMax slice" aria-hidden="true" focusable="false")
    defs
      linearGradient#mountain-wash(x1="0" y1="0" x2="0" y2="1")
        stop(offset="0" stop-color="#262422" stop-opacity="0.015")
        stop(offset="1" stop-color="#262422" stop-opacity="0.08")
      linearGradient#mountain-far(x1="0" y1="0" x2="0" y2="1")
        stop(offset="0" stop-color="#262422" stop-opacity="0.015")
        stop(offset="1" stop-color="#262422" stop-opacity="0.055")
    path(fill="url(#mountain-far)" d="M0 253 C92 220 120 177 196 194 C257 207 281 250 351 235 C420 219 467 149 535 171 C602 193 610 235 678 221 C751 206 789 139 865 159 C930 176 961 227 1033 218 C1105 210 1141 157 1203 174 C1284 196 1316 243 1440 211 L1440 480 L0 480 Z")
    path(fill="url(#mountain-wash)" d="M0 326 C124 281 170 239 262 263 C350 287 381 323 464 301 C549 278 602 222 704 249 C790 271 819 315 905 296 C1000 276 1045 221 1134 248 C1223 276 1283 331 1440 285 L1440 480 L0 480 Z")
    path(fill="#262422" fill-opacity="0.035" d="M0 389 C138 359 225 320 329 345 C432 370 501 407 614 374 C722 343 804 309 916 342 C1042 378 1113 418 1226 386 C1329 357 1386 353 1440 365 L1440 480 L0 480 Z")
    path(fill="#FAF8F3" fill-opacity="0.48" d="M0 357 C172 334 224 368 389 351 C543 335 652 366 789 344 C949 319 1042 369 1190 348 C1300 332 1365 342 1440 328 L1440 480 L0 480 Z")
  .yi-casting__paper
    header.yi-casting__header
      .yi-casting__brand
        button.yi-casting__logo-button(type="button" aria-label="重新整理畫面" title="重新整理畫面" @click="refreshScreen")
          span(aria-hidden="true") 易
        .yi-casting__brand-copy
          p.yi-casting__eyebrow 易經 · 卜問與閱讀
          h1 易占
      button.yi-casting__icon-button(type="button" aria-label="開啟卜卦歷史" @click="openHistory") ⟲

    main(v-if="stage === 'input'" class="yi-casting__main")
      section.yi-casting__question-card
        label.yi-casting__section-label(for="casting-question") 今日所問
        textarea#casting-question.yi-casting__question(v-model="question" rows="2" maxlength="240" placeholder="寫下你想詢問的事情，也可以留白。")
        svg.yi-casting__ink-divider(viewBox="0 0 360 8" preserveAspectRatio="none" aria-hidden="true" focusable="false")
          defs
            linearGradient#ink-line-gradient(x1="0" y1="0" x2="1" y2="0")
              stop(offset="0" stop-color="#78736A" stop-opacity="0")
              stop(offset="0.12" stop-color="#78736A" stop-opacity="0.55")
              stop(offset="0.5" stop-color="#262422" stop-opacity="0.72")
              stop(offset="0.88" stop-color="#78736A" stop-opacity="0.55")
              stop(offset="1" stop-color="#78736A" stop-opacity="0")
          path(d="M2 4 C78 3.3 114 4.7 179 3.8 C245 3 290 4.6 358 3.5" fill="none" stroke="url(#ink-line-gradient)" stroke-width="1.15" stroke-linecap="round")
        .yi-casting__category-list(role="group" aria-label="問題分類")
          button(v-for="item in categories" :key="item" type="button" :class="['yi-casting__category', { 'is-active': category === item }]" :aria-pressed="category === item" @click="category = item") {{ item }}

      .yi-casting__mode-switch(role="tablist" aria-label="選擇起卦方式")
        button(type="button" role="tab" :aria-selected="mode === 'manual'" :class="{ 'is-active': mode === 'manual' }" @click="mode = 'manual'") 手動輸入
        button(type="button" role="tab" :aria-selected="mode === 'timed'" :class="{ 'is-active': mode === 'timed' }" @click="mode = 'timed'") 時機取數

      section(v-if="mode === 'manual'" class="yi-casting__entry-panel game-stage")
        .yi-casting__panel-heading
          div
            h2 實體三錢
            p 每一爻依序記下三枚錢的正反面，由初爻往上填。
          span.yi-casting__panel-mark 金錢法
        .yi-casting__line-entry-list
          .yi-casting__line-entry(v-for="line in manualLineDisplay" :key="line.position")
            .yi-casting__line-info
              span.yi-casting__line-name {{ lineNames[line.position - 1] }}
              span.yi-casting__line-result(v-if="line.coins.every((coin) => coin !== null)") {{ line.coins.reduce((sum, coin) => sum + coin, 0) }}
              span.yi-casting__line-result.is-empty(v-else) —
            .yi-casting__coins(role="group" :aria-label="`${lineNames[line.position - 1]}三枚錢結果`")
              .yi-casting__coin-pair(v-for="(coin, index) in line.coins" :key="index")
                button(type="button" :class="['yi-casting__coin', { 'is-selected': coin === 3 }]" :aria-label="`${lineNames[line.position - 1]}第${index + 1}枚選正面`" :aria-pressed="coin === 3" @click="selectCoin(line.position, index, 3)") 正
                button(type="button" :class="['yi-casting__coin', { 'is-selected': coin === 2 }]" :aria-label="`${lineNames[line.position - 1]}第${index + 1}枚選反面`" :aria-pressed="coin === 2" @click="selectCoin(line.position, index, 2)") 反
            .yi-casting__line-preview(:aria-label="line.coins.every((coin) => coin !== null) ? `爻值 ${line.coins.reduce((sum, coin) => sum + coin, 0)}` : '尚未完成'")
              span(v-if="line.coins.every((coin) => coin !== null) && line.coins.reduce((sum, coin) => sum + coin, 0) % 2 === 1") ━━━━━
              span.yi-casting__broken-line(v-else-if="line.coins.every((coin) => coin !== null)")
              span.yi-casting__line-placeholder(v-else) ━ ━ ━
        p.yi-casting__helper 正面記 3 點、反面記 2 點；依三枚錢的點數加總，不替你選爻。

      section(v-else class="yi-casting__entry-panel yi-casting__timed-panel game-stage")
        .yi-casting__timed-content
          .yi-casting__start-emblem(aria-hidden="true")
            svg.yi-casting__enso(viewBox="0 0 160 160" focusable="false")
              defs
                mask#enso-reveal-mask(maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160")
                  rect(width="160" height="160" fill="black")
                  path.yi-casting__enso-trace(d="M35 130 C18 114 12 91 17 68 C22 43 40 24 64 17 C89 10 115 18 133 37 C151 56 155 83 146 106 C137 129 116 144 93 146 C73 148 54 142 42 132" pathLength="500")
              path.yi-casting__enso-ink(mask="url(#enso-reveal-mask)" d="M34 128 C17 113 12 91 16 68 C20 43 37 24 61 16 C85 8 112 13 132 31 C153 50 159 79 151 105 C143 129 123 146 99 151 C78 155 60 148 49 140 Q45 138 43 133 C58 140 75 145 95 141 C116 136 132 121 138 101 C145 81 140 58 123 42 C106 26 84 20 64 26 C43 32 29 49 25 70 C21 90 25 109 38 120 Q42 124 34 128 Z")
              path.yi-casting__enso-heavy(mask="url(#enso-reveal-mask)" d="M20 106 C27 113 35 120 43 125 C51 130 60 135 65 142 L59 143 L55 149 L49 146 L45 151 L39 146 L35 147 L31 141 C24 137 18 133 15 126 C12 119 14 111 20 106 Z")
              path.yi-casting__enso-dry(mask="url(#enso-reveal-mask)" d="M38 43 C55 23 79 17 101 22 C122 27 139 42 146 61 M43 132 C62 148 89 150 111 139")
              path.yi-casting__enso-thread(mask="url(#enso-reveal-mask)" d="M128 48 C141 68 141 91 130 110 C121 125 105 136 88 140")
            span 起卦
            span.yi-casting__emblem-seal 占
          h2 六鍵計時
          p.yi-casting__helper 倒數後依你點擊各爻按鈕的經過時間取數。六個按鈕固定代表初爻至上爻。依序或隨意點選都可以；結果會等六爻完成後一起揭示。

      button.yi-casting__primary-button.yi-casting__stage-action(v-if="mode === 'manual'" type="button" :disabled="!manualComplete" @click="beginManualCasting") 確認起卦
      button.yi-casting__primary-button.yi-casting__stage-action(v-else type="button" @click="beginTimedCasting") 開始倒數

      p.yi-casting__privacy-note 歷史預設不保存；只有你選擇「保存紀錄」後才會寫入這台裝置。

    main(v-else-if="stage === 'countdown'" class="yi-casting__main yi-casting__interlude")
      p.yi-casting__eyebrow 六鍵計時・準備
      .yi-casting__countdown-circle(aria-live="polite")
        svg.yi-casting__enso(viewBox="0 0 160 160" focusable="false" aria-hidden="true")
          defs
            mask#enso-reveal-mask(maskUnits="userSpaceOnUse" x="0" y="0" width="160" height="160")
              rect(width="160" height="160" fill="black")
              path.yi-casting__enso-trace(d="M35 130 C18 114 12 91 17 68 C22 43 40 24 64 17 C89 10 115 18 133 37 C151 56 155 83 146 106 C137 129 116 144 93 146 C73 148 54 142 42 132" pathLength="500")
          path.yi-casting__enso-ink(mask="url(#enso-reveal-mask)" d="M34 128 C17 113 12 91 16 68 C20 43 37 24 61 16 C85 8 112 13 132 31 C153 50 159 79 151 105 C143 129 123 146 99 151 C78 155 60 148 49 140 Q45 138 43 133 C58 140 75 145 95 141 C116 136 132 121 138 101 C145 81 140 58 123 42 C106 26 84 20 64 26 C43 32 29 49 25 70 C21 90 25 109 38 120 Q42 124 34 128 Z")
          path.yi-casting__enso-heavy(mask="url(#enso-reveal-mask)" d="M20 106 C27 113 35 120 43 125 C51 130 60 135 65 142 L59 143 L55 149 L49 146 L45 151 L39 146 L35 147 L31 141 C24 137 18 133 15 126 C12 119 14 111 20 106 Z")
          path.yi-casting__enso-dry(mask="url(#enso-reveal-mask)" d="M38 43 C55 23 79 17 101 22 C122 27 139 42 146 61 M43 132 C62 148 89 150 111 139")
          path.yi-casting__enso-thread(mask="url(#enso-reveal-mask)" d="M128 48 C141 68 141 91 130 110 C121 125 105 136 88 140")
        span {{ countdown }}
      h2 靜心想著所問之事
      p 倒數結束後，六個爻位按鈕會開始記錄點擊時間。
      button.yi-casting__text-button(type="button" @click="resetCasting") 返回

    main(v-else-if="stage === 'timed'" class="yi-casting__main yi-casting__game")
      p.yi-casting__eyebrow 六鍵計時・點選爻位
      h2 依直覺點完六個爻位
      p.yi-casting__helper 完成前不顯示個別結果，避免前面的數值影響後續點選。
      .yi-casting__timed-grid
        button(v-for="position in timedOrder" :key="position" type="button" :class="['yi-casting__timed-key', { 'is-done': timedLines.some((line) => line.position === position) }]" :disabled="timedLines.some((line) => line.position === position)" :aria-label="`${lineNames[position - 1]}${timedLines.some((line) => line.position === position) ? '已完成' : '點選'}`" @click="tapTimedLine(position)")
          span.yi-casting__key-mark(v-if="timedLines.some((line) => line.position === position)") 已取
          span.yi-casting__key-mark(v-else) ○
          span {{ lineNames[position - 1] }}
      p.yi-casting__game-progress 已完成 {{ timedLines.length }}／6 爻
      button.yi-casting__text-button(type="button" @click="resetCasting") 取消並重來

    main(v-else class="yi-casting__main yi-casting__result")
      .yi-casting__result-heading
        p.yi-casting__eyebrow 卦象結果
        h2 {{ casting?.question || '本次卦象' }}
        p.yi-casting__result-meta {{ casting?.category }}・{{ casting?.inputMode === 'manual-coins-v1' ? '實體三錢手動輸入' : '六鍵計時取數' }}

      .yi-casting__gua-pair
        .yi-casting__gua-card
          p.yi-casting__gua-label 本卦
          h3 {{ baseHexagramTitle() }}
          p.yi-casting__gua-number(v-if="reading?.baseHexagram") 第 {{ reading.baseHexagram.hexagram_number }} 卦
          .yi-casting__gua-lines(aria-label="本卦卦畫，由上爻至初爻")
            .yi-casting__gua-line(v-for="line in lineDisplay" :key="`base-${line.position}`" :class="{ 'is-moving': line.moving }")
              span.yi-casting__line-position {{ lineNames[line.position - 1] }}
              span.yi-casting__yang-line(v-if="line.yinYang === 'yang'")
              span.yi-casting__broken-line(v-else)
              span.yi-casting__moving-mark(v-if="line.moving" aria-label="動爻")
              span.yi-casting__line-value {{ line.value }}
        span.yi-casting__change-arrow(aria-hidden="true") →
        .yi-casting__gua-card.is-changed
          p.yi-casting__gua-label 之卦
          h3 {{ changedHexagramTitle() }}
          p.yi-casting__gua-number(v-if="reading?.changedHexagram") 第 {{ reading.changedHexagram.hexagram_number }} 卦
          .yi-casting__gua-lines(aria-label="之卦卦畫，由上爻至初爻")
            .yi-casting__gua-line(v-for="line in lineDisplay" :key="`changed-${line.position}`")
              span.yi-casting__line-position {{ lineNames[line.position - 1] }}
              span.yi-casting__yang-line(v-if="line.changedYinYang === 'yang'")
              span.yi-casting__broken-line(v-else)
              span.yi-casting__line-value {{ line.value }}

      p.yi-casting__data-note 本頁呈現來源原文與計算結果，不自動加入占斷。
      details.yi-casting__details.yi-casting__raw-input-details
        summary 查看六爻原始輸入與換算
        .yi-casting__raw-line(v-for="line in lineDisplay" :key="`raw-${line.position}`")
          strong {{ lineNames[line.position - 1] }}
          span {{ rawLineDescription(line) }}
      section.yi-casting__result-card.yi-casting__yilin-feature(v-if="reading?.yilin")
        .yi-casting__yilin-heading
          div
            p.yi-casting__eyebrow 本卦至之卦・詩辭
            h3 《焦氏易林》卜詩結果
        p.yi-casting__passage {{ reading.yilin.text }}
        .yi-casting__yilin-source
          span {{ reading.yilin.source.name }}・{{ reading.yilin.source.edition }}
          a.yi-casting__source-link(:href="reading.yilin.source.url" target="_blank" rel="noopener noreferrer") 查看來源網頁
        button.yi-casting__primary-button.yi-casting__copy-poem(type="button" :disabled="!reading?.yilin" @click="copyQuestionAndPoem") 複製問題與詩籤，貼到外部 AI 詢問
        p.yi-casting__inline-message(v-if="copyMessage" aria-live="polite") {{ copyMessage }}
        textarea.yi-casting__copy-fallback(v-if="copyFallbackText" aria-label="手動複製問題與詩籤內容" readonly :value="copyFallbackText" @click="selectFallbackText")
      .yi-casting__result-grid
        section.yi-casting__result-card
          h3 經文原文
          p.yi-casting__loading(v-if="readingLoading") 正在讀取版本化經文⋯
          .yi-casting__error(v-else-if="readingError")
            p {{ readingError }}
            button.yi-casting__small-button(type="button" @click="retryReading") 重試載入
          template(v-else-if="reading")
            .yi-casting__framework-switch(role="group" aria-label="選擇經文閱讀方式")
              button(type="button" :class="{ 'is-active': readingFramework === 'overview' }" :aria-pressed="readingFramework === 'overview'" @click="readingFramework = 'overview'") 原文通覽
              button(type="button" :class="{ 'is-active': readingFramework === 'zhu-xi-kao-bian' }" :aria-pressed="readingFramework === 'zhu-xi-kao-bian'" @click="readingFramework = 'zhu-xi-kao-bian'") 朱熹考變占・選配
            p.yi-casting__framework-note(v-if="readingFramework === 'zhu-xi-kao-bian'") 依變爻數選讀經文；二變、四變依目前採用的規則表列示，仍待原典例證核對。這是選配閱讀方式，不改變卦象計算，也不代表唯一解法。
            template(v-if="readingSections.length")
              section.yi-casting__reading-section(v-for="section in readingSections" :key="section.title")
                h4 {{ section.title }}
                .yi-casting__passage-block(v-for="passage in section.passages" :key="passage.id")
                  p.yi-casting__passage-label(v-if="passage.linePosition") {{ lineNames[passage.linePosition - 1] }}{{ passage.priority ? '・主讀' : '' }}
                  p.yi-casting__passage {{ passage.text }}
            p.yi-casting__empty(v-else) 本次規則對應的經文段落目前沒有解析資料；請查看來源資料。
            p.yi-casting__empty(v-if="readingFramework === 'overview' && !casting?.movingPositions.length") 本卦無動爻，本次沒有動爻爻辭。
          p.yi-casting__empty(v-else) 經文尚未載入。

        section.yi-casting__result-card
          h3 其他經傳資料
          p 經文與傳文獨立呈現；上方複製功能只會帶入問題和《焦氏易林》詩籤。
          details.yi-casting__details(v-if="commentaryPassages.length")
            summary 查看傳文資料（{{ commentaryPassages.length }} 段）
            .yi-casting__passage-block(v-for="passage in commentaryPassages" :key="passage.id")
              p.yi-casting__passage-label {{ passage.work.name }}・{{ passage.source.pageTitle }}
              p.yi-casting__passage {{ passage.text }}
              a.yi-casting__source-link(:href="passage.source.url" target="_blank" rel="noopener noreferrer") 查看固定來源
      details.yi-casting__attribution(v-if="reading")
        summary 來源、版本、署名與授權
        p.yi-casting__version 語料版本：{{ reading.corpusVersion || '版本資訊依來源紀錄' }}
        .yi-casting__source-entry(v-for="source in sourceList()" :key="`${source.id}-${source.url}`")
          h4 {{ source.name }}
          p {{ source.attribution }}
          p(v-if="source.edition") 底本／版本：{{ source.edition }}
          p(v-if="source.licenseCode") 授權：{{ source.licenseCode }}
          p(v-if="source.rightsNote") 權利說明：{{ source.rightsNote }}
          a.yi-casting__source-link(:href="source.url" target="_blank" rel="noopener noreferrer") 開啟固定來源
        p.yi-casting__modification 本站僅依所列來源擷取、切段、解析及結構化原文；未人工校字或改寫經文。

      .yi-casting__result-actions
        button.yi-casting__secondary-button(type="button" @click="resetCasting") 重新起卦
        button.yi-casting__secondary-button(type="button" :disabled="!casting" @click="savedReadingId ? openHistory() : openSaveDialog()") {{ savedReadingId ? '已保存紀錄' : '保存紀錄' }}
      p.yi-casting__save-message(v-if="saveMessage" aria-live="polite") {{ saveMessage }}

  .yi-casting__overlay(v-if="historyOpen" @click.self="historyOpen = false")
    section.yi-casting__dialog(role="dialog" aria-modal="true" aria-labelledby="history-title")
      .yi-casting__dialog-header
        h2#history-title 本機卜卦紀錄
        button.yi-casting__icon-button(type="button" aria-label="關閉歷史紀錄" @click="historyOpen = false") ×
      p 紀錄與經文快照只保存在這台裝置；匯出檔含問題與卦象內容，請自行妥善保管。
      .yi-casting__history-tools
        button.yi-casting__small-button(type="button" :disabled="!historyEntries.length || importingHistory" @click="exportHistory") 匯出 JSON
        button.yi-casting__small-button(type="button" :disabled="importingHistory" @click="historyImportInput?.click()") {{ importingHistory ? '匯入中⋯' : '匯入 JSON' }}
        button.yi-casting__delete-button(type="button" :disabled="!selectedHistoryIds.length || importingHistory" @click="removeSelectedHistory") 刪除所選（{{ selectedHistoryIds.length }}）
        input.yi-casting__file-input(ref="historyImportInput" type="file" accept="application/json,.json" aria-label="選擇卜卦紀錄備份檔" @change="importHistory")
      p.yi-casting__history-message(v-if="historyMessage" aria-live="polite") {{ historyMessage }}
      p(v-if="historyLoading") 正在讀取本機紀錄⋯
      p(v-else-if="!historyEntries.length") 目前沒有保存的紀錄。
      template(v-else)
        input.yi-casting__save-input(v-model="historySearch" type="search" placeholder="搜尋名稱、問題、卦名或詩籤" aria-label="搜尋本機卜卦紀錄")
        p.yi-casting__helper(v-if="!visibleHistoryEntries.length") 沒有符合條件的紀錄。
        .yi-casting__history-list(v-else)
          article.yi-casting__history-item(v-for="entry in visibleHistoryEntries" :key="entry.id")
            input.yi-casting__history-checkbox(type="checkbox" :checked="selectedHistoryIds.includes(entry.id)" :aria-label="`選取${entry.data?.name || '本次卦象'}紀錄`" @change="toggleHistorySelection(entry.id)")
            button.yi-casting__history-open(type="button" @click="restoreReading(entry)")
              strong {{ entry.data?.name || 'TAKO' }}
              span {{ entry.data?.question || '本次卦象' }}
              small {{ new Date(entry.data?.savedAt || entry.data?.casting?.createdAt).toLocaleString('zh-TW') }}
              small.yi-casting__history-source(v-if="entry.data?.reading") {{ entry.data.reading.corpusVersion || '經文快照' }}・{{ historySourceLabel(entry) }}・已存本機
              small.yi-casting__history-source(v-else) 僅保存卦象；重新開啟時需連線載入經文
            .yi-casting__history-entry-actions
              template(v-if="editingHistoryId === entry.id")
                input.yi-casting__save-input(v-model="historyNameDraft" maxlength="48" :aria-label="`修改${entry.data?.name || '紀錄'}名稱`" @keydown.esc="editingHistoryId = ''")
                button.yi-casting__small-button(type="button" @click="renameHistory(entry)") 儲存
                button.yi-casting__text-button(type="button" @click="editingHistoryId = ''") 取消
              template(v-else)
                button.yi-casting__small-button(type="button" @click="beginRenameHistory(entry)") 改名
                button.yi-casting__delete-button(type="button" :aria-label="`刪除${entry.data?.name || '本次卦象'}紀錄`" @click="removeHistory(entry)") 刪除

  .yi-casting__overlay(v-if="saveOpen" @click.self="saveOpen = false")
    section.yi-casting__dialog(role="dialog" aria-modal="true" aria-labelledby="save-title")
      .yi-casting__dialog-header
        h2#save-title 保存這次卦象？
        button.yi-casting__icon-button(type="button" aria-label="關閉保存對話框" @click="saveOpen = false") ×
      p 紀錄只會留在這台裝置，不會上傳。
      label.yi-casting__section-label(for="save-name") 紀錄名稱
      p.yi-casting__helper(v-if="saveNameLoading") 正在讀取最近使用的紀錄名稱⋯
      input#save-name.yi-casting__save-input(v-else v-model="saveName" maxlength="48" placeholder="請輸入名稱" autocomplete="off")
      p.yi-casting__error(v-if="saveMessage") {{ saveMessage }}
      .yi-casting__dialog-actions
        button.yi-casting__secondary-button(type="button" @click="saveOpen = false") 取消
        button.yi-casting__primary-button(type="button" :disabled="saveNameLoading || !saveName.trim()" @click="saveReading") 確認保存
</template>

<style lang="sass">
@use '../styles'
</style>
