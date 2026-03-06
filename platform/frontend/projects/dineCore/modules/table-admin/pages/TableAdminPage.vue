<script setup>
import { computed, reactive, ref, watchEffect } from 'vue'
import world from '@/world.js'

const tableAdminStore = world.store('dineCoreTableAdminStore')
const state = computed(() => tableAdminStore.state)

const copiedTableCode = ref('')
const qrImageUrlByTableCode = reactive({})
const isGeneratingQrByTableCode = reactive({})
const createForm = reactive({
  code: '',
  name: '',
  areaName: '',
  dineMode: 'dine_in'
})

watchEffect(() => {
  tableAdminStore.load()
})

watchEffect(() => {
  for (const table of state.value.tables || []) {
    const tableCode = String(table?.code || '').trim().toUpperCase()
    if (!tableCode) continue

    const initialUrl = normalizeQrUrl(table?.qrImageUrl || '')
    if (!initialUrl) continue

    qrImageUrlByTableCode[tableCode] = initialUrl
  }
})

async function createTable() {
  await tableAdminStore.createTable({
    code: createForm.code,
    name: createForm.name,
    areaName: createForm.areaName,
    dineMode: createForm.dineMode
  })

  createForm.code = ''
  createForm.name = ''
  createForm.areaName = ''
  createForm.dineMode = 'dine_in'
}

async function updateTable(table, patch) {
  await tableAdminStore.updateTable({
    code: table.code,
    ...patch
  })
}

async function deleteTable(table) {
  await tableAdminStore.deleteTable({
    code: table.code
  })
}

async function moveTable(table, direction) {
  await tableAdminStore.reorderTables({
    code: table.code,
    direction
  })
}

function getEntryPath(tableCode) {
  return `/t/${tableCode}`
}

function getEntryUrl(tableCode) {
  if (typeof window === 'undefined') return getEntryPath(tableCode)
  return `${window.location.origin}${getEntryPath(tableCode)}`
}

function normalizeQrUrl(urlLike, entryUrlLike = '') {
  const raw = String(urlLike || '').trim()
  if (!raw) return ''
  if (/^https?:\/\//i.test(raw)) return raw

  const entryUrl = String(entryUrlLike || '').trim()
  if (/^https?:\/\//i.test(entryUrl)) {
    try {
      return new URL(raw, entryUrl).toString()
    } catch (_error) {
      // fallback below
    }
  }

  if (typeof window !== 'undefined') {
    try {
      return new URL(raw, window.location.origin).toString()
    } catch (_error) {
      return raw
    }
  }

  return raw
}

function getQrImageSrc(tableCode) {
  return String(qrImageUrlByTableCode[tableCode] || '')
}

async function copyEntryUrl(tableCode) {
  const url = getEntryUrl(tableCode)

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(url)
  }

  copiedTableCode.value = tableCode
  window.setTimeout(() => {
    if (copiedTableCode.value === tableCode) {
      copiedTableCode.value = ''
    }
  }, 1800)
}

async function generateQrImage(table) {
  const tableCode = String(table.code || '').trim().toUpperCase()
  if (!tableCode) return

  isGeneratingQrByTableCode[tableCode] = true
  try {
    const payload = await tableAdminStore.generateTableQr({
      tableCode,
      entryBaseUrl: typeof window !== 'undefined' ? window.location.origin : ''
    })
    const publicUrl = normalizeQrUrl(
      payload?.publicUrl || payload?.publicPath || `/assets/QRC/${tableCode}.png`,
      payload?.entryUrl || ''
    )
    qrImageUrlByTableCode[tableCode] = publicUrl.includes('?')
      ? `${publicUrl}&v=${Date.now()}`
      : `${publicUrl}?v=${Date.now()}`
    window.alert(`已產生 ${tableCode} 的 QR 圖片`)
  } catch (error) {
    const message = String(error?.message || 'UNKNOWN_ERROR')

    if (message === 'REAL_API_REQUIRED') {
      window.alert('目前為 mock 模式，請切換 real API 後再產生 QR。')
      return
    }

    window.alert(`產生 QR 失敗：${message}`)
  } finally {
    isGeneratingQrByTableCode[tableCode] = false
  }
}

function downloadQrImage(table) {
  const tableCode = String(table.code || '').trim().toUpperCase()
  const imageUrl = getQrImageSrc(tableCode)

  if (!imageUrl) {
    window.alert('請先點擊「產生 QR」再下載。')
    return
  }

  const link = document.createElement('a')
  link.href = imageUrl
  link.download = `dinecore-table-${tableCode}.png`
  link.click()
}
</script>

