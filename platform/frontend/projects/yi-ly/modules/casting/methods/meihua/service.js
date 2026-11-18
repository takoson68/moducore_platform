import { toMeihuaCalendarParts } from './calendarAdapter.js'

export const MEIHUA_RULE_VERSION = 'meihua-eee-wujuan-date-time-v1'

const TRIGRAMS = Object.freeze({
  1: Object.freeze({ name: '乾', patternBottomUp: '111', element: '金' }),
  2: Object.freeze({ name: '兌', patternBottomUp: '110', element: '金' }),
  3: Object.freeze({ name: '離', patternBottomUp: '101', element: '火' }),
  4: Object.freeze({ name: '震', patternBottomUp: '100', element: '木' }),
  5: Object.freeze({ name: '巽', patternBottomUp: '011', element: '木' }),
  6: Object.freeze({ name: '坎', patternBottomUp: '010', element: '水' }),
  7: Object.freeze({ name: '艮', patternBottomUp: '001', element: '土' }),
  8: Object.freeze({ name: '坤', patternBottomUp: '000', element: '土' }),
})

const GENERATING = Object.freeze({ 木: '火', 火: '土', 土: '金', 金: '水', 水: '木' })
const CONTROLLING = Object.freeze({ 木: '土', 土: '水', 水: '火', 火: '金', 金: '木' })

function remainderAsOneBased(value, divisor) {
  const remainder = value % divisor
  return remainder === 0 ? divisor : remainder
}

function flipPatternLine(pattern, linePosition) {
  const index = linePosition - 1
  return [...pattern].map((line, position) => (
    position === index ? (line === '1' ? '0' : '1') : line
  )).join('')
}

function mutualPatternFor(pattern) {
  const lines = [...pattern]
  const lower = lines.slice(1, 4).join('')
  const upper = lines.slice(2, 5).join('')
  return { lower, upper, patternBottomUp: lower + upper }
}

function resolveBodyUse({ upper, lower, movingLine }) {
  const movingInLower = movingLine <= 3
  const use = movingInLower ? lower : upper
  const body = movingInLower ? upper : lower
  let relation

  if (body.element === use.element) relation = '比和'
  else if (GENERATING[use.element] === body.element) relation = '用生體'
  else if (GENERATING[body.element] === use.element) relation = '體生用'
  else if (CONTROLLING[use.element] === body.element) relation = '用剋體'
  else relation = '體剋用'

  return { body, use, relation }
}

export function calculateMeihuaDateTimeResult({ calendarParts, question = '', category = '其他' }) {
  if (!calendarParts || typeof calendarParts !== 'object') {
    throw new TypeError('缺少農曆與時辰換算資料。')
  }

  const { yearBranchNumber, lunarMonth, lunarDay, timeBranchNumber } = calendarParts
  const values = [yearBranchNumber, lunarMonth, lunarDay, timeBranchNumber]
  if (values.some((value) => !Number.isInteger(value) || value < 1 || value > 30)) {
    throw new TypeError('梅花易數取數資料超出有效範圍。')
  }

  const upperTotal = yearBranchNumber + lunarMonth + lunarDay
  const total = upperTotal + timeBranchNumber
  const upperNumber = remainderAsOneBased(upperTotal, 8)
  const lowerNumber = remainderAsOneBased(total, 8)
  const movingLine = remainderAsOneBased(total, 6)
  const upper = TRIGRAMS[upperNumber]
  const lower = TRIGRAMS[lowerNumber]
  const basePatternBottomUp = lower.patternBottomUp + upper.patternBottomUp
  const changedPatternBottomUp = flipPatternLine(basePatternBottomUp, movingLine)
  const baseIsPureQianKun = basePatternBottomUp === '111111' || basePatternBottomUp === '000000'
  const mutualSource = baseIsPureQianKun ? changedPatternBottomUp : basePatternBottomUp
  const mutual = mutualPatternFor(mutualSource)
  const changedLines = [...changedPatternBottomUp]
  const bodyUse = resolveBodyUse({ upper, lower, movingLine })

  return {
    schemaVersion: 1,
    methodId: 'meihua-shu',
    methodRuleVersion: MEIHUA_RULE_VERSION,
    inputMode: 'date-time',
    question: String(question).trim(),
    category,
    calendar: { ...calendarParts },
    calculation: {
      upperTotal,
      total,
      upperRemainder: upperTotal % 8,
      lowerRemainder: total % 8,
      movingRemainder: total % 6,
      upperNumber,
      lowerNumber,
      movingLine,
    },
    trigrams: {
      upper: { number: upperNumber, ...upper },
      lower: { number: lowerNumber, ...lower },
    },
    bodyUse: {
      body: { ...bodyUse.body },
      use: { ...bodyUse.use },
      relation: bodyUse.relation,
    },
    basePatternBottomUp,
    movingPositions: [movingLine],
    changedPatternBottomUp,
    mutual: {
      ...mutual,
      source: baseIsPureQianKun ? 'changed' : 'base',
      isSourceException: baseIsPureQianKun,
    },
    changedPatternLinesBottomUp: changedLines,
    createdAt: new Date().toISOString(),
  }
}

export function buildMeihuaDateTimeResult({ dateTime, timeZone, question, category }) {
  const calendarParts = toMeihuaCalendarParts({ dateTime, timeZone })
  return calculateMeihuaDateTimeResult({ calendarParts, question, category })
}

export function hexagramPatternRows(pattern) {
  if (!pattern || !/^[01]{6}$/.test(pattern)) return []
  return [...pattern].reverse().map((line, index) => ({
    position: 6 - index,
    yang: line === '1',
  }))
}
