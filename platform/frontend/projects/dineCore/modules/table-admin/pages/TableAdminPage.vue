<script setup>
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'

const tableAdminStore = world.store('dineCoreTableAdminStore')
const state = computed(() => tableAdminStore.state)
const staffAuth = useDineCoreStaffAuth()
const hasLoadedOnce = ref(false)
const isImporting = ref(false)
const isReimporting = ref(false)
const copiedTableCode = ref('')
const qrImageUrlByTableCode = reactive({})
const isGeneratingQrByTableCode = reactive({})

const selectedMapId = computed({
  get: () => String(state.value.selectedMapId || ''),
  set: async value => {
    await selectMap(value)
  }
})

const selectedMapSummary = computed(() =>
  (state.value.maps || []).find(map => map.id === state.value.selectedMapId) || null
)

function resolveTableAdminErrorMessage(error) {
  const code = String(error?.message || 'UNKNOWN_ERROR').trim()

  switch (code) {
    case 'MAP_ID_REQUIRED':
      return '請先選擇正式地圖'
    case 'MAP_FILE_NOT_FOUND':
      return '找不到對應的正式地圖檔案'
    case 'TABLE_CODE_REQUIRED':
      return '桌位代碼不存在'
    default:
      return `發生錯誤：${code}`
  }
}

async function boot() {
  try {
    const firstMapId = await tableAdminStore.loadMaps()
    if (firstMapId) {
      await tableAdminStore.selectMap({ mapId: firstMapId })
    }
    hasLoadedOnce.value = true
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  }
}

onMounted(async () => {
  if (!staffAuth.isAuthenticated.value) return
  await boot()
})

watch(
  () => staffAuth.isAuthenticated.value,
  async isAuthenticated => {
    if (!isAuthenticated || hasLoadedOnce.value) return
    await boot()
  }
)

watchEffect(() => {
  for (const table of state.value.tables || []) {
    const tableCode = String(table?.code || '').trim().toUpperCase()
    if (!tableCode) continue

    const initialUrl = normalizeQrUrl(table?.qrImageUrl || '')
    if (!initialUrl) continue

    qrImageUrlByTableCode[tableCode] = initialUrl
  }
})

async function selectMap(mapId) {
  const nextMapId = String(mapId || '').trim()
  try {
    await tableAdminStore.selectMap({ mapId: nextMapId })
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  }
}

async function importSelectedMap() {
  if (!state.value.selectedMapId) {
    window.alert('請先選擇正式地圖')
    return
  }

  isImporting.value = true
  try {
    const result = await tableAdminStore.importFromMap({ mapId: state.value.selectedMapId })
    window.alert(`匯入完成，新增 ${result.insertedCount || 0} 筆，更新 ${result.updatedCount || 0} 筆`)
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  } finally {
    isImporting.value = false
  }
}

async function reimportSelectedMap() {
  if (!state.value.selectedMapId) {
    window.alert('請先選擇正式地圖')
    return
  }

  isReimporting.value = true
  try {
    const result = await tableAdminStore.reimportFromMap({ mapId: state.value.selectedMapId })
    window.alert(`重新匯入完成，新增 ${result.insertedCount || 0} 筆，更新 ${result.updatedCount || 0} 筆`)
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  } finally {
    isReimporting.value = false
  }
}

async function updateTable(table, patch) {
  try {
    await tableAdminStore.updateTable({
      code: table.code,
      ...patch
    })
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  }
}

function getEntryPath(tableCode) {
  return resolveAppRelativePath(`t/${tableCode}`)
}

function getEntryUrl(tableCode) {
  if (typeof window === 'undefined') return getEntryPath(tableCode)
  return `${window.location.origin}${getEntryPath(tableCode)}`
}

