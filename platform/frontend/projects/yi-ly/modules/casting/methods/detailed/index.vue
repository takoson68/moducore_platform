<script setup>
import { computed, onBeforeUnmount, onDeactivated, ref } from 'vue'
import { fetchReadingForPatterns } from '../../api/corpus.js'
import { buildCastingResult } from '../coin/service.js'
import { buildMeihuaDateTimeResult } from '../meihua/service.js'
import { buildDetailedAiContext, civilDateTimeAt, CONSULTATION_STEPS, VARIABLE_TAGS } from './service.js'

defineProps({ activeMethod: { type: String, required: true } })
defineEmits(['select-method'])

const categories = ['事業', '感情', '財運', '健康', '其他']
const lineNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
const timedOrder = [6, 5, 4, 3, 2, 1]
const releaseVersionLabel = import.meta.env.VITE_RELEASE_VERSION ? `v${import.meta.env.VITE_RELEASE_VERSION}` : '本機版'

const question = ref('')
const category = ref('事業')
const selectedVariables = ref([])
const customVariables = ref([])
const otherVariable = ref('')
const mode = ref('timed')
const phase = ref('input')
const stepInputs = ref(Array(CONSULTATION_STEPS.length).fill(null))
const manualLines = ref(makeManualLines())
const timedLines = ref([])
const countdown = ref(3)
const countdownTimer = ref(null)
const timerStartedAt = ref(null)
const completedStepIndex = ref(-1)
const results = ref([])
const meihua = ref(null)
const meihuaReading = ref(null)
const resultError = ref('')
const copyMessage = ref('')
const copyFallbackText = ref('')

const currentStepIndex = computed(() => stepInputs.value.findIndex((step) => !step))
const currentStep = computed(() => CONSULTATION_STEPS[currentStepIndex.value] || null)
const completedCount = computed(() => stepInputs.value.filter(Boolean).length)
const manualComplete = computed(() => manualLines.value.every((line) => line.coins.every((coin) => coin !== null)))
const manualLineDisplay = computed(() => [...manualLines.value].reverse())
const tags = computed(() => VARIABLE_TAGS[category.value] || VARIABLE_TAGS.其他)
const allVariables = computed(() => [...selectedVariables.value, ...customVariables.value].slice(0, 5))
const canConfirm = computed(() => completedCount.value === CONSULTATION_STEPS.length && question.value.trim() && phase.value === 'review')

function makeManualLines() {
  return Array.from({ length: 6 }, (_, index) => ({ position: index + 1, coins: [null, null, null] }))
}

function refreshScreen() {
  window.location.reload()
}

function selectCategory(value) {
  category.value = value
  selectedVariables.value = []
  customVariables.value = []
  otherVariable.value = ''
}

function toggleVariable(value) {
  if (selectedVariables.value.includes(value)) {
    selectedVariables.value = selectedVariables.value.filter((item) => item !== value)
    return
  }
  if (customVariables.value.includes(value)) {
    customVariables.value = customVariables.value.filter((item) => item !== value)
    selectedVariables.value = [...selectedVariables.value, value]
    return
  }
  if (allVariables.value.length < 5) selectedVariables.value = [...selectedVariables.value, value]
}

function addCustomVariable() {
  const value = otherVariable.value.trim()
  if (!value || allVariables.value.length >= 5 || allVariables.value.includes(value)) return
  if (tags.value.includes(value)) {
    selectedVariables.value = [...selectedVariables.value, value]
    otherVariable.value = ''
    return
  }
  customVariables.value = [...customVariables.value, value]
  otherVariable.value = ''
}

function removeCustomVariable(value) {
  customVariables.value = customVariables.value.filter((item) => item !== value)
}

function resetStepInputs() {
  clearCountdown()
  completedStepIndex.value = -1
  stepInputs.value = Array(CONSULTATION_STEPS.length).fill(null)
  manualLines.value = makeManualLines()
  timedLines.value = []
  timerStartedAt.value = null
  phase.value = 'input'
  resultError.value = ''
}

function selectCoin(position, coinIndex, value) {
  const line = manualLines.value.find((item) => item.position === position)
  if (line) line.coins[coinIndex] = value
}

