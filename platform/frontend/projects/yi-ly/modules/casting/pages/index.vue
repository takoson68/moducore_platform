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
const saveOpen = ref(false)
const saveName = ref('')
const saveNameLoading = ref(false)
const saveMessage = ref('')
const savedReadingId = ref('')

const manualComplete = computed(() => manualLines.value.every((line) => line.coins.every((coin) => coin !== null)))
const timedComplete = computed(() => timedLines.value.length === 6)
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
  const rawLines = casting.value.lines.map((line) => (
    casting.value.inputMode === 'manual-coins-v1'
      ? { position: line.position, coins: line.rawInput }
      : { position: line.position, elapsedMilliseconds: line.rawInput.elapsedMilliseconds }
  ))
  await finishCasting(casting.value.inputMode, rawLines)
}

function resetCasting() {
  clearCountdown()
  stage.value = 'input'
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
  return [
    '請只根據「我的問題」與「《焦氏易林》詩籤原文」說明詩意及它可能如何回應問題。不要引用或推測其他卦辭、爻辭、傳文、術數或未提供的背景；請將詩籤原文與你的推論分開，不要把推測說成必然。若詩意無法明確對應問題，請直接說明。',
    '【我的問題】',
    casting.value.question || '（尚未填寫）',
    '【《焦氏易林》詩籤原文】',
    poem.text,
    '【資料來源與版本】',
    `${source.name}（${source.edition || '版本依來源紀錄'}）`,
    `原始來源：${source.url}`,
    source.attribution || '',
    `權利說明：${source.rightsNote || '依來源頁聲明'}`,
    '本站修改聲明：僅依所列來源擷取、解析及結構化原文，未人工改寫詩辭。',
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
  historyLoading.value = true
  try {
    historyEntries.value = await world.iDB.list({ module: 'casting', category: 'history' })
  } catch {
    historyEntries.value = []
  } finally {
    historyLoading.value = false
  }
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
  if (!casting.value || !reading.value) return
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
        reading: reading.value,
        readingFramework: readingFramework.value,
        savedAt: new Date().toISOString(),
      },
    })
    savedReadingId.value = id
    saveOpen.value = false
  } catch {
    saveMessage.value = '目前無法保存到本機，卦象仍保留在這個畫面。'
  }
}

async function restoreReading(entry) {
  const data = entry?.data
  if (!data?.casting || !data?.reading) return
  casting.value = data.casting
  reading.value = data.reading
  question.value = data.question || ''
  category.value = data.category || '其他'
  readingFramework.value = data.readingFramework || 'overview'
  savedReadingId.value = entry.id
  readingError.value = ''
  historyOpen.value = false
  stage.value = 'result'
}

async function removeHistory(entry) {
  await world.iDB.remove({ module: 'casting', category: 'history', id: entry.id })
  historyEntries.value = historyEntries.value.filter((item) => item.id !== entry.id)
  if (savedReadingId.value === entry.id) savedReadingId.value = ''
}

onBeforeUnmount(() => {
  clearCountdown()
})
</script>

