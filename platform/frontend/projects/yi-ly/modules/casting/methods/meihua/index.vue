<script setup>
import { computed, ref } from 'vue'
import MethodPicker from '../../components/MethodPicker.vue'
import { fetchReadingForPatterns } from '../../api/corpus.js'
import { buildMeihuaDateTimeResult, hexagramPatternRows } from './service.js'

const props = defineProps({
  activeMethod: { type: String, required: true },
})
const emit = defineEmits(['select-method'])

const categories = ['事業', '感情', '財運', '健康', '其他']
const lineNames = ['初爻', '二爻', '三爻', '四爻', '五爻', '上爻']
const releaseVersionLabel = import.meta.env.VITE_RELEASE_VERSION
  ? `v${import.meta.env.VITE_RELEASE_VERSION}`
  : '本機版'
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Taipei'

const question = ref('')
const category = ref('事業')
const dateTimeInput = ref(currentLocalDateTime())
const result = ref(null)
const reading = ref(null)
const readingLoading = ref(false)
const errorMessage = ref('')

const baseHexagramTitle = computed(() => reading.value?.baseHexagram?.hexagram_name || '本卦')
const changedHexagramTitle = computed(() => reading.value?.changedHexagram?.hexagram_name || '之卦')
const lineDisplay = computed(() => hexagramPatternRows(result.value?.basePatternBottomUp))
const readingSections = computed(() => {
  if (!result.value || !reading.value) return []
  const passages = reading.value.corePassages || []
  const baseNumber = reading.value.baseHexagram?.hexagram_number
  const changedNumber = reading.value.changedHexagram?.hexagram_number
  const basePassages = passages.filter((passage) => passage.hexagramNumber === baseNumber)
  const changedPassages = passages.filter((passage) => passage.hexagramNumber === changedNumber)
  const baseJudgment = basePassages.filter((passage) => ['judgment', 'judgment_continuation'].includes(passage.kind))
  const movingLine = basePassages.filter((passage) => (
    passage.kind === 'line_statement' && passage.linePosition === result.value.movingPositions[0]
  ))
  const changedJudgment = result.value.basePatternBottomUp === result.value.changedPatternBottomUp
    ? []
    : changedPassages.filter((passage) => ['judgment', 'judgment_continuation'].includes(passage.kind))
  return [
    { title: '本卦卦辭', passages: baseJudgment },
    { title: '動爻爻辭', passages: movingLine },
    { title: '之卦卦辭', passages: changedJudgment },
  ].filter((section) => section.passages.length)
})
const commentaryPassages = computed(() => reading.value?.commentaryPassages || [])
const sources = computed(() => {
  const passages = [
    ...(reading.value?.corePassages || []),
    ...commentaryPassages.value,
  ]
  const seen = new Set()
  return passages.filter((passage) => {
    const source = passage.source
    if (!source) return false
    const key = `${source.id}:${source.url}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  }).map((passage) => passage.source)
})

function currentLocalDateTime() {
  const now = new Date()
  const pad = (value) => String(value).padStart(2, '0')
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`
}

function parseDateTime(value) {
  const match = /^(\d{4,})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value)
  if (!match) throw new TypeError('請選擇有效的起卦日期與時間。')
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    hour: Number(match[4]),
    minute: Number(match[5]),
  }
}

function patternRows(pattern) {
  return hexagramPatternRows(pattern)
}

function formatRemainder(total, divisor, remainder) {
  return `${total} ÷ ${divisor}，餘 ${remainder || divisor}`
}

function resetMeihua() {
  question.value = ''
  category.value = '事業'
  dateTimeInput.value = currentLocalDateTime()
  result.value = null
  reading.value = null
  errorMessage.value = ''
  readingLoading.value = false
}

async function castMeihua() {
  errorMessage.value = ''
  reading.value = null
  try {
    result.value = buildMeihuaDateTimeResult({
      dateTime: parseDateTime(dateTimeInput.value),
      timeZone,
      question: question.value,
      category: category.value,
    })
  } catch (error) {
    result.value = null
    errorMessage.value = error?.message || '日期換算失敗，請確認輸入。'
    return
  }

  readingLoading.value = true
  try {
    reading.value = await fetchReadingForPatterns(result.value.basePatternBottomUp, result.value.changedPatternBottomUp)
  } catch (error) {
    errorMessage.value = error?.message || '卦象已算出，但經文暫時無法載入。'
  } finally {
    readingLoading.value = false
  }
}

async function retryReading() {
  if (!result.value) return
  readingLoading.value = true
  errorMessage.value = ''
  try {
    reading.value = await fetchReadingForPatterns(result.value.basePatternBottomUp, result.value.changedPatternBottomUp)
  } catch (error) {
    errorMessage.value = error?.message || '經文暫時無法載入。'
  } finally {
    readingLoading.value = false
  }
}

function refreshScreen() {
  window.location.reload()
}
</script>

<template lang="pug">
.yi-casting
  .yi-casting__paper
    header.yi-casting__header
      .yi-casting__brand
        button.yi-casting__logo-button(type="button" aria-label="重新整理畫面" title="重新整理畫面" @click="refreshScreen")
          span(aria-hidden="true") 易
        .yi-casting__brand-copy
          p.yi-casting__eyebrow 易經 · 卜問與閱讀
          h1 易占
      .yi-casting__header-actions
        span.yi-casting__version-badge(aria-label="目前版本") {{ releaseVersionLabel }}

    MethodPicker(:active-method="props.activeMethod" @select-method="emit('select-method', $event)")

    section.yi-casting__method-guidance(v-if="!result")
      p 梅花易數依起卦當下時間取象，適合觀察事情趨勢與可行方向。
      p 提問例句：這個方案目前是否可行？有哪些條件？

    main.yi-casting__main(v-if="!result")
      section.yi-casting__question-card
        label.yi-casting__section-label(for="meihua-question") 今日所問
        textarea#meihua-question.yi-casting__question(v-model="question" rows="2" maxlength="240" placeholder="寫下你想詢問的事情，也可以留白。")
        .yi-casting__category-list(role="group" aria-label="問題分類")
          button(v-for="item in categories" :key="item" type="button" :class="['yi-casting__category', { 'is-active': category === item }]" :aria-pressed="category === item" @click="category = item") {{ item }}

      section.yi-casting__entry-panel.game-stage
        .yi-casting__panel-heading
          div
            h2 梅花易數・年月日時起卦
            p 依使用者選定時間轉換農曆年月日與時辰，再按取數規則排卦。
        label.yi-casting__section-label(for="meihua-time") 起卦時間
        p.yi-casting__helper 請選你實際提出問題、準備起卦的當下，不是事件預計發生的時間。預設帶入現在；若補記先前的起卦，請改成當時時間。
        p.yi-casting__helper 系統會用年支與農曆月、日計算上卦，再加入時辰計算下卦和動爻；時間不同，卦象也可能不同。
        input#meihua-time.yi-casting__datetime-input(v-model="dateTimeInput" type="datetime-local" step="60")
        p.yi-casting__helper 時區：{{ timeZone }}。子時取數 1，涵蓋 23:00–00:59；閏月沿用同序月數。
        details.yi-casting__details
          summary 查看此方法的計算規則
          p.yi-casting__helper 年支、農曆月、農曆日相加取上卦；再加時辰數取下卦及動爻。餘數為零時，卦數取坤 8，爻位取上爻 6。
          p.yi-casting__helper 本頁將梅花易數視為獨立起卦方法，不等同金錢卦，也不附加《焦氏易林》詩籤。
        p.yi-casting__error(v-if="errorMessage" role="alert") {{ errorMessage }}
      button.yi-casting__primary-button.yi-casting__stage-action(type="button" @click="castMeihua") 起卦
      p.yi-casting__privacy-note 起卦時間只用於本次計算；目前不會自動保存梅花易數紀錄。

    main.yi-casting__main(v-else)
      section.yi-casting__result-heading
        p.yi-casting__eyebrow 梅花易數・年月日時法
        h2 {{ result.question || '本次卦象' }}
        p.yi-casting__result-meta 農曆{{ result.calendar.lunarYear }}年（{{ result.calendar.yearBranch }}年）・{{ result.calendar.isLeapMonth ? '閏' : '' }}{{ result.calendar.lunarMonth }}月{{ result.calendar.lunarDay }}日・{{ result.calendar.timeBranch }}時・{{ result.calendar.timeZone }}

      section.yi-casting__gua-pair
        article.yi-casting__gua-card
          span.yi-casting__gua-label 本卦
          h3 {{ baseHexagramTitle }}
          p.yi-casting__gua-number {{ result.basePatternBottomUp }}
          .yi-casting__gua-lines
            .yi-casting__gua-line(v-for="line in patternRows(result.basePatternBottomUp)" :key="`base-${line.position}`" :class="{ 'is-moving': line.position === result.movingPositions[0] }")
              span.yi-casting__line-position {{ lineNames[line.position - 1] }}
              span.yi-casting__yang-line(v-if="line.yang")
              span.yi-casting__broken-line(v-else)
              span.yi-casting__moving-mark(v-if="line.position === result.movingPositions[0]" aria-label="動爻")
              span.yi-casting__line-value(v-else)
        span.yi-casting__change-arrow(aria-hidden="true") →
        article.yi-casting__gua-card
          span.yi-casting__gua-label {{ result.mutual.isSourceException ? '之卦／互卦依之卦取' : '之卦' }}
          h3 {{ changedHexagramTitle }}
          p.yi-casting__gua-number {{ result.changedPatternBottomUp }}
          .yi-casting__gua-lines
            .yi-casting__gua-line(v-for="line in patternRows(result.changedPatternBottomUp)" :key="`changed-${line.position}`")
              span.yi-casting__line-position {{ lineNames[line.position - 1] }}
              span.yi-casting__yang-line(v-if="line.yang")
              span.yi-casting__broken-line(v-else)
              span.yi-casting__line-value

      section.yi-casting__result-card
        h3 起卦計算
        .yi-casting__calculation-row
          span 上卦（年支＋月＋日）
          strong {{ formatRemainder(result.calculation.upperTotal, 8, result.calculation.upperRemainder) }} → {{ result.trigrams.upper.name }}
        .yi-casting__calculation-row
          span 下卦／動爻（年支＋月＋日＋時辰）
          strong {{ formatRemainder(result.calculation.total, 8, result.calculation.lowerRemainder) }} → {{ result.trigrams.lower.name }}；{{ formatRemainder(result.calculation.total, 6, result.calculation.movingRemainder) }} → {{ lineNames[result.calculation.movingLine - 1] }}
        .yi-casting__calculation-row
          span 互卦
          strong {{ result.mutual.upper }}上{{ result.mutual.lower }}下・{{ result.mutual.patternBottomUp }}
        .yi-casting__body-use
          div
            span.yi-casting__gua-label 體卦
            strong {{ result.bodyUse.body.name }}・{{ result.bodyUse.body.element }}
          div
            span.yi-casting__gua-label 用卦
            strong {{ result.bodyUse.use.name }}・{{ result.bodyUse.use.element }}
          p.yi-casting__helper 體用五行關係：{{ result.bodyUse.relation }}。此為傳統規則標籤，不是對問題的必然判斷。

      section.yi-casting__result-card
        h3 經文原文
        p.yi-casting__loading(v-if="readingLoading") 正在讀取版本化經文⋯
        .yi-casting__error(v-else-if="errorMessage")
          p {{ errorMessage }}
          button.yi-casting__small-button(type="button" @click="retryReading") 重試載入
        template(v-else-if="reading")
          template(v-if="readingSections.length")
            section.yi-casting__reading-section(v-for="section in readingSections" :key="section.title")
              h4 {{ section.title }}
              .yi-casting__passage-block(v-for="passage in section.passages" :key="passage.id")
                p.yi-casting__passage-label(v-if="passage.linePosition") {{ lineNames[passage.linePosition - 1] }}
                p.yi-casting__passage {{ passage.text }}
          p.yi-casting__empty(v-else) 本次卦象的經文段落尚未載入。
        p.yi-casting__empty(v-else) 經文尚未載入。
      section.yi-casting__result-card(v-if="commentaryPassages.length")
        h3 其他經傳資料
        details.yi-casting__details
          summary 查看傳文資料（{{ commentaryPassages.length }} 段）
          .yi-casting__passage-block(v-for="passage in commentaryPassages" :key="passage.id")
            p.yi-casting__passage-label {{ passage.work.name }}・{{ passage.source.pageTitle }}
            p.yi-casting__passage {{ passage.text }}
      details.yi-casting__attribution(v-if="reading")
        summary 來源、版本、署名與授權
        p.yi-casting__version 語料版本：{{ reading.corpusVersion || '版本資訊依來源紀錄' }}
        .yi-casting__source-entry(v-for="source in sources" :key="`${source.id}-${source.url}`")
          h4 {{ source.name }}
          p {{ source.attribution }}
          p(v-if="source.edition") 底本／版本：{{ source.edition }}
          p(v-if="source.licenseCode") 授權：{{ source.licenseCode }}
          p(v-if="source.rightsNote") 權利說明：{{ source.rightsNote }}
          a.yi-casting__source-link(:href="source.url" target="_blank" rel="noopener noreferrer") 開啟固定來源
        p.yi-casting__modification 本站僅依所列來源擷取、切段、解析及結構化原文；未人工校字或改寫經文。

      details.yi-casting__details.yi-casting__raw-input-details
        summary 查看取數與規則資訊
        .yi-casting__raw-line
          strong 方法版本
          span {{ result.methodRuleVersion }}
        .yi-casting__raw-line
          strong 日期算法
          span {{ result.calendar.calendarConvention }}・{{ result.calendar.calendarConverter }} {{ result.calendar.calendarConverterVersion }}
        .yi-casting__raw-line
          strong 原始時間
          span {{ result.calendar.solarDateTime.year }}-{{ String(result.calendar.solarDateTime.month).padStart(2, '0') }}-{{ String(result.calendar.solarDateTime.day).padStart(2, '0') }} {{ String(result.calendar.solarDateTime.hour).padStart(2, '0') }}:{{ String(result.calendar.solarDateTime.minute).padStart(2, '0') }}
        .yi-casting__raw-line
          strong 本次問題
          span {{ result.question || '（未填寫）' }}
      .yi-casting__result-actions
        button.yi-casting__secondary-button(type="button" @click="resetMeihua") 重新起卦
</template>

<style lang="sass">
// 樣式由 index.vue 統一載入，避免重複輸出共用樣式。
</style>
