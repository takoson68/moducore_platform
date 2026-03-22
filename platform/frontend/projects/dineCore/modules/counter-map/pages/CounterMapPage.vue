<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import world from '@/world.js'
import { useDineCoreStaffAuth } from '@project/services/dineCoreStaffAuthService.js'
import { updateCounterPaymentStatus } from '../../counter/service.js'

const staffAuth = useDineCoreStaffAuth()
const maps = ref([])
const activeMapId = ref('')
const activeMap = ref(null)
const mapTables = ref([])
const activeTableCode = ref('')
const activeOrders = ref([])
const loading = ref(false)
const ordersLoading = ref(false)
const errorMessage = ref('')
const settlingOrderId = ref('')
let tableStatusPollTimer = 0

function unwrapResult(result, fallback = 'API_ERROR') {
  if (result?.ok && result?.data?.ok) {
    return result.data.data
  }

  if (result?.ok) {
    return result.data
  }

  const code = String(result?.data?.error?.code || result?.status || fallback)
  throw new Error(code)
}

function getOperationalStatusLabel(table) {
  switch (String(table?.operationalStatus || '')) {
    case 'paused':
      return '桌位暫停點餐'
    case 'max_active_orders_reached':
      return '已到目前線上最大訂單數'
    case 'unbound':
      return '尚未綁定桌位資料'
    default:
      return '正常營運'
  }
}

function getOperationalStatusClass(table) {
  switch (String(table?.operationalStatus || '')) {
    case 'paused':
      return 'is-paused'
    case 'max_active_orders_reached':
      return 'is-limit'
    case 'unbound':
      return 'is-unbound'
    default:
      return 'is-normal'
  }
}

function getRotateTransform(rotation, centerX, centerY) {
  const angle = Number(rotation || 0)
  if (!angle) return undefined
  return `rotate(${angle} ${Number(centerX || 0)} ${Number(centerY || 0)})`
}

function getObjectCenter(data = {}) {
  return {
    x: Number(data.x || 0) + Number(data.width || 0) / 2,
    y: Number(data.y || 0) + Number(data.height || 0) / 2
  }
}

function getTableDisplayLabel(table = {}) {
  const label = String(table?.label || '').trim()
  const tableCode = String(table?.tableCode || '').trim().toUpperCase()
  const mapCode = String(activeMap.value?.mapCode || '').trim().toUpperCase()
  const note = String(table?.note || '').trim()
  const displayCode = /^[A-Z]{2}-\d{3}$/.test(tableCode)
    ? tableCode.replace(/-/g, '')
    : (mapCode && label ? mapCode + label : label)
  return note ? `${displayCode} - ${note}` : displayCode
}

function buildPathData(points = [], segments = []) {
  if (!Array.isArray(points) || points.length === 0) return ''
  let path = `M ${Number(points[0].x || 0)} ${Number(points[0].y || 0)}`

  for (let index = 1; index < points.length; index += 1) {
    const point = points[index]
    const segment = segments[index - 1] || { type: 'line' }

    if (segment?.type === 'quadratic' && segment.control) {
      path += ` Q ${Number(segment.control.x || 0)} ${Number(segment.control.y || 0)} ${Number(point.x || 0)} ${Number(point.y || 0)}`
      continue
    }

    path += ` L ${Number(point.x || 0)} ${Number(point.y || 0)}`
  }

  return path
}

const mapObjects = computed(() => Array.isArray(activeMap.value?.objects) ? activeMap.value.objects : [])

const drawableObjects = computed(() =>
  mapObjects.value.map(item => {
    const type = String(item?.type || '')
    const data = item?.data && typeof item.data === 'object' ? item.data : {}
    const center = getObjectCenter(data)
    return {
      id: String(item?.id || ''),
      type,
      data,
      center,
      transform: getRotateTransform(data.rotation, center.x, center.y),
      path: type === 'polyline' ? buildPathData(data.points || [], data.segments || []) : ''
    }
  })
)