<template lang="pug">
.yi-casting
  .yi-casting__paper
    header.yi-casting__header
      .yi-casting__brand
        button.yi-casting__logo-button(type="button" aria-label="重新整理畫面" title="重新整理畫面" @click="refreshScreen")
          span(aria-hidden="true") 易
        .yi-casting__brand-copy
          p.yi-casting__eyebrow 易經・卜問與閱讀
          h1 易經解卦
      button.yi-casting__icon-button(type="button" aria-label="開啟卜卦歷史" @click="openHistory") ⟲

    main(v-if="stage === 'input'" class="yi-casting__main")
      section.yi-casting__question-card
        label.yi-casting__section-label(for="casting-question") 今日所問
        textarea#casting-question.yi-casting__question(v-model="question" rows="2" maxlength="240" placeholder="寫下你想詢問的事情，也可以留白。")
        .yi-casting__category-list(role="group" aria-label="問題分類")
          button(v-for="item in categories" :key="item" type="button" :class="['yi-casting__category', { 'is-active': category === item }]" :aria-pressed="category === item" @click="category = item") {{ item }}

      .yi-casting__mode-switch(role="tablist" aria-label="選擇起卦方式")
        button(type="button" role="tab" :aria-selected="mode === 'manual'" :class="{ 'is-active': mode === 'manual' }" @click="mode = 'manual'") 手動輸入
        button(type="button" role="tab" :aria-selected="mode === 'timed'" :class="{ 'is-active': mode === 'timed' }" @click="mode = 'timed'") 時機取數

      section(v-if="mode === 'manual'" class="yi-casting__entry-panel")
        .yi-casting__panel-heading
          div
            h2 實體三錢
            p 每一爻依序記下三枚錢的正反面，由初爻往上填。
          span.yi-casting__panel-mark 金錢法
        .yi-casting__line-entry-list
          .yi-casting__line-entry(v-for="line in manualLines" :key="line.position")
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
        button.yi-casting__primary-button(type="button" :disabled="!manualComplete" @click="beginManualCasting") 確認起卦

      section(v-else class="yi-casting__entry-panel yi-casting__timed-panel")
        .yi-casting__panel-heading
          div
            h2 六鍵計時
            p 倒數後依你點擊各爻按鈕的經過時間取數。
          span.yi-casting__panel-mark 時機取數
        p.yi-casting__helper 六個按鈕固定代表初爻至上爻。依序或隨意點選都可以；結果會等六爻完成後一起揭示。
        button.yi-casting__primary-button(type="button" @click="beginTimedCasting") 開始倒數

      p.yi-casting__privacy-note 歷史預設不保存；只有你選擇「保存紀錄」後才會寫入這台裝置。

    main(v-else-if="stage === 'countdown'" class="yi-casting__main yi-casting__interlude")
      p.yi-casting__eyebrow 六鍵計時・準備
      .yi-casting__countdown-circle(aria-live="polite") {{ countdown }}
      h2 靜心想著所問之事
      p 倒數結束後，六個爻位按鈕會開始記錄點擊時間。
      button.yi-casting__text-button(type="button" @click="resetCasting") 返回

    main(v-else-if="stage === 'timed'" class="yi-casting__main yi-casting__game")
      p.yi-casting__eyebrow 六鍵計時・點選爻位
      h2 依直覺點完六個爻位
      p.yi-casting__helper 完成前不顯示個別結果，避免前面的數值影響後續點選。
      .yi-casting__timed-grid
        button(v-for="position in timedOrder" :key="position" type="button" :class="['yi-casting__timed-key', { 'is-done': timedLines.some((line) => line.position === position) }]" :disabled="timedLines.some((line) => line.position === position)" :aria-label="`${lineNames[position - 1]}${timedLines.some((line) => line.position === position) ? '已完成' : '點選'}`" @click="tapTimedLine(position)")
          span.yi-casting__key-mark(v-if="timedLines.some((line) => line.position === position)") ✓
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
              span.yi-casting__yang-line(v-if="line.yinYang === 'yang'") ━━━━━
              span.yi-casting__broken-line(v-else)
              span.yi-casting__moving-mark(v-if="line.moving") 動
              span.yi-casting__line-value {{ line.value }}
        span.yi-casting__change-arrow(aria-hidden="true") →
        .yi-casting__gua-card.is-changed
          p.yi-casting__gua-label 之卦
          h3 {{ changedHexagramTitle() }}
          p.yi-casting__gua-number(v-if="reading?.changedHexagram") 第 {{ reading.changedHexagram.hexagram_number }} 卦
          .yi-casting__gua-lines(aria-label="之卦卦畫，由上爻至初爻")
            .yi-casting__gua-line(v-for="line in lineDisplay" :key="`changed-${line.position}`")
              span.yi-casting__line-position {{ lineNames[line.position - 1] }}
              span.yi-casting__yang-line(v-if="line.changedYinYang === 'yang'") ━━━━━
              span.yi-casting__broken-line(v-else)
              span.yi-casting__line-value {{ line.value }}

      p.yi-casting__data-note 本頁呈現來源原文與計算結果，不自動加入占斷。
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
        summary 資料來源、署名與授權
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
        button.yi-casting__secondary-button(type="button" :disabled="!reading" @click="savedReadingId ? openHistory() : openSaveDialog()") {{ savedReadingId ? '已保存紀錄' : '保存紀錄' }}
      p.yi-casting__save-message(v-if="saveMessage" aria-live="polite") {{ saveMessage }}

  .yi-casting__overlay(v-if="historyOpen" @click.self="historyOpen = false")
    section.yi-casting__dialog(role="dialog" aria-modal="true" aria-labelledby="history-title")
      .yi-casting__dialog-header
        h2#history-title 本機卜卦紀錄
        button.yi-casting__icon-button(type="button" aria-label="關閉歷史紀錄" @click="historyOpen = false") ×
      p(v-if="historyLoading") 正在讀取本機紀錄⋯
      p(v-else-if="!historyEntries.length") 目前沒有保存的紀錄。
      .yi-casting__history-list(v-else)
        article.yi-casting__history-item(v-for="entry in historyEntries" :key="entry.id")
          button.yi-casting__history-open(type="button" @click="restoreReading(entry)")
            strong {{ entry.data?.name || 'TAKO' }}
            span {{ entry.data?.question || '本次卦象' }}
            small {{ new Date(entry.data?.savedAt || entry.data?.casting?.createdAt).toLocaleString('zh-TW') }}
          button.yi-casting__delete-button(type="button" :aria-label="`刪除${entry.data?.name || 'TAKO'}紀錄`" @click="removeHistory(entry)") 刪除

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
.yi-casting
  min-height: 100vh
  padding: max(22px, env(safe-area-inset-top)) 14px calc(36px + env(safe-area-inset-bottom))
  color: #29251f
  background: radial-gradient(ellipse at 50% -10%, #fffdf7 0, #f5f0e4 48%, #e9dfcb 100%)
  font-family: 'Noto Serif TC', 'Songti TC', 'PMingLiU', serif

  *, *::before, *::after
    box-sizing: border-box

  button, input, textarea
    font: inherit

  :where(button)
    color: inherit

  &__paper
    width: min(100%, 560px)
    margin: 0 auto

  &__header, &__dialog-header
    display: flex
    align-items: center
    justify-content: space-between

  &__header
    margin: 0 0 18px
    gap: 12px

  &__brand
    display: flex
    min-width: 0
    align-items: center
    gap: 12px

  &__brand-copy
    min-width: 0

    .yi-casting__eyebrow
      margin-bottom: 2px

    h1
      margin: 0
      font-size: clamp(25px, 7vw, 38px)
      letter-spacing: .1em

  &__logo-button
    display: grid
    width: 46px
    height: 46px
    flex: 0 0 auto
    place-items: center
    border: 1px solid rgba(255, 249, 235, .75)
    border-radius: 15px
    background: linear-gradient(145deg, #a7543e, #783426)
    box-shadow: 0 4px 10px rgba(91, 49, 32, .2), inset 0 1px 0 rgba(255, 255, 255, .22)
    color: #fff !important
    font-size: 25px
    font-weight: 700
    cursor: pointer
    transition: transform .16s ease, box-shadow .16s ease

    &:active
      transform: scale(.95)
      box-shadow: 0 2px 5px rgba(91, 49, 32, .18)

    &:focus-visible
      outline: 3px solid #c98963
      outline-offset: 3px

  &__eyebrow
    margin: 0 0 4px
    color: #8d3c2d
    font-size: 12px
    letter-spacing: .14em

  &__icon-button
    display: grid
    width: 42px
    height: 42px
    place-items: center
    border: 1px solid #d5cbb9
    border-radius: 50%
    background: rgba(255, 253, 246, .7)
    font-size: 23px
    cursor: pointer

  &__main
    display: grid
    gap: 16px

  &__question-card, &__entry-panel, &__gua-card, &__result-card, &__dialog
    border: 1px solid rgba(103, 85, 62, .24)
    border-radius: 17px
    background: rgba(255, 254, 249, .83)
    box-shadow: 0 6px 18px rgba(66, 48, 26, .08)

  &__question-card
    padding: 19px 17px
    border-color: rgba(126, 70, 49, .28)
    border-left: 3px solid #9e4c3a
    background: rgba(255, 254, 250, .96)
    box-shadow: 0 9px 24px rgba(66, 48, 26, .1)

  &__section-label, &__gua-label
    display: block
    margin: 0 0 8px
    color: #806149
    font-size: 12px
    font-weight: 700
    letter-spacing: .1em

  &__question
    display: block
    width: 100%
    min-height: 54px
    resize: vertical
    border: 0
    border-bottom: 1px solid #d7cbb7
    background: transparent
    color: #29251f
    font-size: 16px
    line-height: 1.6
    outline: none

    &:focus
      border-color: #9c4937

  &__category-list
    display: flex
    gap: 7px
    margin-top: 13px
    overflow-x: auto
    padding-bottom: 2px

  &__category
    flex: 0 0 auto
    padding: 6px 11px
    border: 1px solid #d6cbb8
    border-radius: 999px
    background: transparent
    color: #625846
    font-size: 12px
    cursor: pointer

    &.is-active
      border-color: #9e4c3a
      background: #9e4c3a
      color: #fff

  &__mode-switch
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 4px
    padding: 4px
    border: 1px solid #d8cdbb
    border-radius: 999px
    background: rgba(235, 227, 210, .72)

    button
      min-height: 40px
      border: 0
      border-radius: 999px
      background: transparent
      color: #675b49
      font-size: 14px
      cursor: pointer

      &.is-active
        background: #fffdf7
        box-shadow: 0 2px 8px rgba(50, 39, 24, .1)
        color: #382e23

  &__entry-panel
    padding: 16px
    background: rgba(255, 254, 249, .92)
    box-shadow: 0 7px 20px rgba(66, 48, 26, .09), inset 0 3px 0 rgba(158, 76, 58, .22)

  &__panel-heading
    display: flex
    align-items: flex-start
    justify-content: space-between
    gap: 10px
    margin-bottom: 13px

    h2
      margin: 0 0 5px
      font-size: 18px

    p
      margin: 0
      color: #766c5d
      font-size: 12px
      line-height: 1.6

  &__panel-mark
    flex: 0 0 auto
    padding: 5px 8px
    border: 1px solid #d6b89e
    border-radius: 5px
    color: #984a37
    font-size: 11px

  &__line-entry-list
    display: grid
    gap: 6px

  &__line-entry
    display: grid
    grid-template-columns: 48px minmax(0, 1fr) 48px
    align-items: center
    gap: 6px
    min-height: 49px
    padding: 4px 3px
    border-bottom: 1px solid #eee8dc

  &__line-info
    display: grid
    gap: 3px

  &__line-name
    font-size: 13px

  &__line-result
    color: #9c4937
    font-size: 11px
    font-weight: 700

    &.is-empty
      color: #bbb09d

  &__coins
    display: flex
    justify-content: space-around
    gap: 4px

  &__coin-pair
    display: flex
    gap: 3px

  &__coin
    width: 31px
    height: 31px
    padding: 0
    border: 1px solid #c7bba7
    border-radius: 50%
    background: linear-gradient(145deg, #f7f1e3, #ddcfb4)
    color: #64563f
    font-size: 11px
    cursor: pointer

    &.is-selected
      border-color: #98503a
      background: #9a4b38
      color: #fff
      box-shadow: inset 0 0 0 2px rgba(255, 244, 217, .3)

  &__line-preview
    display: flex
    justify-content: flex-end
    color: #2c2924
    font-family: Georgia, serif
    font-size: 12px
    letter-spacing: -2px
    white-space: nowrap

  &__broken-line
    display: inline-block
    width: 42px
    height: 7px
    border-right: 15px solid #39352d
    border-left: 15px solid #39352d

  &__line-placeholder
    color: #c9c0b2

  &__helper, &__privacy-note
    margin: 11px 0
    color: #776d5e
    font-size: 12px
    line-height: 1.6

  &__privacy-note
    margin: 0 5px
    text-align: center

  &__primary-button, &__secondary-button
    min-height: 46px
    padding: 11px 18px
    border: 1px solid #8f4231
    border-radius: 10px
    background: #954735
    color: #fff
    font-size: 14px
    font-weight: 600
    cursor: pointer

    &:disabled
      border-color: #c8c0b3
      background: #d4d0c7
      color: #f7f4ed
      cursor: not-allowed

  &__secondary-button
    border-color: #cfc3af
    background: #fffdf7
    color: #514735

  &__timed-panel
    min-height: 200px
    display: flex
    flex-direction: column
    justify-content: center

  &__interlude, &__game
    min-height: min(72vh, 620px)
    align-content: center
    justify-items: center
    text-align: center

    h2
      margin: 2px 0 0
      font-size: 22px

    > p:not(.yi-casting__eyebrow)
      max-width: 330px
      color: #766c5d
      font-size: 13px
      line-height: 1.7

  &__countdown-circle
    display: grid
    width: 168px
    height: 168px
    place-items: center
    margin: 12px 0
    border: 1px solid #cbbda7
    border-radius: 50%
    background: radial-gradient(circle, #fffef9, #eee5d4)
    box-shadow: inset 0 0 0 8px rgba(192, 174, 143, .14), 0 8px 22px rgba(61, 44, 24, .09)
    color: #302a22
    font-family: Georgia, serif
    font-size: 84px

  &__text-button
    border: 0
    background: transparent
    color: #8a4636
    text-decoration: underline
    text-underline-offset: 4px
    cursor: pointer

  &__timed-grid
    display: grid
    width: min(100%, 380px)
    grid-template-columns: repeat(2, 1fr)
    gap: 10px
    margin: 13px 0

  &__timed-key
    display: flex
    min-height: 76px
    align-items: center
    justify-content: center
    gap: 11px
    border: 1px solid #cbbda8
    border-radius: 15px
    background: #fffdf7
    box-shadow: 0 4px 12px rgba(55, 42, 26, .08)
    cursor: pointer

    &:disabled
      background: #eee7da
      color: #7a715f
      cursor: default

    &.is-done
      border-color: #a3543b

  &__key-mark
    color: #9d4c38
    font-size: 23px

  &__game-progress
    margin: 0
    color: #897b65
    font-size: 12px

  &__result-heading
    text-align: center

    h2
      margin: 4px 0
      font-size: 23px

  &__result-meta, &__gua-number
    margin: 4px 0
    color: #81745f
    font-size: 12px

  &__gua-pair
    display: grid
    grid-template-columns: minmax(0, 1fr) 24px minmax(0, 1fr)
    align-items: center
    gap: 5px

  &__gua-card
    min-width: 0
    padding: 13px 9px
    text-align: center

    h3
      margin: 2px 0
      color: #2a251f
      font-size: 17px

    &.is-changed
      border-color: rgba(157, 75, 53, .36)

  &__gua-label
    margin-bottom: 4px

  &__gua-lines
    display: grid
    gap: 4px
    margin-top: 10px

  &__gua-line
    display: grid
    grid-template-columns: 30px 1fr 20px 18px
    align-items: center
    gap: 2px
    min-height: 20px
    font-family: Georgia, serif
    font-size: 11px
    letter-spacing: -2px

    &.is-moving
      color: #9a4935

  &__line-position
    color: #857962
    font-family: 'Noto Serif TC', 'Songti TC', serif
    font-size: 9px
    letter-spacing: 0

  &__yang-line
    color: #2c2924
    white-space: nowrap

  &__moving-mark
    color: #a44c38
    font-family: 'Noto Serif TC', 'Songti TC', serif
    font-size: 9px
    letter-spacing: 0

  &__line-value
    color: #8a7d68
    font-family: 'Noto Serif TC', 'Songti TC', serif
    font-size: 10px
    letter-spacing: 0

  &__change-arrow
    color: #a34e38
    text-align: center

  &__data-note
    margin: 0
    color: #766b5d
    font-size: 12px
    text-align: center

  &__result-grid
    display: grid
    gap: 11px

  &__result-card
    padding: 15px

    h3
      margin: 0 0 12px
      font-size: 17px

    h4
      margin: 15px 0 6px
      color: #8b4937
      font-size: 13px

    > p
      color: #63594b
      font-size: 13px
      line-height: 1.75

  &__yilin-feature
    border-color: #d6c3a4
    background: linear-gradient(145deg, #fffdf7, #f5eddd)

    h3
      margin: 3px 0 0 !important

    > .yi-casting__passage
      margin: 13px 0 8px
      font-size: 16px !important
      line-height: 2 !important

  &__yilin-heading
    display: flex
    align-items: flex-start
    flex-direction: column
    gap: 6px

  &__copy-poem
    width: 100%
    margin-top: 10px

  &__copy-fallback
    width: 100%
    min-height: 150px
    margin-top: 8px
    padding: 10px
    border: 1px solid #d6cbb9
    border-radius: 8px
    background: #fffdf7
    color: #514a3e
    font-size: 12px
    line-height: 1.6
    resize: vertical

  &__yilin-source
    display: flex
    justify-content: space-between
    align-items: center
    gap: 12px
    padding-top: 10px
    border-top: 1px solid #e7decd
    color: #877963
    font-size: 11px

    @media (max-width: 380px)
      align-items: flex-start
      flex-direction: column

  &__framework-switch
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 5px
    padding: 4px
    border: 1px solid #ded4c4
    border-radius: 10px
    background: #f1ecdf

    button
      min-height: 40px
      padding: 7px
      border: 0
      border-radius: 7px
      background: transparent
      color: #665b4c
      font-size: 12px
      cursor: pointer

      &.is-active
        background: #fffdf7
        color: #8f4532
        box-shadow: 0 1px 4px rgba(52, 39, 25, .12)

  &__framework-note
    padding: 9px 11px
    border-left: 2px solid #b67856
    background: #f7f0e4
    font-size: 11px !important

  &__reading-section
    & + &
      margin-top: 12px

  &__passage
    margin: 5px 0 10px
    color: #353027 !important
    font-size: 14px !important
    line-height: 1.85 !important
    white-space: pre-wrap

  &__passage-label, &__empty, &__loading
    margin: 5px 0
    color: #877963
    font-size: 11px

  &__passage-block
    padding: 9px 0
    border-top: 1px solid #eee8de

  &__check-option
    display: flex
    align-items: flex-start
    gap: 9px
    margin: 13px 0
    color: #514a3e
    font-size: 12px
    line-height: 1.6

    input
      margin: 3px 0 0
      accent-color: #984b39

  &__details
    margin: 10px 0
    border-top: 1px solid #e7dfd2
    border-bottom: 1px solid #e7dfd2

    summary
      padding: 11px 0
      color: #745d40
      font-size: 12px
      cursor: pointer

  &__source-link
    color: #934834
    font-size: 11px
    text-underline-offset: 3px

  &__inline-message, &__save-message
    color: #59764d
    font-size: 12px

  &__attribution
    padding: 13px 15px
    border: 1px solid #d6cbb9
    border-radius: 13px
    background: rgba(250, 247, 238, .72)

    summary
      color: #745d40
      font-size: 13px
      cursor: pointer

    p
      color: #63594b
      font-size: 11px
      line-height: 1.65
      overflow-wrap: anywhere

  &__version, &__modification
    margin: 9px 0

  &__source-entry
    padding-top: 8px
    border-top: 1px solid #e8dfd0

    h4
      margin: 8px 0
      font-size: 12px

  &__result-actions
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 9px

  &__overlay
    position: fixed
    z-index: 20
    inset: 0
    display: grid
    align-items: end
    justify-items: center
    padding: 14px
    background: rgba(35, 30, 22, .44)

  &__dialog
    width: min(100%, 520px)
    max-height: min(82vh, 740px)
    overflow: auto
    padding: 18px
    border-radius: 19px 19px 12px 12px

    h2
      margin: 0
      font-size: 19px

    > p
      color: #726856
      font-size: 13px
      line-height: 1.65

  &__history-list
    display: grid
    gap: 8px

  &__history-item
    display: grid
    grid-template-columns: 1fr auto
    align-items: center
    gap: 8px
    padding: 10px
    border: 1px solid #e6dccb
    border-radius: 11px

  &__history-open
    display: grid
    gap: 4px
    padding: 0
    border: 0
    background: transparent
    text-align: left
    cursor: pointer

    span, small
      color: #756b5d
      font-size: 12px

  &__delete-button
    border: 0
    background: transparent
    color: #934834
    font-size: 12px
    cursor: pointer

  &__save-input
    width: 100%
    min-height: 44px
    padding: 8px 10px
    border: 1px solid #d5c9b5
    border-radius: 9px
    background: #fffdf7

  &__error
    color: #9c3e31 !important

  &__dialog-actions
    display: grid
    grid-template-columns: 1fr 1fr
    gap: 8px
    margin-top: 15px

@media (min-width: 700px)
  .yi-casting
    padding: 38px 22px 50px

    &__header
      margin-bottom: 24px

    &__line-entry
      grid-template-columns: 76px minmax(0, 1fr) 70px

    &__coin
      width: 36px
      height: 36px

    &__result-grid
      grid-template-columns: 1.08fr .92fr
      align-items: start

    &__overlay
      align-items: center

    &__dialog
      border-radius: 18px
</style>