function clearCountdown() {
  if (countdownTimer.value !== null) {
    window.clearInterval(countdownTimer.value)
    countdownTimer.value = null
  }
}

function storeStep(inputMode, rawLines) {
  const index = currentStepIndex.value
  if (index < 0) return
  const next = [...stepInputs.value]
  next[index] = { inputMode, rawLines }
  stepInputs.value = next
  completedStepIndex.value = index
  phase.value = 'step-complete'
}

function continueAfterStep() {
  const completedInputMode = stepInputs.value[completedStepIndex.value]?.inputMode
  manualLines.value = makeManualLines()
  timedLines.value = []
  timerStartedAt.value = null
  if (stepInputs.value.every(Boolean)) {
    phase.value = 'review'
    return
  }
  if (completedInputMode === 'timed-six-key-v1') {
    beginTimedStep()
    return
  }
  phase.value = 'input'
}

function completeManualStep() {
  if (!manualComplete.value) return
  storeStep('manual-coins-v1', manualLines.value.map((line) => ({ position: line.position, coins: [...line.coins] })))
}

function beginTimedStep() {
  clearCountdown()
  timedLines.value = []
  countdown.value = 3
  timerStartedAt.value = null
  phase.value = 'countdown'
  countdownTimer.value = window.setInterval(() => {
    if (countdown.value > 1) {
      countdown.value -= 1
      return
    }
    clearCountdown()
    countdown.value = 0
    timerStartedAt.value = performance.now()
    phase.value = 'timed'
  }, 850)
}

function tapTimedLine(position) {
  if (phase.value !== 'timed' || timerStartedAt.value === null || timedLines.value.some((line) => line.position === position)) return
  timedLines.value.push({ position, elapsedMilliseconds: Math.max(0, Math.floor(performance.now() - timerStartedAt.value)) })
  if (timedLines.value.length === 6) storeStep('timed-six-key-v1', [...timedLines.value])
}

function timeZoneName() {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'
}

async function confirmConsultation() {
  if (!canConfirm.value) return
  phase.value = 'loading'
  resultError.value = ''
  const confirmedAt = new Date()
  const timeZone = timeZoneName()

  try {
    const builtSteps = CONSULTATION_STEPS.map((step, index) => {
      const input = stepInputs.value[index]
      return {
        ...step,
        casting: buildCastingResult({
          inputMode: input.inputMode,
          rawLines: input.rawLines,
          question: `${question.value.trim()}｜${step.title}`,
          category: category.value,
        }),
      }
    })
    const overallMeihua = buildMeihuaDateTimeResult({
      dateTime: civilDateTimeAt(confirmedAt, timeZone),
      timeZone,
      question: question.value.trim(),
      category: category.value,
    })
    const readings = await Promise.all([
      ...builtSteps.map((step) => fetchReadingForPatterns(step.casting.basePatternBottomUp, step.casting.changedPatternBottomUp)),
      fetchReadingForPatterns(overallMeihua.basePatternBottomUp, overallMeihua.changedPatternBottomUp),
    ])
    results.value = builtSteps.map((step, index) => ({ ...step, reading: readings[index] }))
    meihua.value = overallMeihua
    meihuaReading.value = readings.at(-1)
    phase.value = 'result'
  } catch (error) {
    resultError.value = error?.message || '詳細問事結果目前無法完成，請確認本機 Worker 是否啟動。'
    phase.value = 'review'
  }
}

function aiContext() {
  if (!meihua.value || !results.value.length) return ''
  return buildDetailedAiContext({
    question: question.value.trim(),
    category: category.value,
    variables: allVariables.value,
    steps: results.value,
    meihua: meihua.value,
    meihuaReading: meihuaReading.value,
  })
}

async function copyAiContext() {
  const prompt = aiContext()
  if (!prompt) return
  copyFallbackText.value = ''
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(prompt)
      copyMessage.value = '詳細問事內容已複製，可以貼到外部 AI 進行整體解讀。'
      return
    }
    throw new Error('clipboard unavailable')
  } catch {
    copyFallbackText.value = prompt
    copyMessage.value = '瀏覽器未允許自動複製，請長按下方文字並選取複製。'
  }
}

