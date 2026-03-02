//- projects/modudesk/utils/date.js

export function formatDateKey(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const toDateKey = formatDateKey

export function todayStr() {
  return formatDateKey(new Date())
}

export function normalizeDueDate(input) {
  if (input == null || typeof input !== 'string') return null

  const value = input.trim()
  if (!value || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return null
  }

  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return null

  return formatDateKey(date) === value ? value : null
}

export function addMonths(input, delta) {
  const base = input instanceof Date ? new Date(input.getTime()) : new Date(input)
  if (Number.isNaN(base.getTime())) {
    throw new Error('Invalid date')
  }

  const target = new Date(base.getFullYear(), base.getMonth() + Number(delta || 0), 1)
  const maxDay = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate()
  target.setDate(Math.min(base.getDate(), maxDay))
  return target
}

export function getMonthGrid(year, month) {
  const monthNumber = Number(month)
  const monthIndex = monthNumber - 1
  const first = new Date(year, monthIndex, 1)
  if (Number.isNaN(first.getTime())) {
    throw new Error('Invalid year/month')
  }

  const startOffset = (first.getDay() + 6) % 7
  const start = new Date(year, monthIndex, 1 - startOffset)
  const today = todayStr()
  const cells = []

  for (let i = 0; i < 42; i += 1) {
    const date = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i)
    const dateStr = formatDateKey(date)
    cells.push({
      key: dateStr,
      date,
      dateStr,
      day: date.getDate(),
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      inCurrentMonth: date.getMonth() === monthIndex,
      isToday: dateStr === today,
    })
  }

  return cells
}

export function toYearMonthKey(input) {
  const date = input instanceof Date ? input : new Date(input)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function parseYearMonthKey(yyyyMm) {
  if (typeof yyyyMm !== 'string' || !/^\d{4}-\d{2}$/.test(yyyyMm)) {
    return null
  }

  const [year, month] = yyyyMm.split('-').map(Number)
  if (month < 1 || month > 12) {
    return null
  }

  return { year, month }
}

export function monthLabelFromKey(yyyyMm, locale = 'zh-TW') {
  const parsed = parseYearMonthKey(yyyyMm)
  if (!parsed) return yyyyMm

  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'long',
  }).format(new Date(parsed.year, parsed.month - 1, 1))
}

export function toDayStart(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  date.setHours(0, 0, 0, 0)
  return date
}

export function toDayEnd(value) {
  const date = toDayStart(value)
  date.setHours(23, 59, 59, 999)
  return date
}

export function toMonthRange(input) {
  const date = input instanceof Date ? new Date(input.getTime()) : new Date(input)
  if (Number.isNaN(date.getTime())) {
    throw new Error('Invalid date')
  }

  const start = new Date(date.getFullYear(), date.getMonth(), 1)
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999)
  return { start, end }
}

export function normalizeDateTimeInput(input) {
  if (typeof input !== 'string') return null
  const value = input.trim()
  if (!value) return null

  const date = new Date(value)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString()
}

export function formatDateTimeInput(value) {
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

export function formatDateTimeLabel(value, locale = 'zh-TW') {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return ''
  }

  return new Intl.DateTimeFormat(locale, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date)
}