<template lang="pug">
.table-admin-page
  section.table-admin-card
    .table-admin-card__head
      div
        p.eyebrow 桌位管理
        h2.table-admin-card__title 桌號與入桌連結管理
        p.table-admin-card__lead
          | 可設定桌位資料、複製入桌連結，並產生可公開存取的 QR 圖片檔。

    form.create-panel(@submit.prevent="createTable()")
      label.form-field
        span.form-field__label 桌號代碼
        input.form-field__input(v-model="createForm.code" type="text" placeholder="例如 A02")
      label.form-field
        span.form-field__label 桌位名稱
        input.form-field__input(v-model="createForm.name" type="text" placeholder="例如 A02 桌")
      label.form-field
        span.form-field__label 區域
        input.form-field__input(v-model="createForm.areaName" type="text" placeholder="例如 內用區")
      label.form-field
        span.form-field__label 用餐模式
        select.form-field__input(v-model="createForm.dineMode")
          option(value="dine_in") 內用
          option(value="takeout") 外帶
          option(value="pickup") 自取
      .create-panel__actions
        button.action-chip(type="submit") 新增桌位

  section.table-list
    article.table-row(v-for="(table, index) in state.tables" :key="table.code")
      .table-row__main
        .table-row__title-wrap
          strong.table-row__title {{ table.name }}
          span.table-row__code {{ table.code }}
          span.table-row__sort {{ `排序 ${table.sortOrder}` }}
        .table-row__meta
          span.meta-pill {{ table.areaName }}
          span.meta-pill {{ table.dineMode === 'dine_in' ? '內用' : table.dineMode === 'takeout' ? '外帶' : '自取' }}
          span.meta-pill(:class="{ 'is-paused': !table.orderingEnabled }") {{ table.orderingEnabled ? '開放點餐' : '暫停點餐' }}
          span.meta-pill.is-status {{ table.status === 'active' ? '啟用中' : table.status === 'cleaning' ? '清潔中' : '停用' }}

        .entry-card
          .entry-card__preview
            img.entry-card__qr(v-if="getQrImageSrc(table.code)" :src="getQrImageSrc(table.code)" :alt="`${table.code} QR`")
            .entry-card__qr-empty(v-else) 尚未產生 QR
            .entry-card__info
              strong.entry-card__title 入桌網址
              code.entry-card__path {{ getEntryPath(table.code) }}
              p.entry-card__url {{ getEntryUrl(table.code) }}
          .entry-card__actions
            button.action-chip(type="button" @click="generateQrImage(table)" :disabled="isGeneratingQrByTableCode[table.code]") {{ isGeneratingQrByTableCode[table.code] ? '產生中...' : '產生 QR' }}
            button.action-chip(type="button" @click="copyEntryUrl(table.code)") 複製連結
            button.action-chip.is-muted(type="button" @click="downloadQrImage(table)") 下載 QR
            span.entry-card__copied(v-if="copiedTableCode === table.code") 已複製

      .table-row__controls
        label.inline-field
          span.inline-field__label 桌位名稱
          input.inline-field__input(
            :value="table.name"
            type="text"
            @change="updateTable(table, { name: $event.target.value })"
          )
        label.inline-field
          span.inline-field__label 區域
          input.inline-field__input(
            :value="table.areaName"
            type="text"
            @change="updateTable(table, { areaName: $event.target.value })"
          )
        label.inline-field
          span.inline-field__label 狀態
          select.inline-field__input(
            :value="table.status"
            @change="updateTable(table, { status: $event.target.value })"
          )
            option(value="active") 啟用中
            option(value="cleaning") 清潔中
            option(value="inactive") 停用

        .table-row__actions
          .table-row__sort-actions
            button.action-chip.is-muted(
              type="button"
              @click="moveTable(table, 'up')"
              :disabled="index === 0"
            ) 上移
            button.action-chip.is-muted(
              type="button"
              @click="moveTable(table, 'down')"
              :disabled="index === state.tables.length - 1"
            ) 下移
          .table-row__status-actions
            button.action-chip(
              type="button"
              @click="updateTable(table, { orderingEnabled: !table.orderingEnabled })"
            ) {{ table.orderingEnabled ? '暫停點餐' : '恢復點餐' }}
            button.action-chip.is-danger(type="button" @click="deleteTable(table)") 刪除桌位
</template>

<style lang="sass">
.table-admin-page
  display: grid
  gap: 18px