const activeMapTables = computed(() => {
  const sourceTables = Array.isArray(activeMap.value?.tables) ? activeMap.value.tables : []
  const operationalByCode = new Map(mapTables.value.map(table => [String(table.code || ''), table]))

  return sourceTables.map(item => {
    const tableCode = String(item.tableCode || '')
    const operational = operationalByCode.get(tableCode) || null
    const label = String(item.label || tableCode || '').trim()
    const x = Number(item.x || 0)
    const y = Number(item.y || 0)
    const width = Number(item.width || 80)
    const height = Number(item.height || 80)
    const rotation = Number(item.rotation || 0)
    const currentOpenOrderCount = Number(operational?.currentOpenOrderCount || 0)

    return {
      id: String(item.id || ''),
      label,
      tableCode,
      x,
      y,
      width,
      height,
      rotation,
      transform: getRotateTransform(rotation, x + width / 2, y + height / 2),
      statusLabel: getOperationalStatusLabel(operational),
      operationalStatus: String(operational?.operationalStatus || 'unbound'),
      currentOpenOrderCount,
      maxActiveOrders: Number(operational?.maxActiveOrders || item.maxActiveOrders || 1),
      note: String(operational?.note || item.note || ''),
      activeOrderNo: String(operational?.activeOrderNo || ''),
      hasActiveOrder: Boolean(operational?.hasActiveOrder) || currentOpenOrderCount > 0,
      displayName: tableCode || label || '未綁定桌位'
    }
  })
})

const selectedTable = computed(() =>
  activeMapTables.value.find(table => table.tableCode === activeTableCode.value) || null
)

async function loadMaps() {
  const payload = unwrapResult(
    await world.http().get('/api/dinecore/staff/map-editor/final-list', { tokenQuery: true }),
    'FINAL_MAP_FILE_LIST_FAILED'
  )
  maps.value = Array.isArray(payload?.maps) ? payload.maps : []
  if (!activeMapId.value && maps.value[0]?.id) {
    activeMapId.value = String(maps.value[0].id)
  }
}

function selectMap(mapId) {
  closePanel()
  activeMapId.value = String(mapId || '')
}

async function refreshTableStatuses(refreshOrders = true) {
  if (!activeMapId.value) return

  try {
    const payload = unwrapResult(
      await world.http().get(`/api/dinecore/staff/counter/map-status?map_id=${encodeURIComponent(activeMapId.value)}`, { tokenQuery: true }),
      'COUNTER_MAP_TABLE_STATUS_LOAD_FAILED'
    )
    mapTables.value = Array.isArray(payload?.tables) ? payload.tables : []

    if (refreshOrders && activeTableCode.value) {
      await loadTableOrders(activeTableCode.value)
    }
  } catch (error) {
    errorMessage.value = String(error?.message || 'COUNTER_MAP_TABLE_STATUS_LOAD_FAILED')
  }
}

function startTableStatusPolling() {
  stopTableStatusPolling()
  if (typeof window === 'undefined' || !activeMapId.value) return
  tableStatusPollTimer = window.setInterval(() => {
    void refreshTableStatuses(true)
  }, 20000)
}

function stopTableStatusPolling() {
  if (typeof window === 'undefined' || !tableStatusPollTimer) return
  window.clearInterval(tableStatusPollTimer)
  tableStatusPollTimer = 0
}

