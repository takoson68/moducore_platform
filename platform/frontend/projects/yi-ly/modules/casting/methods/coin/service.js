export const COIN_VALUES = Object.freeze([6, 7, 7, 7, 8, 8, 8, 9])

const VALID_LINE_VALUES = new Set([6, 7, 8, 9])
const YIN_YANG = Object.freeze({ yin: '0', yang: '1' })

export function lineValueFromCoins(coins) {
  if (!Array.isArray(coins) || coins.length !== 3 || coins.some((coin) => coin !== 2 && coin !== 3)) {
    throw new TypeError('每一爻需要三個 2 或 3 的銅錢結果。')
  }
  return coins.reduce((sum, coin) => sum + coin, 0)
}

export function lineValueFromElapsedMilliseconds(elapsedMilliseconds) {
  if (!Number.isFinite(elapsedMilliseconds) || elapsedMilliseconds < 0) {
    throw new TypeError('點擊經過時間必須是有效的非負毫秒數。')
  }
  const elapsed = Math.floor(elapsedMilliseconds)
  const remainder = elapsed % COIN_VALUES.length
  return {
    elapsedMilliseconds: elapsed,
    remainder,
    value: COIN_VALUES[remainder],
  }
}

export function selectKaoBianPassages({ movingPositions, baseHexagramName, basePassages, changedPassages }) {
  const moving = [...new Set(movingPositions || [])].sort((a, b) => a - b)
  const unchanged = Array.from({ length: 6 }, (_, index) => index + 1).filter((position) => !moving.includes(position))
  const judgments = (passages) => passages.filter((passage) => ['judgment', 'judgment_continuation'].includes(passage.kind))
  const linesAt = (passages, positions) => passages
    .filter((passage) => passage.kind === 'line_statement' && positions.includes(passage.linePosition))
    .sort((a, b) => a.linePosition - b.linePosition)

  if (moving.length === 0) return [{ title: '本卦卦辭', passages: judgments(basePassages) }]
  if (moving.length === 1) return [{ title: '本卦動爻爻辭', passages: linesAt(basePassages, moving) }]
  if (moving.length === 2) {
    const upperPosition = Math.max(...moving)
    return [{
      title: '本卦兩個動爻爻辭（以上爻為主）',
      passages: linesAt(basePassages, moving).map((passage) => ({ ...passage, priority: passage.linePosition === upperPosition })),
    }]
  }
  if (moving.length === 3) return [
    { title: '本卦卦辭', passages: judgments(basePassages) },
    { title: '之卦卦辭', passages: judgments(changedPassages) },
  ]
  if (moving.length === 4) {
    const lowerPosition = Math.min(...unchanged)
    return [{
      title: '之卦兩個不變爻爻辭（以下爻為主）',
      passages: linesAt(changedPassages, unchanged).map((passage) => ({ ...passage, priority: passage.linePosition === lowerPosition })),
    }]
  }
  if (moving.length === 5) return [{ title: '之卦唯一不變爻爻辭', passages: linesAt(changedPassages, unchanged) }]
  if (baseHexagramName === '乾') return [{ title: '乾卦用九', passages: basePassages.filter((passage) => passage.kind === 'use_nine') }]
  if (baseHexagramName === '坤') return [{ title: '坤卦用六', passages: basePassages.filter((passage) => passage.kind === 'use_six') }]
  return [{ title: '之卦卦辭', passages: judgments(changedPassages) }]
}

export function buildCastingResult({ inputMode, rawLines, question = '', category = '其他' }) {
  if (!['manual-coins-v1', 'timed-six-key-v1'].includes(inputMode)) {
    throw new TypeError('不支援的起卦輸入方式。')
  }
  if (!Array.isArray(rawLines) || rawLines.length !== 6) {
    throw new TypeError('需要完整的六爻輸入。')
  }

  const byPosition = new Map(rawLines.map((line) => [line.position, line]))
  if (byPosition.size !== 6 || Array.from({ length: 6 }, (_, index) => index + 1).some((position) => !byPosition.has(position))) {
    throw new TypeError('六爻位置必須由初爻至上爻各有一筆。')
  }

  const lines = Array.from({ length: 6 }, (_, index) => {
    const position = index + 1
    const raw = byPosition.get(position)
    let value = raw.value
    let input

    if (inputMode === 'manual-coins-v1') {
      input = Array.isArray(raw.coins) ? [...raw.coins] : null
      value = lineValueFromCoins(input)
    } else {
      const timing = lineValueFromElapsedMilliseconds(raw.elapsedMilliseconds)
      value = timing.value
      input = timing
    }

    if (!VALID_LINE_VALUES.has(value)) throw new TypeError(`第 ${position} 爻數值無效。`)
    const yinYang = value === 6 || value === 8 ? 'yin' : 'yang'
    const moving = value === 6 || value === 9
    const changedYinYang = moving ? (yinYang === 'yin' ? 'yang' : 'yin') : yinYang

    return {
      position,
      value,
      yinYang,
      moving,
      changedYinYang,
      rawInput: input,
    }
  })

  const basePatternBottomUp = lines.map((line) => YIN_YANG[line.yinYang]).join('')
  const changedPatternBottomUp = lines.map((line) => YIN_YANG[line.changedYinYang]).join('')

  return {
    schemaVersion: 1,
    inputMode,
    ruleVersion: inputMode,
    question: String(question).trim(),
    category,
    lines,
    movingPositions: lines.filter((line) => line.moving).map((line) => line.position),
    basePatternBottomUp,
    changedPatternBottomUp,
    createdAt: new Date().toISOString(),
  }
}
