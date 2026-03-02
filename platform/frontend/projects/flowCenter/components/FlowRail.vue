<script setup>
const now = new Date()
const currentYear = now.getFullYear()
const currentMonth = now.getMonth()
const today = now.getDate()

const weekdayLabels = ['日', '一', '二', '三', '四', '五', '六']

const firstDay = new Date(currentYear, currentMonth, 1).getDay()
const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate()

const calendarCells = [
  ...Array.from({ length: firstDay }, (_, index) => ({
    key: `empty-${index}`,
    label: '',
    isEmpty: true
  })),
  ...Array.from({ length: daysInMonth }, (_, index) => {
    const date = index + 1
    return {
      key: `day-${date}`,
      label: String(date),
      isEmpty: false,
      isToday: date === today,
      isMarked: [today + 1, today + 3].includes(date)
    }
  })
]

const monthLabel = `${currentYear} 年 ${currentMonth + 1} 月`
</script>

<template lang="pug">
aside.rail
  .rail-card.flow-glass
    .rail-head
      h3 行事曆
      span {{ monthLabel }}
    .calendar
      span(v-for="day in weekdayLabels" :key="day").day-head {{ day }}
      span(
        v-for="cell in calendarCells"
        :key="cell.key"
        :class="{ 'is-today': cell.isToday, 'is-marked': cell.isMarked, 'is-empty': cell.isEmpty }"
      ).day-cell {{ cell.label }}
  .rail-card.flow-glass
    h3 今日節點
    ul.notes
      li 09:30 檢查儀表板與登入狀態區是否固定在視窗內
      li 13:30 驗證各模組頁面切換後的排版與捲動邏輯
      li 16:00 確認不需要修改平台核心即可維持目前前端 Demo
</template>

<style lang="sass">
.rail
  display: grid
  align-content: start
  gap: 18px

.rail-card
  border-radius: 22px
  padding: 18px
  display: grid
  gap: 14px

.rail-head
  display: flex
  align-items: center
  justify-content: space-between

.rail-head h3
  margin: 0
  font-size: 16px

.rail-head span
  color: rgba(90, 79, 116, 0.58)
  font-size: 12px

.calendar
  display: grid
  grid-template-columns: repeat(7, 1fr)
  gap: 8px

.day-head
  text-align: center
  font-size: 11px
  color: rgba(90, 79, 116, 0.52)

.day-cell
  height: 34px
  display: grid
  place-items: center
  border-radius: 12px
  background: rgba(255, 255, 255, 0.62)
  font-size: 13px

.day-cell.is-empty
  background: transparent
  box-shadow: none

.day-cell.is-today
  background: linear-gradient(135deg, #d8b4fe 0%, #f9a8d4 100%)
  color: #fff
  font-weight: 700

.day-cell.is-marked
  box-shadow: inset 0 0 0 1px rgba(255, 126, 167, 0.35)

.notes
  margin: 0
  padding-left: 18px
  display: grid
  gap: 10px
  color: rgba(49, 41, 63, 0.74)

@media (max-width: 1180px)
  .rail
    grid-template-columns: 1fr 1fr

@media (max-width: 960px)
  .rail
    grid-template-columns: 1fr
</style>