.table-admin-card
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.88)
  border: 1px solid rgba(140, 90, 31, 0.12)
  display: grid
  gap: 16px

.table-admin-card__head
  display: grid
  gap: 8px

.eyebrow
  margin: 0
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.table-admin-card__title
  margin: 0
  color: #243a3e

.table-admin-card__lead
  margin: 0
  color: #6e8083
  line-height: 1.6

.create-panel
  display: grid
  grid-template-columns: repeat(4, minmax(0, 1fr))
  gap: 12px
  padding: 16px
  border-radius: 18px
  background: rgba(121, 214, 207, 0.08)
  border: 1px solid rgba(109, 180, 177, 0.18)

.form-field
  display: grid
  gap: 8px

.form-field__label
  color: #51686b
  font-size: 13px
  font-weight: 700

.form-field__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #fff

.create-panel__actions
  grid-column: 1 / -1
  display: flex
  justify-content: end

.table-list
  display: grid
  gap: 12px

.table-row
  display: grid
  grid-template-columns: minmax(0, 1fr) minmax(340px, 520px)
  gap: 14px
  padding: 16px
  border-radius: 18px
  background: #fff
  border: 1px solid rgba(109, 180, 177, 0.18)

.table-row__main
  display: grid
  gap: 12px

.table-row__title-wrap
  display: flex
  flex-wrap: wrap
  align-items: center
  gap: 10px

.table-row__title
  color: #21393d

.table-row__code,
.table-row__sort
  color: #6e8083
  font-size: 13px

.table-row__meta
  display: flex
  flex-wrap: wrap
  gap: 8px

.meta-pill
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70
  font-size: 12px
  font-weight: 700

.meta-pill.is-paused
  background: rgba(241, 164, 76, 0.16)
  color: #9c5d11

.meta-pill.is-status
  background: rgba(90, 111, 132, 0.14)
  color: #4c6378

.entry-card
  display: grid
  gap: 12px
  padding: 14px
  border-radius: 16px
  background: rgba(121, 214, 207, 0.08)
  border: 1px solid rgba(109, 180, 177, 0.18)

.entry-card__preview
  display: grid
  grid-template-columns: 124px minmax(0, 1fr)
  gap: 14px
  align-items: center

.entry-card__qr
  width: 124px
  height: 124px
  border-radius: 16px
  background: #fff
  border: 1px solid rgba(109, 180, 177, 0.18)
  object-fit: cover

.entry-card__qr-empty
  width: 124px
  height: 124px
  border-radius: 16px
  border: 1px dashed rgba(109, 180, 177, 0.35)
  color: #6e8083
  display: grid
  place-items: center
  font-size: 12px
  background: rgba(255, 255, 255, 0.82)

.entry-card__info
  display: grid
  gap: 6px

.entry-card__title
  color: #21393d

.entry-card__path
  width: fit-content
  padding: 4px 8px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70

.entry-card__url
  margin: 0
  color: #6e8083
  line-height: 1.5
  word-break: break-all

.entry-card__actions
  display: flex
  align-items: center
  gap: 10px
  flex-wrap: wrap

.entry-card__copied
  color: #2d6f6d
  font-size: 13px
  font-weight: 700

.table-row__controls
  display: grid
  gap: 10px

.inline-field
  display: grid
  gap: 6px

.inline-field__label
  color: #51686b
  font-size: 12px
  font-weight: 700

.inline-field__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #f8fcfb

.table-row__actions
  display: grid
  gap: 10px

.table-row__sort-actions,
.table-row__status-actions
  display: flex
  flex-wrap: wrap
  gap: 10px
  justify-content: end

.action-chip
  border: 0
  border-radius: 999px
  padding: 10px 14px
  background: #17383f
  color: #fff
  font-weight: 700
  cursor: pointer

.action-chip.is-muted
  background: rgba(121, 214, 207, 0.14)
  color: #2d6f6d

.action-chip.is-danger
  background: rgba(214, 87, 74, 0.14)
  color: #a63d31

.action-chip:disabled
  opacity: 0.45
  cursor: not-allowed

@media (max-width: 1080px)
  .create-panel
    grid-template-columns: repeat(2, minmax(0, 1fr))

  .table-row
    grid-template-columns: 1fr

  .table-row__sort-actions,
  .table-row__status-actions
    justify-content: start

@media (max-width: 640px)
  .create-panel
    grid-template-columns: 1fr

  .create-panel__actions
    justify-content: start

  .entry-card__preview
    grid-template-columns: 1fr
</style>

