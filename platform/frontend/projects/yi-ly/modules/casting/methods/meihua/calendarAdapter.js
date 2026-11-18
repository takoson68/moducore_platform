import { Solar } from 'lunar-javascript'

const BRANCH_NUMBERS = Object.freeze({
  子: 1,
  丑: 2,
  寅: 3,
  卯: 4,
  辰: 5,
  巳: 6,
  午: 7,
  未: 8,
  申: 9,
  酉: 10,
  戌: 11,
  亥: 12,
})

function assertInteger(value, label, min, max) {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new TypeError(`${label}需介於 ${min} 至 ${max}。`)
  }
}

function assertCivilDateTime(dateTime) {
  if (!dateTime || typeof dateTime !== 'object') {
    throw new TypeError('請提供完整的公曆日期與時間。')
  }

  const { year, month, day, hour, minute } = dateTime
  assertInteger(year, '年份', 1, 9999)
  assertInteger(month, '月份', 1, 12)
  assertInteger(day, '日期', 1, 31)
  assertInteger(hour, '小時', 0, 23)
  assertInteger(minute, '分鐘', 0, 59)

  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0)
  const monthDays = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  if (day > monthDays[month - 1]) throw new TypeError('日期不是有效的公曆日期。')
}

function branchNumber(branch, label) {
  const value = BRANCH_NUMBERS[branch]
  if (!value) throw new TypeError(`農曆轉換器未回傳有效的${label}地支。`)
  return value
}

export function toMeihuaCalendarParts({ dateTime, timeZone }) {
  assertCivilDateTime(dateTime)
  if (typeof timeZone !== 'string' || !timeZone.trim()) {
    throw new TypeError('請提供 IANA 時區，例如 Asia/Taipei。')
  }

  try {
    new Intl.DateTimeFormat('zh-TW', { timeZone }).format(0)
  } catch {
    throw new TypeError('時區格式無效，請使用有效的 IANA 時區。')
  }

  let lunar
  try {
    const solar = Solar.fromYmdHms(
      dateTime.year,
      dateTime.month,
      dateTime.day,
      dateTime.hour,
      dateTime.minute,
      0,
    )
    lunar = solar.getLunar()
  } catch (error) {
    throw new RangeError(`公曆轉農曆失敗：${error?.message || '日期超出轉換器範圍。'}`)
  }

  const lunarMonthValue = lunar.getMonth()
  const yearBranch = lunar.getYearZhi()
  const timeBranch = lunar.getTimeZhi()

  return {
    solarDateTime: { ...dateTime },
    timeZone,
    lunarYear: lunar.getYear(),
    yearBranch,
    yearBranchNumber: branchNumber(yearBranch, '年份'),
    lunarMonth: Math.abs(lunarMonthValue),
    isLeapMonth: lunarMonthValue < 0,
    lunarDay: lunar.getDay(),
    timeBranch,
    timeBranchNumber: branchNumber(timeBranch, '時辰'),
    calendarConverter: 'lunar-javascript',
    calendarConverterVersion: '1.7.8',
    calendarConvention: 'yi-ly-meihua-local-civil-v1',
  }
}