function resolveAppRelativePath(pathLike) {
  const raw = String(pathLike || '').trim()
  if (!raw) return ''

  const baseUrl = String(import.meta.env.BASE_URL || '/')
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  const normalizedPath = raw.replace(/^\.?\/*/, '')

  return `${normalizedBase}${normalizedPath}`
}

function getAppBaseUrl() {
  if (typeof window === 'undefined') return String(import.meta.env.BASE_URL || '/')
  return new URL(String(import.meta.env.BASE_URL || '/'), window.location.origin).toString().replace(/\/$/, '')
}

function normalizeQrUrl(urlLike) {
  const raw = String(urlLike || '').trim()
  if (!raw) return ''
  if (/^data:/i.test(raw) || /^https?:\/\//i.test(raw)) return raw
  return resolveAppRelativePath(raw)
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
  const tableCode = String(table?.code || '').trim().toUpperCase()
  if (!tableCode) return

  isGeneratingQrByTableCode[tableCode] = true
  try {
    const payload = await tableAdminStore.generateTableQr({
      tableCode,
      entryBaseUrl: getAppBaseUrl()
    })

    const publicUrl = normalizeQrUrl(
      payload?.publicUrl || payload?.publicPath || `assets/QRC/${tableCode}.png`
    )

    qrImageUrlByTableCode[tableCode] = publicUrl.includes('?')
      ? `${publicUrl}&v=${Date.now()}`
      : `${publicUrl}?v=${Date.now()}`

    window.alert(`已產生 ${tableCode} 的 QR 圖片`)
  } catch (error) {
    window.alert(resolveTableAdminErrorMessage(error))
  } finally {
    isGeneratingQrByTableCode[tableCode] = false
  }
}

function downloadQrImage(table) {
  const tableCode = String(table.code || '').trim().toUpperCase()
  const imageUrl = getQrImageSrc(tableCode)

  if (!imageUrl) {
    window.alert('請先產生 QR 圖片再下載')
    return
  }

  const link = document.createElement('a')
  link.href = imageUrl
  link.download = `dinecore-table-${tableCode}.png`
  link.click()
}

function viewCurrentOrders(table) {
  const tableCode = String(table?.code || '').trim().toUpperCase()
  if (!tableCode || typeof window === 'undefined') return
  const path = resolveAppRelativePath(`staff/counter/orders?table_code=${encodeURIComponent(tableCode)}`)
  window.location.assign(`${window.location.origin}${path}`)
}

function mapStatusClass(table) {
  return {
    'is-paused': table.operationalStatus === 'paused',
    'is-limit': table.operationalStatus === 'max_active_orders_reached'
  }
}

function getOperationalStatusLabel(table) {
  switch (String(table?.operationalStatus || '')) {
    case 'paused':
      return '桌位暫停點餐'
    case 'max_active_orders_reached':
      return '已到目前線上最大訂單數'
    default:
      return '正常營運'
  }
}
</script>

<template lang="pug">
.table-admin-page
  section.table-admin-card
    .table-admin-card__head
      div
        p.eyebrow 桌位管理
        h2.table-admin-card__title 正式地圖桌位管理
        p.table-admin-card__lead 選擇正式地圖後，可匯入桌位、重新匯入、產生 QR、複製入口網址，並管理備註、最大訂單數與暫停點餐。
    .map-toolbar
      label.form-field
        span.form-field__label 正式地圖
        select.form-field__input(v-model="selectedMapId")
          option(value="") 請選擇正式地圖
          option(v-for="map in state.maps" :key="map.id" :value="map.id") {{ map.name || map.id }}
      .map-toolbar__meta(v-if="selectedMapSummary")
        span.meta-pill {{ `地圖 ${selectedMapSummary.name || selectedMapSummary.id}` }}
        span.meta-pill(v-if="state.selectedMap") {{ `正式桌位 ${state.selectedMap.tables?.length || 0} 筆` }}
        span.meta-pill(v-if="state.tables?.length") {{ `已匯入 ${state.tables.length} 筆` }}
      .map-toolbar__actions
        button.action-chip(type="button" @click="importSelectedMap" :disabled="!state.selectedMapId || isImporting") {{ isImporting ? '匯入中...' : '首次匯入' }}
        button.action-chip.is-muted(type="button" @click="reimportSelectedMap" :disabled="!state.selectedMapId || isReimporting") {{ isReimporting ? '重新匯入中...' : '重新匯入' }}

  section.empty-state(v-if="!state.selectedMapId")
    h3.empty-state__title 尚未選擇正式地圖
    p.empty-state__text 請先從上方選擇一張正式地圖，才能查看與管理該地圖的桌位資料。
  section.empty-state(v-else-if="!state.tables.length")
    h3.empty-state__title 這張地圖尚未匯入桌位
    p.empty-state__text 請先執行首次匯入，將正式地圖中的桌位同步到桌位管理。
  section.table-list(v-else)
    article.table-row(v-for="table in state.tables" :key="table.code")
      .table-row__head
        .table-row__title-wrap
          strong.table-row__title {{ table.code }}
          span.table-row__code {{ table.code }}
          span.table-row__sort {{ `排序 ${table.sortOrder}` }}
        .table-row__meta
          span.meta-pill(:class="mapStatusClass(table)") {{ getOperationalStatusLabel(table) }}
          span.meta-pill {{ `目前未結單 ${table.currentOpenOrderCount}` }}
          span.meta-pill(v-if="table.activeOrderNo") {{ `目前單號 ${table.activeOrderNo}` }}
      .table-row__body
        .entry-card
          .entry-card__preview
            img.entry-card__qr(v-if="getQrImageSrc(table.code)" :src="getQrImageSrc(table.code)" :alt="`${table.code} QR`")
            .entry-card__qr-empty(v-else) 尚未產生 QR
            .entry-card__info
              strong.entry-card__title 入桌網址
              code.entry-card__path {{ getEntryPath(table.code) }}
              p.entry-card__url {{ getEntryUrl(table.code) }}
          .entry-card__actions
            button.action-chip(type="button" @click="generateQrImage(table)" :disabled="isGeneratingQrByTableCode[table.code]") {{ isGeneratingQrByTableCode[table.code] ? '產生中...' : '產生 / 重新產生 QR' }}
            button.action-chip(type="button" @click="copyEntryUrl(table.code)") 複製入口網址
            button.action-chip.is-muted(type="button" @click="downloadQrImage(table)") 下載 QR
            span.entry-card__copied(v-if="copiedTableCode === table.code") 已複製
        .table-row__controls
          label.inline-field
            span.inline-field__label 桌位名稱
            .inline-field__readonly {{ table.code }}
          label.inline-field
            span.inline-field__label 備註
            input.inline-field__input(
              :value="table.note"
              type="text"
              placeholder="可填寫清潔、維修或其他補充說明"
              @change="updateTable(table, { note: $event.target.value })"
            )
          label.inline-field
            span.inline-field__label 最大訂單數
            input.inline-field__input(
              :value="table.maxActiveOrders"
              type="number"
              min="1"
              step="1"
              @change="updateTable(table, { maxActiveOrders: Number($event.target.value || 1) })"
            )
          .table-row__actions
            button.action-chip(
              type="button"
              @click="updateTable(table, { orderingEnabled: !table.orderingEnabled })"
            ) {{ table.orderingEnabled ? '暫停點餐' : '恢復點餐' }}
            button.action-chip(type="button" @click="viewCurrentOrders(table)") 查看目前訂單
            button.action-chip.is-muted(type="button" @click="updateTable(table, { note: table.note, maxActiveOrders: table.maxActiveOrders })") 儲存設定
</template>

<style lang="sass">
.table-admin-page
  display: grid
  gap: 18px

.table-admin-card,
.empty-state,
.table-row
  padding: 22px
  border-radius: 22px
  background: rgba(255, 255, 255, 0.9)
  border: 1px solid rgba(140, 90, 31, 0.12)

.table-admin-card__head
  display: grid
  gap: 8px
  margin-bottom: 16px

.eyebrow
  margin: 0
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.table-admin-card__title,
.empty-state__title
  margin: 0
  color: #243a3e

.table-admin-card__lead,
.empty-state__text
  margin: 0
  color: #6e8083
  line-height: 1.6

.map-toolbar
  display: grid
  gap: 12px

.map-toolbar__meta,
.table-row__meta,
.entry-card__actions,
.table-row__actions
  display: flex
  flex-wrap: wrap
  gap: 8px
  align-items: center

.map-toolbar__actions
  display: flex
  flex-wrap: wrap
  gap: 10px

.form-field,
.inline-field
  display: grid
  gap: 8px

.form-field__label,
.inline-field__label
  color: #51686b
  font-size: 13px
  font-weight: 700

.form-field__input,
.inline-field__input
  width: 100%
  border: 1px solid rgba(109, 180, 177, 0.25)
  border-radius: 12px
  padding: 10px 12px
  font: inherit
  color: #243a3e
  background: #fff

.inline-field__readonly
  min-height: 42px
  display: flex
  align-items: center
  padding: 10px 12px
  border-radius: 12px
  background: rgba(121, 214, 207, 0.08)
  color: #243a3e
  font-weight: 700

.table-list
  display: grid
  grid-template-columns: repeat(2, minmax(0, 1fr))
  gap: 14px
  align-items: start

.table-row
  display: grid
  gap: 16px

.table-row__head,
.table-row__body,
.entry-card
  display: grid
  gap: 12px

.table-row__title-wrap
  display: flex
  flex-wrap: wrap
  gap: 10px
  align-items: center

.table-row__title
  color: #21393d

.table-row__code,
.table-row__sort
  color: #6e8083
  font-size: 13px

.meta-pill
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70
  font-size: 12px
  font-weight: 700

.meta-pill.is-paused
  background: rgba(214, 123, 108, 0.16)
  color: #8f3a2f

.meta-pill.is-limit
  background: rgba(241, 164, 76, 0.16)
  color: #9c5d11

.table-row__body
  grid-template-columns: minmax(280px, 360px) minmax(0, 1fr)

.entry-card
  padding: 14px
  border-radius: 18px
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
  padding: 4px 8px
  border-radius: 8px
  background: rgba(121, 214, 207, 0.2)
  color: #315a5d

.entry-card__url
  margin: 0
  color: #6e8083
  word-break: break-all

.entry-card__copied
  color: #2d6f6d
  font-size: 12px
  font-weight: 700

.table-row__controls
  display: grid
  gap: 12px

.action-chip
  border: 0
  border-radius: 999px
  padding: 8px 12px
  background: rgba(121, 214, 207, 0.16)
  color: #2d6f6d
  font-weight: 700
  cursor: pointer

.action-chip.is-muted
  background: rgba(140, 90, 31, 0.1)
  color: #8c5a1f

.action-chip:disabled
  opacity: 0.55
  cursor: not-allowed

@media (max-width: 1200px)
  .table-list
    grid-template-columns: 1fr

  .table-row__body
    grid-template-columns: 1fr

@media (max-width: 640px)
  .entry-card__preview
    grid-template-columns: 1fr

  .entry-card__qr,
  .entry-card__qr-empty
    width: 100%
    min-height: 124px
    height: auto
</style>
