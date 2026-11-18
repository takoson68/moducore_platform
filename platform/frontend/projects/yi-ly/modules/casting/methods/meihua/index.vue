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
const copyMessage = ref('')
const copyFallbackText = ref('')

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
  copyMessage.value = ''
  copyFallbackText.value = ''
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

function meihuaAiPrompt() {
  if (!result.value) return ''

  const current = result.value
  const calendar = current.calendar
  const solar = calendar.solarDateTime
  const selectedPassages = readingSections.value.flatMap((section) => section.passages.map((passage) => ({
    title: section.title,
    label: passage.linePosition ? `${lineNames[passage.linePosition - 1]}・` : '',
    text: passage.text,
    source: passage.source,
  })))
  const passageText = selectedPassages.length
    ? selectedPassages.map((passage) => `【${passage.title}・${passage.label}原文】\n${passage.text}`).join('\n\n')
    : '（目前未取得本卦、動爻或之卦的經文原文）'
  const sourceEntries = new Map()
  selectedPassages.forEach((passage) => {
    if (!passage.source) return
    const source = passage.source
    const key = `${source.id || ''}:${source.name || ''}:${source.edition || ''}`
    const entry = sourceEntries.get(key) || { source, urls: new Set() }
    if (source.url) entry.urls.add(source.url)
    sourceEntries.set(key, entry)
  })
  const sourceText = [...sourceEntries.values()].length
    ? [...sourceEntries.values()].map(({ source, urls }) => {
      const sourceName = source.name?.trim() || '來源未標示'
      const rawEdition = source.edition?.trim() || ''
      const edition = rawEdition.startsWith(sourceName)
        ? rawEdition.slice(sourceName.length).replace(/^[｜|；;：:\s]+/, '').trim()
        : rawEdition
      return `- ${[sourceName, edition, [...urls].join('；')].filter(Boolean).join('｜')}`
    }).join('\n')
    : '目前沒有可附上的經文來源資料。'

  return [
    `請把下面的問題、梅花易數取數結果和《周易》經文一起讀。先說你認為卦象最貼近問題的地方，再帶我看是哪一句經文、哪一個動爻，或哪組上下卦意象讓你這樣理解。

用白話講，但保留經文裡有意思的細節。遇到關鍵字詞，可以先說它在原文裡可能是什麼意思，再說放到這個問題裡像什麼。如果同一句有兩種讀法，而且會讓答案走向不同，就把差別講清楚。

本卦、互卦、變卦和動爻可以互相參照。遇到彼此呼應的地方，說出它們共同指向什麼；遇到彼此有張力的地方，也可以把那個矛盾講出來。篇幅跟著問題走，不必讓每個卦都佔一段，也不要把它們固定排成過去、現在、未來。

依提供的體卦、用卦和五行關係，說明它們在這個問題裡可能像什麼。體用生剋是傳統規則的標籤，可以作為解讀線索，吉凶與結果仍要回到經文和卦象判斷。取數用的是實驗中的年月日時方法，請沿用提供的結果。引用時，讓我看得出哪些是程式算出的資料、哪些是《周易》原文、哪些是你的推論。解讀範圍限於這次提供的資料與經文。

最後回到我的問題，說說你比較傾向哪種理解、它可能對應到什麼方向，以及哪裡還看不出來。若有兩種合理的可能，可以說明現實中出現什麼線索時，會比較貼近哪一種。`,
    `【我的問題】\n${current.question || '（尚未填寫）'}`,
    `【卜問分類】\n${current.category || '未分類'}`,
    `【起卦方法】\n梅花易數・年月日時法（規則版本：${current.methodRuleVersion}）`,
    `【起卦時間】\n公曆：${solar.year}-${String(solar.month).padStart(2, '0')}-${String(solar.day).padStart(2, '0')} ${String(solar.hour).padStart(2, '0')}:${String(solar.minute).padStart(2, '0')}（${calendar.timeZone}）\n農曆：${calendar.lunarYear}年（${calendar.yearBranch}年）・${calendar.isLeapMonth ? '閏' : ''}${calendar.lunarMonth}月${calendar.lunarDay}日・${calendar.timeBranch}時`,
    `【取數與卦象】\n上卦：年支數 ${calendar.yearBranchNumber}＋農曆月 ${calendar.lunarMonth}＋農曆日 ${calendar.lunarDay}＝${current.calculation.upperTotal}，除八取 ${current.trigrams.upper.name}。\n下卦與動爻：再加時辰數 ${calendar.timeBranchNumber}，合計 ${current.calculation.total}；除八取 ${current.trigrams.lower.name}，除六取第 ${current.calculation.movingLine} 爻。\n本卦：${baseHexagramTitle.value}（${current.basePatternBottomUp}）\n互卦爻形（由下往上）：${current.mutual.patternBottomUp}${current.mutual.isSourceException ? '；依目前規則由之卦取互卦' : ''}\n變卦：${changedHexagramTitle.value}（${current.changedPatternBottomUp}）`,
    `【體用資料】\n體卦：${current.bodyUse.body.name}・${current.bodyUse.body.element}\n用卦：${current.bodyUse.use.name}・${current.bodyUse.use.element}\n程式標示的五行關係：${current.bodyUse.relation}`,
    `【《周易》經文原文】\n${passageText}`,
    `【經文來源】\n${sourceText}`,
  ].join('\n\n')
}

async function copyMeihuaResult() {
  const prompt = meihuaAiPrompt()
  if (!prompt) return
  copyMessage.value = ''
  copyFallbackText.value = ''

  try {
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(prompt)
        copyMessage.value = '梅花易數結果已複製，現在可以貼到外部 AI 詢問。'
        return
      } catch {
        // 區網 HTTP 或瀏覽器權限限制時，改用點擊觸發的相容複製方式。
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
    copyMessage.value = '梅花易數結果已複製，現在可以貼到外部 AI 詢問。'
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

function refreshScreen() {
  window.location.reload()
}
</script>

<template lang="pug">
.yi-casting
  .yi-casting__paper
    header.yi-casting__header
      .yi-casting__brand
        .yi-casting__brand-mark
          button.yi-casting__logo-button(type="button" aria-label="重新整理畫面" title="重新整理畫面" @click="refreshScreen")
            span(aria-hidden="true") 易
          span.yi-casting__version-badge(aria-label="目前版本") {{ releaseVersionLabel }}
        .yi-casting__brand-copy
          p.yi-casting__eyebrow 易經 · 卜問與閱讀
          h1 易占

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
        button.yi-casting__primary-button(type="button" @click="copyMeihuaResult") 複製梅花易數結果，貼到外部 AI 詢問
        button.yi-casting__secondary-button(type="button" @click="resetMeihua") 重新起卦
      p.yi-casting__inline-message(v-if="copyMessage" aria-live="polite") {{ copyMessage }}
      textarea.yi-casting__copy-fallback(v-if="copyFallbackText" aria-label="手動複製梅花易數結果" readonly :value="copyFallbackText" @click="selectFallbackText")
</template>

<style lang="sass">
// 樣式由 index.vue 統一載入，避免重複輸出共用樣式。
</style>