function resetConsultation() {
  clearCountdown()
  question.value = ''
  category.value = '事業'
  selectedVariables.value = []
  customVariables.value = []
  otherVariable.value = ''
  phase.value = 'input'
  completedStepIndex.value = -1
  stepInputs.value = Array(CONSULTATION_STEPS.length).fill(null)
  manualLines.value = makeManualLines()
  timedLines.value = []
  results.value = []
  meihua.value = null
  meihuaReading.value = null
  resultError.value = ''
  copyMessage.value = ''
  copyFallbackText.value = ''
}

function selectFallbackText(event) {
  event.target.focus()
  event.target.select()
  event.target.setSelectionRange(0, event.target.value.length)
}

onBeforeUnmount(clearCountdown)
onDeactivated(clearCountdown)
</script>

<template lang="pug">
.yi-casting
  .yi-casting__paper
    header.yi-casting__header
      .yi-casting__brand
        .yi-casting__brand-mark
          button.yi-casting__logo-button(type="button" aria-label="重新整理畫面" title="重新整理畫面" @click="refreshScreen")
            span(aria-hidden="true") 易
        .yi-casting__brand-copy
          p.yi-casting__eyebrow 易經 · 卜問與閱讀
          .yi-casting__title-row
            h1 易占
            span.yi-casting__version-badge(aria-label="目前版本") {{ releaseVersionLabel }}

    main.yi-casting__main(v-if="phase === 'input' || phase === 'review'")
      section.yi-casting__question-card
        label.yi-casting__section-label(for="detailed-question") 詳細問事
        textarea#detailed-question.yi-casting__question(v-model="question" maxlength="240" placeholder="寫下需要分別觀察緣起、當下與趨勢的事情。")
        .yi-casting__category-list(role="group" aria-label="問題分類")
          button(v-for="item in categories" :key="item" type="button" :class="['yi-casting__category', { 'is-active': category === item }]" :aria-pressed="category === item" @click="selectCategory(item)") {{ item }}

      section.yi-casting__result-card.yi-casting__variable-panel
        h2 補充相關變數（選填）
        p.yi-casting__helper 選擇你認為可能影響這件事的因素，最多 5 項；選取只表示相關，不代表實際狀態或方向。
        .yi-casting__variable-tags(role="group" aria-label="選擇相關變數")
          button(v-for="tag in tags" :key="tag" type="button" :class="{ 'is-active': selectedVariables.includes(tag) }" :aria-pressed="selectedVariables.includes(tag)" @click="toggleVariable(tag)") {{ tag }}
        label.yi-casting__section-label(for="other-variable") 其他
        .yi-casting__custom-variable-entry
          input#other-variable.yi-casting__save-input(v-model="otherVariable" maxlength="16" placeholder="例如：簽證" autocomplete="off" :disabled="allVariables.length >= 5" @keydown.enter.prevent="addCustomVariable")
          button.yi-casting__small-button(type="button" :disabled="!otherVariable.trim() || allVariables.length >= 5 || allVariables.includes(otherVariable.trim())" @click="addCustomVariable") 加入標籤
        .yi-casting__custom-variable-tags(v-if="customVariables.length" aria-label="自訂相關變數")
          button(v-for="tag in customVariables" :key="tag" type="button" :aria-label="`移除自訂變數${tag}`" @click="removeCustomVariable(tag)")
            span {{ tag }}
            span(aria-hidden="true") ×
        p.yi-casting__helper 已選 {{ allVariables.length }} 項：{{ allVariables.join('、') || '尚未選取' }}

      section.yi-casting__result-card.yi-casting__consultation-progress
        h2 三時問事
        p 依序完成三次起卦；最後確認前不會顯示任何卦象或詩籤。
        ol
          li(v-for="(step, index) in CONSULTATION_STEPS" :key="step.id" :class="{ 'is-done': stepInputs[index], 'is-current': index === currentStepIndex }")
            strong {{ step.title }}
            span {{ step.question }}
            small {{ stepInputs[index] ? '原始輸入已完成' : index === currentStepIndex ? '目前階段' : '尚未開始' }}

      template(v-if="phase === 'input' && currentStep")
        .yi-casting__mode-switch(role="tablist" aria-label="選擇起卦方式")
          button(type="button" role="tab" :aria-selected="mode === 'manual'" :class="{ 'is-active': mode === 'manual' }" @click="mode = 'manual'") 手動輸入
          button(type="button" role="tab" :aria-selected="mode === 'timed'" :class="{ 'is-active': mode === 'timed' }" @click="mode = 'timed'") 時機取數

        section.yi-casting__entry-panel(v-if="mode === 'manual'")
          .yi-casting__panel-heading
            div
              p.yi-casting__eyebrow 第 {{ currentStepIndex + 1 }} 階段
              h2 {{ currentStep.title }}・實體三錢
              p {{ currentStep.question }}
          .yi-casting__line-entry-list
            .yi-casting__line-entry(v-for="line in manualLineDisplay" :key="line.position")
              .yi-casting__line-info
                span.yi-casting__line-name {{ lineNames[line.position - 1] }}
                span.yi-casting__line-result(v-if="line.coins.every((coin) => coin !== null)") {{ line.coins.reduce((sum, coin) => sum + coin, 0) }}
                span.yi-casting__line-result.is-empty(v-else) —
              .yi-casting__coins(role="group" :aria-label="`${lineNames[line.position - 1]}三枚錢結果`")
                .yi-casting__coin-pair(v-for="(coin, coinIndex) in line.coins" :key="coinIndex")
                  button(type="button" :class="['yi-casting__coin', { 'is-selected': coin === 3 }]" @click="selectCoin(line.position, coinIndex, 3)") 正
                  button(type="button" :class="['yi-casting__coin', { 'is-selected': coin === 2 }]" @click="selectCoin(line.position, coinIndex, 2)") 反
          button.yi-casting__primary-button(type="button" :disabled="!manualComplete" @click="completeManualStep") 完成「{{ currentStep.title }}」原始輸入

        section.yi-casting__entry-panel.yi-casting__timed-panel(v-else)
          .yi-casting__timed-content
            p.yi-casting__eyebrow 第 {{ currentStepIndex + 1 }} 階段
            h2 {{ currentStep.title }}・六鍵計時
            p.yi-casting__helper {{ currentStep.question }}
          button.yi-casting__primary-button(type="button" @click="beginTimedStep") 開始「{{ currentStep.title }}」倒數

      section.yi-casting__result-card.yi-casting__confirmation-panel(v-else)
        h2 三個階段已完成
        p 按下確認的當下時間，會成為本次整體梅花易數的起卦時間。確認後才計算並一起揭示三首詩籤與整體梅花結果。
        p.yi-casting__error(v-if="resultError") {{ resultError }}
        button.yi-casting__primary-button(type="button" :disabled="!canConfirm" @click="confirmConsultation") 確認此次詳細問事
        button.yi-casting__secondary-button(type="button" @click="resetStepInputs") 重填三個階段
        p.yi-casting__helper(v-if="!question.trim()") 請先填寫主問題才能確認。

    main.yi-casting__main.yi-casting__interlude(v-else-if="phase === 'countdown'")
      p.yi-casting__eyebrow {{ currentStep?.title }}・準備
      .yi-casting__countdown-circle(aria-live="polite")
        span {{ countdown }}
      h2 靜心想著這個階段的子問題
      p {{ currentStep?.question }}

    main.yi-casting__main.yi-casting__game(v-else-if="phase === 'timed'")
      p.yi-casting__eyebrow {{ currentStep?.title }}・六鍵計時
      h2 依直覺點完六個爻位
      p.yi-casting__helper 完成前不顯示個別結果。
      .yi-casting__timed-grid
        button(v-for="position in timedOrder" :key="position" type="button" :class="['yi-casting__timed-key', { 'is-done': timedLines.some((line) => line.position === position) }]" :disabled="timedLines.some((line) => line.position === position)" @click="tapTimedLine(position)")
          span.yi-casting__key-mark {{ timedLines.some((line) => line.position === position) ? '已取' : '○' }}
          span {{ lineNames[position - 1] }}
      p.yi-casting__game-progress 已完成 {{ timedLines.length }}／6 爻

    main.yi-casting__main.yi-casting__game(v-else-if="phase === 'step-complete'")
      p.yi-casting__eyebrow {{ CONSULTATION_STEPS[completedStepIndex]?.title }}・原始輸入完成
      h2 六爻已全部取得
      p.yi-casting__helper 結果仍保持隱藏；確認進入下一階段後才會清空目前的操作畫面。
      .yi-casting__timed-grid(v-if="stepInputs[completedStepIndex]?.inputMode === 'timed-six-key-v1'")
        button.yi-casting__timed-key.is-done(v-for="position in timedOrder" :key="position" type="button" disabled)
          span.yi-casting__key-mark 已取
          span {{ lineNames[position - 1] }}
      .yi-casting__completed-lines(v-else)
        span(v-for="line in [...(stepInputs[completedStepIndex]?.rawLines || [])].reverse()" :key="line.position") {{ lineNames[line.position - 1] }}・三錢已記錄
      button.yi-casting__primary-button(type="button" @click="continueAfterStep") {{ completedStepIndex < CONSULTATION_STEPS.length - 1 ? `開始「${CONSULTATION_STEPS[completedStepIndex + 1].title}」` : '前往最後確認' }}

    main.yi-casting__main.yi-casting__interlude(v-else-if="phase === 'loading'")
      p.yi-casting__eyebrow 詳細問事・計算中
      h2 正在整理三時詩籤與整體梅花易數
      p 請稍候，確認時間與所有原始輸入已鎖定。

    main.yi-casting__main.yi-casting__result(v-else)
      .yi-casting__result-heading
        p.yi-casting__eyebrow 詳細問事結果
        h2 {{ question }}
        p.yi-casting__result-meta {{ category }}・三時問事・{{ allVariables.length ? `相關變數：${allVariables.join('、')}` : '未選取補充變數' }}

      section.yi-casting__result-card.yi-casting__overall-meihua
        p.yi-casting__eyebrow 最後確認時刻・整體變化
        h3 梅花易數總勢
        p {{ meihuaReading?.baseHexagram?.hexagram_name || meihua?.basePatternBottomUp }} → {{ meihuaReading?.changedHexagram?.hexagram_name || meihua?.changedPatternBottomUp }}
        p 體卦 {{ meihua?.bodyUse.body.name }}{{ meihua?.bodyUse.body.element }}・用卦 {{ meihua?.bodyUse.use.name }}{{ meihua?.bodyUse.use.element }}・{{ meihua?.bodyUse.relation }}
        p 動爻第 {{ meihua?.calculation.movingLine }} 爻・互卦卦畫 {{ meihua?.mutual.patternBottomUp }}
        p.yi-casting__helper 確認時間：{{ new Date(meihua?.createdAt).toLocaleString('zh-TW') }}・{{ meihua?.calendar.timeZone }}

      section.yi-casting__detailed-results
        article.yi-casting__result-card(v-for="(step, index) in results" :key="step.id")
          p.yi-casting__eyebrow 第 {{ index + 1 }} 階段
          h3 {{ step.title }}
          p.yi-casting__helper {{ step.prompt }}
          p.yi-casting__result-meta {{ step.reading?.baseHexagram?.hexagram_name }} → {{ step.reading?.changedHexagram?.hexagram_name }}
          p.yi-casting__passage {{ step.reading?.yilin?.text || '詩籤目前未載入' }}
          .yi-casting__yilin-source(v-if="step.reading?.yilin?.source")
            span {{ step.reading.yilin.source.name }}・{{ step.reading.yilin.source.edition }}
            a.yi-casting__source-link(:href="step.reading.yilin.source.url" target="_blank" rel="noopener noreferrer") 查看來源網頁

      section.yi-casting__result-card
        h3 整體解讀資料
        p 三首林辭、整體梅花易數及補充變數已整理完成。本站不自動生成占斷，可複製到外部 AI 進行受限制的整體解讀。
        button.yi-casting__primary-button(type="button" @click="copyAiContext") 複製詳細問事，請 AI 整合成篇
        p.yi-casting__inline-message(v-if="copyMessage" aria-live="polite") {{ copyMessage }}
        textarea.yi-casting__copy-fallback(v-if="copyFallbackText" readonly :value="copyFallbackText" @click="selectFallbackText")

      .yi-casting__result-actions
        button.yi-casting__secondary-button(type="button" @click="resetConsultation") 重新詳細問事
</template>

<style lang="sass">
// 樣式由 casting/styles.sass 統一管理。
</style>