async function loadActiveMap() {
  if (!activeMapId.value) {
    activeMap.value = null
    mapTables.value = []
    activeOrders.value = []
    activeTableCode.value = ''
    stopTableStatusPolling()
    return
  }

  loading.value = true
  errorMessage.value = ''
  try {
    const [mapPayload, statusPayload] = await Promise.all([
      world.http().get(`/api/dinecore/staff/map-editor/final-load?map_id=${encodeURIComponent(activeMapId.value)}`, { tokenQuery: true }),
      world.http().get(`/api/dinecore/staff/counter/map-status?map_id=${encodeURIComponent(activeMapId.value)}`, { tokenQuery: true })
    ])

    const mapData = unwrapResult(mapPayload, 'FINAL_MAP_FILE_LOAD_FAILED')
    const statusData = unwrapResult(statusPayload, 'COUNTER_MAP_TABLE_STATUS_LOAD_FAILED')
    activeMap.value = mapData?.map || mapData?.payload || null
    mapTables.value = Array.isArray(statusData?.tables) ? statusData.tables : []
    startTableStatusPolling()
  } catch (error) {
    errorMessage.value = String(error?.message || 'MAP_LOAD_FAILED')
  } finally {
    loading.value = false
  }
}

async function loadTableOrders(tableCode) {
  const code = String(tableCode || '').trim().toUpperCase()
  activeTableCode.value = code
  activeOrders.value = []
  if (!code) return

  ordersLoading.value = true
  try {
    const payload = unwrapResult(
      await world.http().get(`/api/dinecore/staff/counter/orders?table_code=${encodeURIComponent(code)}&payment_status=unpaid`, { tokenQuery: true }),
      'COUNTER_ORDERS_LOAD_FAILED'
    )
    activeOrders.value = Array.isArray(payload)
      ? payload.filter(order => String(order?.paymentStatus || '').toLowerCase() !== 'paid')
      : []
  } catch (error) {
    errorMessage.value = String(error?.message || 'COUNTER_ORDERS_LOAD_FAILED')
  } finally {
    ordersLoading.value = false
  }
}

async function openTablePanel(tableCode) {
  await loadTableOrders(tableCode)
}

function closePanel() {
  activeTableCode.value = ''
  activeOrders.value = []
  settlingOrderId.value = ''
}

function tableClass(table) {
  return {
    'is-paused': table.operationalStatus === 'paused',
    'is-limit': table.operationalStatus === 'max_active_orders_reached',
    'is-unbound': table.operationalStatus === 'unbound',
    'is-active': table.tableCode === activeTableCode.value
  }
}

async function settleOrder(orderId) {
  const normalizedOrderId = String(orderId || '').trim()
  if (!normalizedOrderId || settlingOrderId.value) return

  settlingOrderId.value = normalizedOrderId
  errorMessage.value = ''

  try {
    await updateCounterPaymentStatus(normalizedOrderId, 'paid')
    await refreshTableStatuses(false)
    if (activeTableCode.value) {
      await loadTableOrders(activeTableCode.value)
    }
  } catch (error) {
    errorMessage.value = error instanceof Error ? error.message : 'COUNTER_PAYMENT_UPDATE_FAILED'
  } finally {
    settlingOrderId.value = ''
  }
}

watch(activeMapId, async () => {
  await loadActiveMap()
})

onMounted(async () => {
  if (!staffAuth.isAuthenticated.value || world.apiMode() !== 'real') return
  await loadMaps()
  if (activeMapId.value) {
    await loadActiveMap()
  }
})

onBeforeUnmount(() => {
  stopTableStatusPolling()
})
</script>

<template lang="pug">
.counter-map-page
  section.panel-card
    .panel-card__head
      div
        p.eyebrow Counter Map
        h2 櫃檯桌位地圖工作台
      .map-switcher(v-if="maps.length")
        button.map-switcher__button(
          v-for="map in maps"
          :key="map.id"
          type="button"
          :class="{ 'is-active': map.id === activeMapId }"
          @click="selectMap(map.id)"
        ) {{ map.name || map.id }}

  section.error-card(v-if="errorMessage")
    p {{ errorMessage }}

  section.empty-card(v-if="loading && !activeMap")
    p.empty-card__text 地圖載入中...

  section.map-workspace(v-if="activeMap")
    .map-stage
      .map-stage__meta
        .map-stage__title
          strong {{ activeMap.name || activeMap.id }}
          span {{ `${activeMap.width || 1200} x ${activeMap.height || 800}` }}
        .map-stage__legend
          span.meta-pill.is-normal 正常營運
          span.meta-pill.is-limit 已達上限
          span.meta-pill.is-paused 暫停點餐

      svg.map-surface(:viewBox="`0 0 ${activeMap.width || 1200} ${activeMap.height || 800}`" :style="{ aspectRatio: `${activeMap.width || 1200} / ${activeMap.height || 800}` }")
        defs
          pattern#counter-map-grid-pattern(width="40" height="40" patternUnits="userSpaceOnUse")
            path(d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(90, 106, 123, 0.18)" stroke-width="1")
        rect.map-background(x="0" y="0" :width="activeMap.width || 1200" :height="activeMap.height || 800")
        rect.map-grid(x="0" y="0" :width="activeMap.width || 1200" :height="activeMap.height || 800")

        g.map-objects
          template(v-for="object in drawableObjects" :key="object.id")
            path.map-object.map-object--polyline(v-if="object.type === 'polyline'" :d="object.path")
            g(v-else-if="object.type === 'rect'" :transform="object.transform")
              rect.map-object.map-object--rect(
                :x="object.data.x || 0"
                :y="object.data.y || 0"
                :width="object.data.width || 0"
                :height="object.data.height || 0"
                rx="10"
                ry="10"
              )
            g(v-else-if="object.type === 'circle'" :transform="object.transform")
              ellipse.map-object.map-object--circle(
                :cx="object.center.x"
                :cy="object.center.y"
                :rx="Number(object.data.width || 0) / 2"
                :ry="Number(object.data.height || 0) / 2"
              )
            g(v-else-if="object.type === 'text'" :transform="object.transform")
              rect.map-text-box(
                :x="object.data.x || 0"
                :y="object.data.y || 0"
                :width="object.data.width || 0"
                :height="object.data.height || 0"
                rx="10"
                ry="10"
              )
              text.map-object.map-object--text(
                :x="object.center.x"
                :y="object.center.y"
                text-anchor="middle"
                dominant-baseline="middle"
              ) {{ object.data.content || '' }}

        g(v-for="table in activeMapTables" :key="table.id" class="map-table" :class="tableClass(table)" :transform="table.transform" @click="openTablePanel(table.tableCode)")
          rect.map-table__shape(
            :x="table.x"
            :y="table.y"
            :width="table.width"
            :height="table.height"
            rx="14"
          )
          circle.map-table__order-dot(v-if="table.currentOpenOrderCount > 0" :cx="table.x + table.width - 10" :cy="table.y + 10" r="12")
          text.map-table__order-count(v-if="table.currentOpenOrderCount > 0" :x="table.x + table.width - 10" :y="table.y + 10" text-anchor="middle" dominant-baseline="middle" fill="#ffffff" stroke="none" stroke-width="0") {{ table.currentOpenOrderCount }}
          text.map-table__label(:x="table.x + table.width / 2" :y="table.y + table.height / 2" text-anchor="middle" dominant-baseline="middle" stroke="none" stroke-width="0") {{ getTableDisplayLabel(table) }}

  transition(name="detail-panel")
    .detail-overlay-shell(v-if="selectedTable")
      button.detail-overlay-backdrop(type="button" @click="closePanel")
      aside.detail-overlay
        .detail-overlay__head
          div
            p.detail-overlay__eyebrow 桌位工作台
            h3.detail-title {{ selectedTable.displayName }}
          button.detail-overlay__close(type="button" @click="closePanel") 關閉
        .detail-meta
          span.meta-pill {{ selectedTable.tableCode || '未綁定' }}
          span.meta-pill(:class="getOperationalStatusClass(selectedTable)") {{ selectedTable.statusLabel }}
          span.meta-pill {{ `目前訂單 ${selectedTable.currentOpenOrderCount}/${selectedTable.maxActiveOrders}` }}
        p.detail-note(v-if="selectedTable.note") {{ selectedTable.note }}
        .order-list(v-if="activeOrders.length")
          article.order-card(v-for="order in activeOrders" :key="order.id")
            .order-card__head
              strong {{ order.orderNo }}
              span {{ order.paymentStatus }}
            p.order-card__meta {{ `桌位：${order.tableCode}` }}
            p.order-card__meta {{ `訂單狀態：${order.orderStatus}` }}
            .order-card__actions
              button.detail-action(
                v-if="String(order.paymentStatus || '').toLowerCase() !== 'paid'"
                type="button"
                :disabled="settlingOrderId === String(order.id)"
                @click="settleOrder(order.id)"
              ) {{ settlingOrderId === String(order.id) ? '結單中...' : '結單' }}
              RouterLink.detail-link(:to="`/staff/counter/orders/${order.id}`") 查看訂單內容
        .empty-card(v-else-if="!ordersLoading")
          p.empty-card__text 目前沒有可顯示的訂單。
        .empty-card(v-else)
          p.empty-card__text 訂單載入中...
</template>

<style lang="sass">
.counter-map-page
  display: grid
  gap: 18px

.panel-card,
.error-card,
.empty-card,
.order-card
  padding: 22px
  border-radius: 24px
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(140, 90, 31, 0.12)

.panel-card__head
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 20px

  @media (max-width: 1100px)
    display: grid

.eyebrow,
.detail-overlay__eyebrow
  margin: 0 0 8px
  color: #8c5a1f
  font-size: 12px
  font-weight: 700
  letter-spacing: 0.08em
  text-transform: uppercase

.panel-card h2,
.detail-title
  margin: 0

.detail-note,
.order-card__meta,
.empty-card__text
  margin: 0
  color: #6f5b43
  line-height: 1.6

.map-switcher
  display: flex
  flex-wrap: wrap
  gap: 10px

.map-switcher__button
  border: 1px solid rgba(140, 90, 31, 0.18)
  background: #fffaf2
  color: #7c5c36
  border-radius: 999px
  padding: 10px 16px
  font: inherit
  font-weight: 700
  cursor: pointer

.map-switcher__button.is-active
  background: linear-gradient(135deg, #2d6f6d, #4f9d8b)
  color: #fff
  border-color: transparent

.map-workspace
  display: grid
  gap: 16px

.map-stage
  position: relative
  padding: 18px
  border-radius: 28px
  background: rgba(255, 255, 255, 0.92)
  border: 1px solid rgba(19, 56, 63, 0.08)
  overflow: hidden

.map-stage__meta
  display: flex
  justify-content: space-between
  gap: 16px
  align-items: flex-start
  margin-bottom: 14px

.map-stage__title
  display: grid
  gap: 4px
  color: #5e4b35

.map-stage__legend,
.detail-meta
  display: flex
  flex-wrap: wrap
  gap: 8px

.map-surface
  display: block
  width: 100%
  height: auto
  max-height: calc(100vh - 280px)
  border-radius: 18px
  overflow: hidden
  background: #fffdf7
  box-shadow: inset 0 0 0 1px rgba(19, 56, 63, 0.12)

.map-background
  fill: #fffdf7

.map-grid
  fill: url(#counter-map-grid-pattern)

.map-object
  vector-effect: non-scaling-stroke

.map-object--polyline
  fill: none
  stroke: #17383f
  stroke-width: 3
  stroke-linecap: round
  stroke-linejoin: round

.map-object--rect,
.map-object--circle
  fill: rgba(23, 56, 63, 0.12)
  stroke: #17383f
  stroke-width: 2.5

.map-text-box
  fill: rgba(255, 255, 255, 0.72)
  stroke: rgba(23, 56, 63, 0.2)
  stroke-width: 1.5

.map-object--text
  fill: #17383f
  stroke: none
  font-size: 18px
  font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif
  font-style: normal
  font-weight: 500

.map-table
  cursor: pointer

.map-table__shape
  fill: rgba(0, 150, 136, 0.14)
  stroke: #0a5f57
  stroke-width: 2.5

.map-table__label
  fill: #0a5f57
  stroke: none
  stroke-width: 0
  font-size: 18px
  font-family: "Noto Sans TC", "PingFang TC", "Microsoft JhengHei", sans-serif
  font-style: normal
  font-weight: 500
  user-select: none
  pointer-events: none

.map-table__order-dot
  fill: #d63c32
  stroke: #fff
  stroke-width: 2

.map-table__order-count
  fill: #fff
  stroke: none
  stroke-width: 0
  font-size: 12px
  font-weight: 800
  pointer-events: none

.map-table.is-paused .map-table__shape
  fill: rgba(214, 123, 108, 0.16)
  stroke: #8f3a2f

.map-table.is-limit .map-table__shape
  fill: rgba(192, 107, 45, 0.14)
  stroke: #c06b2d

.map-table.is-unbound .map-table__shape
  fill: rgba(90, 111, 132, 0.08)
  stroke: #4c6378
  stroke-dasharray: 8 6

.map-table.is-active .map-table__shape
  fill: rgba(192, 107, 45, 0.14)
  stroke: #c06b2d

.map-table.is-active .map-table__label
  fill: #c06b2d

.detail-overlay-shell
  position: fixed
  inset: 0
  pointer-events: auto
  z-index: 90

.detail-overlay-backdrop
  position: absolute
  inset: 0
  border: 0
  background: rgba(10, 14, 18, 0.56)
  cursor: pointer

.detail-overlay
  position: absolute
  top: 0
  right: 0
  bottom: 0
  width: min(480px, 42vw)
  display: grid
  align-content: start
  gap: 14px
  padding: 24px
  background: rgba(255, 255, 255, 0.985)
  border-left: 1px solid rgba(140, 90, 31, 0.14)
  box-shadow: -18px 0 36px rgba(72, 53, 28, 0.16)
  overflow: auto
  backdrop-filter: blur(8px)
  z-index: 1

.detail-overlay__head
  display: flex
  justify-content: space-between
  gap: 12px
  align-items: flex-start

.detail-overlay__close
  border: 0
  background: rgba(45, 111, 109, 0.12)
  color: #2d6f6d
  border-radius: 999px
  padding: 8px 12px
  font: inherit
  font-weight: 700
  cursor: pointer

.meta-pill
  padding: 6px 10px
  border-radius: 999px
  background: rgba(121, 214, 207, 0.14)
  color: #486c70
  font-size: 12px
  font-weight: 700

.meta-pill.is-normal
  background: rgba(121, 214, 207, 0.14)
  color: #486c70

.meta-pill.is-limit
  background: rgba(241, 164, 76, 0.18)
  color: #9c5d11

.meta-pill.is-paused
  background: rgba(214, 123, 108, 0.18)
  color: #8f3a2f

.meta-pill.is-unbound
  background: rgba(90, 111, 132, 0.14)
  color: #4c6378

.order-list
  display: grid
  gap: 10px

.order-card
  display: grid
  gap: 8px

.order-card__head
  display: flex
  justify-content: space-between
  gap: 12px

.detail-link
  color: #2d6f6d
  font-weight: 700
  text-decoration: none

.detail-panel-enter-active,
.detail-panel-leave-active
  transition: all 0.18s ease

.detail-panel-enter-from,
.detail-panel-leave-to
  opacity: 0

.detail-panel-enter-from .detail-overlay,
.detail-panel-leave-to .detail-overlay
  transform: translateX(18px)

@media (max-width: 1100px)
  .map-stage__meta
    display: grid

  .detail-overlay
    width: min(100%, 520px)
</style>

.order-card__actions
  display: flex
  align-items: center
  gap: 10px
  margin-top: 12px

.detail-action
  border: 0
  border-radius: 999px
  padding: 10px 16px
  background: linear-gradient(135deg, #ad3131, #d56d48)
  color: #fff
  font-size: 13px
  font-weight: 700
  cursor: pointer

.detail-action:disabled
  opacity: 0.6
  cursor: wait
