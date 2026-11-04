<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { loadGoogleMaps } from '../googleMaps.js'

const activeMode = ref('food')
const distance = ref('附近 1 公里')
const selectedPlaceId = ref('namba-ramen')
const mapElement = ref(null)
const mapState = ref('loading')
const mapMessage = ref('正在連接 Google 地圖…')

let googleMap
let googleMarkers = []

const mapCenter = { lat: 34.6687, lng: 135.5013 }

const places = [
  {
    id: 'namba-ramen',
    name: '難波拉麵店',
    kind: 'food',
    icon: '餐',
    position: { left: '47%', top: '55%' },
    owner: '阿宇收藏',
    status: '尚未打卡',
    detail: '濃郁雞白湯與現做叉燒',
    coordinates: { lat: 34.6672, lng: 135.5018 },
    tone: 'coral'
  },
  {
    id: 'takoyaki',
    name: '道頓堀章魚燒',
    kind: 'food',
    icon: '食',
    position: { left: '20%', top: '36%' },
    owner: '小林收藏',
    status: '已打卡',
    detail: '外酥內軟的在地人氣小吃',
    coordinates: { lat: 34.6688, lng: 135.5014 },
    tone: 'coral'
  },
  {
    id: 'osaka-castle',
    name: '大阪城',
    kind: 'travel',
    icon: '景',
    position: { left: '79%', top: '20%' },
    owner: '共同收藏',
    status: '想去看看',
    detail: '天守閣與公園散步路線',
    coordinates: { lat: 34.6873, lng: 135.5262 },
    tone: 'teal'
  },
  {
    id: 'hozenji',
    name: '法善寺',
    kind: 'travel',
    icon: '景',
    position: { left: '76%', top: '48%' },
    owner: '阿宇收藏',
    status: '已打卡',
    detail: '藏在巷弄裡的靜謐寺院',
    coordinates: { lat: 34.6685, lng: 135.5071 },
    tone: 'teal'
  },
  {
    id: 'namba-shrine',
    name: '難波八阪神社',
    kind: 'travel',
    icon: '景',
    position: { left: '17%', top: '70%' },
    owner: '小林收藏',
    status: '尚未打卡',
    detail: '巨大獅子殿是代表性景觀',
    coordinates: { lat: 34.6628, lng: 135.4959 },
    tone: 'teal'
  }
]

const visiblePlaces = computed(() => {
  if (activeMode.value === 'travel') return places
  return places.filter(place => place.kind === 'food')
})

const selectedPlace = computed(() => {
  return places.find(place => place.id === selectedPlaceId.value) || places[0]
})

function selectMode(mode) {
  activeMode.value = mode

  if (!visiblePlaces.value.some(place => place.id === selectedPlaceId.value)) {
    selectedPlaceId.value = visiblePlaces.value[0]?.id || places[0].id
  }
}

function cycleDistance() {
  const distances = ['附近 1 公里', '附近 3 公里', '附近 5 公里']
  const currentIndex = distances.indexOf(distance.value)
  distance.value = distances[(currentIndex + 1) % distances.length]
}

function refreshSite() {
  window.location.reload()
}

function drawGoogleMarkers(AdvancedMarkerElement, PinElement) {
  googleMarkers.forEach(marker => { marker.map = null })
  googleMarkers = visiblePlaces.value.map(place => {
    const pin = new PinElement({
      background: place.tone === 'coral' ? '#ec6b4f' : '#118178',
      borderColor: '#fffdf9',
      glyphColor: '#fff',
      glyphText: place.icon,
      scale: 1.1
    })
    const marker = new AdvancedMarkerElement({
      map: googleMap,
      position: place.coordinates,
      title: place.name,
      content: pin.element,
      gmpClickable: true
    })
    marker.addEventListener('gmp-click', () => {
      selectedPlaceId.value = place.id
      googleMap.panTo(place.coordinates)
    })
    return marker
  })
}

watch([visiblePlaces, selectedPlaceId], () => {
  if (!googleMap) return
  const place = places.find(item => item.id === selectedPlaceId.value)
  if (place) googleMap.panTo(place.coordinates)
})

onMounted(async () => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY?.trim()
  if (!apiKey) {
    mapState.value = 'needs-key'
    mapMessage.value = '請在 platform/frontend/.env.local 設定 Google Maps API Key，才能載入真實地圖。'
    return
  }

  try {
    const maps = await loadGoogleMaps(apiKey)
    const [{ Map }, { AdvancedMarkerElement, PinElement }] = await Promise.all([
      maps.importLibrary('maps'),
      maps.importLibrary('marker')
    ])

    googleMap = new Map(mapElement.value, {
      center: mapCenter,
      zoom: 15,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false
    })
    drawGoogleMarkers(AdvancedMarkerElement, PinElement)
    mapState.value = 'ready'
  } catch (error) {
    mapState.value = 'error'
    mapMessage.value = error instanceof Error ? error.message : 'Google 地圖載入失敗。'
  }
})

onUnmounted(() => {
  googleMarkers.forEach(marker => { marker.map = null })
  googleMarkers = []
  googleMap = null
})
</script>

<template lang="pug">
main.map-home
  section.app-frame(aria-label="食旅地圖首頁視覺原型")
    header.map-header
      .brand-row
        button.brand-home-button(type="button" aria-label="重新整理食旅地圖" title="重新整理網站" @click="refreshSite")
          .brand-mark(aria-hidden="true") 路
        label.search-box
          span.search-icon(aria-hidden="true") ⌕
          input(type="search" placeholder="搜尋店家或地點" aria-label="搜尋店家或地點")

      .filter-row(aria-label="地圖篩選")
        button.filter-chip(
          type="button"
          :class="{ active: activeMode === 'food' }"
          @click="selectMode('food')"
        )
          span.chip-icon(aria-hidden="true") ◖
          | 美食
        button.filter-chip(
          type="button"
          :class="{ active: activeMode === 'travel' }"
          @click="selectMode('travel')"
        )
          span.chip-icon(aria-hidden="true") ◉
          | 旅遊
        button.filter-chip.distance-chip(type="button" @click="cycleDistance")
          span.chip-icon(aria-hidden="true") ⌖
          | {{ distance }}
          span.chevron(aria-hidden="true") ⌄

    section.map-canvas(aria-label="大阪難波地圖")
      .google-map(ref="mapElement" aria-label="Google 地圖")
      .map-status(v-if="mapState !== 'ready'" :class="`map-status-${mapState}`" role="status")
        strong {{ mapState === 'loading' ? '正在載入地圖' : mapState === 'needs-key' ? 'Google 地圖尚未設定' : 'Google 地圖載入失敗' }}
        span {{ mapMessage }}

      template(v-if="mapState !== 'ready'")
        .map-grid(aria-hidden="true")
        .river(aria-hidden="true")
        .road.road-a(aria-hidden="true")
        .road.road-b(aria-hidden="true")
        .road.road-c(aria-hidden="true")
        .district-label.namba-label
          strong 難波
          span Namba
        .district-label.dotonbori-label 道頓堀川
        .district-label.station-label
          span.station-symbol(aria-hidden="true") M
          | 南海難波站

      .legend-card
        strong 共享收藏地點
        span
          i.legend-pin.coral
          | 已收藏（尚未打卡）
        span
          i.legend-pin.teal
          | 已打卡／旅遊景點

      button.map-marker(
        v-if="mapState !== 'ready'"
        v-for="place in visiblePlaces"
        :key="place.id"
        type="button"
        :class="[place.tone, { selected: selectedPlaceId === place.id }]"
        :style="place.position"
        :aria-label="`查看 ${place.name}`"
        @click="selectedPlaceId = place.id"
      )
        span.marker-bubble
          span {{ place.icon }}
        span.marker-name {{ place.name }}

      button.location-button(type="button" aria-label="回到目前位置")
        span ◎

      article.place-card
        button.close-card(type="button" aria-label="關閉地點卡片") ×
        .place-thumb(:class="selectedPlace.tone" aria-hidden="true")
          span {{ selectedPlace.kind === 'food' ? '麵' : '旅' }}
        .place-card-content
          .place-heading
            div
              span.place-kicker {{ selectedPlace.owner }} · {{ selectedPlace.status }}
              h2 {{ selectedPlace.name }}
            button.bookmark-button(type="button" aria-label="收藏此地點") ◆
          p {{ selectedPlace.detail }}
          .place-actions
            button.secondary-action(type="button") 查看詳情
            button.primary-action(type="button") 打卡

    nav.bottom-nav(aria-label="主要導覽")
      button.nav-item.active(type="button")
        span.nav-icon(aria-hidden="true") ●
        span 地圖
      button.nav-item(type="button")
        span.nav-icon(aria-hidden="true") ♢
        span 收藏
      button.nav-item(type="button")
        span.nav-icon(aria-hidden="true") ▤
        span 日誌

  aside.prototype-note
    span.prototype-tag VISUAL PROTOTYPE
    h2 先把旅行的期待，放進地圖裡。
    p 使用 Google 地圖底圖與合成地點標記；收藏、打卡與日誌資料仍是尚未串接的介面原型。
    .note-list
      span
        b 01
        | 探索附近美食與景點
      span
        b 02
        | 收藏兩人共同想去的地方
      span
        b 03
        | 從一個地點開始留下旅程
</template>

<style lang="sass">
.map-home
  --egm-green-900: #0a514b
  --egm-green-800: #0d6961
  --egm-green-700: #118178
  --egm-green-100: #dcece7
  --egm-coral: #ec6b4f
  --egm-ink: #152523
  --egm-muted: #6f7b78
  min-height: 100dvh
  display: grid
  grid-template-columns: minmax(360px, 500px) minmax(280px, 420px)
  align-items: center
  justify-content: center
  gap: clamp(44px, 7vw, 112px)
  padding: clamp(24px, 4vw, 64px)
  overflow: hidden
  background: radial-gradient(circle at 15% 12%, rgba(236, 107, 79, .13), transparent 30%), radial-gradient(circle at 88% 88%, rgba(17, 129, 120, .17), transparent 31%), #f4efe7
  color: var(--egm-ink)

.app-frame
  width: min(100%, 460px)
  height: min(900px, calc(100dvh - 48px))
  min-height: 680px
  display: grid
  grid-template-rows: auto minmax(0, 1fr) 56px
  position: relative
  overflow: hidden
  border: 10px solid #17201f
  border-radius: 42px
  background: #fffdf9
  box-shadow: 0 36px 80px rgba(35, 48, 44, .24), inset 0 0 0 2px rgba(255,255,255,.18)

.map-header
  position: relative
  z-index: 20
  padding: 10px 16px 9px
  background: linear-gradient(145deg, var(--egm-green-900), var(--egm-green-700))
  color: white

.brand-row
  display: flex
  align-items: center
  gap: 10px
  margin-bottom: 0

.brand-home-button
  display: flex
  align-items: center
  justify-content: center
  flex: 0 0 36px
  padding: 0
  border: 0
  background: transparent
  color: inherit
  text-align: left
  cursor: pointer

.brand-mark
  width: 36px
  height: 36px
  display: grid
  place-items: center
  margin-right: 0
  border: 1px solid rgba(255,255,255,.32)
  border-radius: 12px
  background: rgba(255,255,255,.13)
  font-weight: 900
  font-size: 16px

.search-box
  height: 40px
  flex: 1
  min-width: 0
  display: flex
  align-items: center
  gap: 8px
  padding: 0 14px
  border-radius: 15px
  background: #fffdf9
  box-shadow: 0 8px 18px rgba(4, 48, 44, .16)

.search-icon
  color: #64716f
  font-size: 24px
  line-height: 1

.search-box input
  flex: 1
  min-width: 0
  border: 0
  outline: 0
  background: transparent
  color: var(--egm-ink)
  font-size: 14px

.search-box input::placeholder
  color: #858e8b

.filter-row
  display: grid
  grid-template-columns: auto auto 1fr
  gap: 8px
  margin-top: 9px

.filter-chip
  min-height: 34px
  display: flex
  align-items: center
  justify-content: center
  gap: 6px
  padding: 0 11px
  border: 1px solid rgba(255,255,255,.2)
  border-radius: 999px
  background: rgba(255,255,255,.92)
  color: #31433f
  font-weight: 800
  font-size: 12px
  cursor: pointer
  transition: transform 160ms ease, background 160ms ease, color 160ms ease

.filter-chip:hover
  transform: translateY(-1px)

.filter-chip.active
  background: #f2d8c6
  color: #8a3f2f

.chip-icon
  color: var(--egm-green-700)
  font-size: 14px

.distance-chip
  justify-self: stretch

.chevron
  margin-left: auto

.map-canvas
  position: relative
  overflow: hidden
  background: #e8e2d5

.google-map
  position: absolute
  z-index: 0
  inset: 0

.map-status
  position: absolute
  z-index: 10
  left: 50%
  top: 50%
  width: min(82%, 330px)
  display: grid
  gap: 7px
  padding: 15px 17px
  border: 1px solid rgba(255,255,255,.8)
  border-radius: 17px
  background: rgba(255,253,249,.94)
  box-shadow: 0 12px 32px rgba(35,48,44,.18)
  color: var(--egm-ink)
  transform: translate(-50%, -50%)
  backdrop-filter: blur(12px)

.map-status strong
  color: var(--egm-green-900)
  font-size: 14px

.map-status span
  color: var(--egm-muted)
  font-size: 12px
  line-height: 1.6

.map-grid
  position: absolute
  inset: -80px
  opacity: .92
  background-color: #ebe6db
  background-image: linear-gradient(32deg, transparent 46%, #fffdf7 47%, #fffdf7 52%, transparent 53%), linear-gradient(112deg, transparent 45%, #fffdf7 46%, #fffdf7 51%, transparent 52%), linear-gradient(0deg, transparent 47%, #d9d3c7 48%, #d9d3c7 49%, transparent 50%), linear-gradient(90deg, transparent 47%, #d9d3c7 48%, #d9d3c7 49%, transparent 50%)
  background-size: 112px 96px, 138px 118px, 52px 52px, 52px 52px
  transform: rotate(-5deg) scale(1.08)

.river
  position: absolute
  left: -10%
  top: 42%
  width: 125%
  height: 48px
  transform: rotate(-8deg)
  background: linear-gradient(180deg, #b9e2e6, #8dccd2)
  border-block: 4px solid rgba(255,255,255,.8)

.road
  position: absolute
  height: 15px
  background: rgba(255,255,255,.86)
  border-block: 1px solid #d8cfc0

.road-a
  width: 125%
  left: -12%
  top: 69%
  transform: rotate(13deg)

.road-b
  width: 92%
  left: 13%
  top: 31%
  transform: rotate(-25deg)

.road-c
  width: 82%
  left: 31%
  top: 56%
  transform: rotate(80deg)

.district-label
  position: absolute
  z-index: 2
  color: rgba(38, 55, 52, .7)
  font-size: 12px
  font-weight: 800
  text-shadow: 0 1px white

.namba-label
  left: 44%
  top: 64%
  display: grid
  text-align: center

.namba-label strong
  font-size: 25px
  color: rgba(38, 55, 52, .74)

.namba-label span
  font-size: 12px

.dotonbori-label
  left: 42%
  top: 40%
  transform: rotate(-8deg)
  color: #277f91

.station-label
  left: 15%
  top: 82%
  display: flex
  align-items: center
  gap: 5px

.station-symbol
  width: 19px
  height: 19px
  display: grid
  place-items: center
  border-radius: 5px
  background: #355868
  color: white
  font-size: 9px

.legend-card
  position: absolute
  z-index: 7
  left: 14px
  top: 14px
  display: grid
  gap: 7px
  padding: 12px 14px
  border-radius: 15px
  background: rgba(255,253,249,.92)
  box-shadow: 0 10px 25px rgba(41, 54, 50, .16)
  backdrop-filter: blur(8px)

.legend-card strong
  font-size: 12px

.legend-card span
  display: flex
  align-items: center
  gap: 7px
  color: #58635f
  font-size: 10px
  font-weight: 700

.legend-pin
  width: 9px
  height: 9px
  border-radius: 50% 50% 50% 0
  transform: rotate(-45deg)

.legend-pin.coral
  background: var(--egm-coral)

.legend-pin.teal
  background: var(--egm-green-700)

.map-marker
  position: absolute
  z-index: 5
  display: grid
  justify-items: center
  padding: 0
  border: 0
  background: transparent
  transform: translate(-50%, -50%)
  cursor: pointer

.marker-bubble
  width: 41px
  height: 41px
  display: grid
  place-items: center
  position: relative
  border: 4px solid white
  border-radius: 50% 50% 50% 8px
  transform: rotate(-45deg)
  box-shadow: 0 7px 15px rgba(28, 55, 49, .24)
  color: white
  font-size: 10px
  font-weight: 900

.marker-bubble::after
  content: ''
  position: absolute
  inset: 8px
  border: 1px solid rgba(255,255,255,.65)
  border-radius: 50%

.marker-bubble
  line-height: 1

.marker-bubble > *
  transform: rotate(45deg)

.map-marker.coral .marker-bubble
  background: var(--egm-coral)

.map-marker.teal .marker-bubble
  background: var(--egm-green-700)

.map-marker.selected
  z-index: 6

.map-marker.selected .marker-bubble
  transform: rotate(-45deg) scale(1.16)
  box-shadow: 0 0 0 4px rgba(255,255,255,.65), 0 10px 18px rgba(28,55,49,.3)

.marker-name
  margin-top: 5px
  padding: 3px 7px
  border-radius: 7px
  background: rgba(255,255,255,.9)
  color: #2b3936
  white-space: nowrap
  box-shadow: 0 2px 7px rgba(40,50,46,.12)
  font-size: 10px
  font-weight: 900

.location-button
  position: absolute
  z-index: 8
  right: 15px
  bottom: 181px
  width: 44px
  height: 44px
  border: 0
  border-radius: 14px
  background: #fffdf9
  color: var(--egm-green-700)
  box-shadow: 0 8px 22px rgba(31, 46, 42, .2)
  font-size: 24px
  cursor: pointer

.place-card
  position: absolute
  z-index: 10
  left: 13px
  right: 13px
  bottom: 13px
  display: grid
  grid-template-columns: 92px minmax(0, 1fr)
  gap: 14px
  padding: 14px
  border: 1px solid rgba(255,255,255,.8)
  border-radius: 22px
  background: rgba(255,253,249,.96)
  box-shadow: 0 16px 35px rgba(31, 46, 42, .23)
  backdrop-filter: blur(12px)

.close-card
  position: absolute
  top: 8px
  right: 10px
  border: 0
  background: transparent
  color: #7b8582
  font-size: 20px
  cursor: pointer

.place-thumb
  min-height: 112px
  display: grid
  place-items: center
  overflow: hidden
  border-radius: 16px
  position: relative

.place-thumb::before,
.place-thumb::after
  content: ''
  position: absolute
  border-radius: 50%
  background: rgba(255,255,255,.24)

.place-thumb::before
  width: 90px
  height: 90px
  right: -28px
  top: -28px

.place-thumb::after
  width: 62px
  height: 62px
  left: -18px
  bottom: -18px

.place-thumb.coral
  background: linear-gradient(145deg, #f5b17e, #b94533)

.place-thumb.teal
  background: linear-gradient(145deg, #80c9b7, #176b61)

.place-thumb span
  position: relative
  z-index: 1
  width: 55px
  height: 55px
  display: grid
  place-items: center
  border: 2px solid rgba(255,255,255,.72)
  border-radius: 50%
  color: white
  font-size: 22px
  font-weight: 900

.place-card-content
  min-width: 0
  display: grid

.place-heading
  display: flex
  align-items: flex-start
  gap: 8px
  padding-right: 20px

.place-kicker
  color: var(--egm-coral)
  font-size: 10px
  font-weight: 900

.place-heading h2
  margin: 3px 0 0
  font-size: 20px
  line-height: 1.2

.bookmark-button
  margin-left: auto
  width: 30px
  height: 30px
  flex: 0 0 auto
  border: 0
  border-radius: 10px
  background: var(--egm-green-100)
  color: var(--egm-green-700)
  cursor: pointer

.place-card-content p
  margin: 7px 0 10px
  color: var(--egm-muted)
  font-size: 11px

.place-actions
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 8px
  align-self: end

.place-actions button
  min-height: 36px
  border-radius: 12px
  font-weight: 900
  font-size: 12px
  cursor: pointer

.secondary-action
  border: 1px solid var(--egm-green-700)
  background: white
  color: var(--egm-green-700)

.primary-action
  border: 1px solid var(--egm-green-700)
  background: var(--egm-green-700)
  color: white

.bottom-nav
  position: relative
  z-index: 20
  display: grid
  grid-template-columns: repeat(3, 1fr)
  padding: 2px 18px
  border-top: 1px solid #e8e1d7
  background: rgba(255,253,249,.98)

.nav-item
  display: grid
  justify-items: center
  align-content: center
  gap: 1px
  border: 0
  background: transparent
  color: #68726f
  font-size: 11px
  font-weight: 800
  cursor: pointer

.nav-item.active
  color: var(--egm-green-700)

.nav-icon
  font-size: 15px

.prototype-note
  max-width: 390px

.prototype-tag
  display: inline-flex
  padding: 7px 11px
  border: 1px solid rgba(13,105,97,.24)
  border-radius: 999px
  color: var(--egm-green-800)
  font-size: 10px
  font-weight: 900
  letter-spacing: .18em

.prototype-note h2
  max-width: 360px
  margin: 22px 0 16px
  font-size: clamp(38px, 4.5vw, 64px)
  line-height: 1.08
  letter-spacing: -.045em

.prototype-note p
  margin: 0
  color: #68726f
  font-size: 15px
  line-height: 1.85

.note-list
  display: grid
  gap: 13px
  margin-top: 34px

.note-list span
  display: flex
  align-items: center
  gap: 14px
  color: #40504c
  font-size: 13px
  font-weight: 800

.note-list b
  width: 36px
  height: 36px
  display: grid
  place-items: center
  border-radius: 12px
  background: rgba(13,105,97,.1)
  color: var(--egm-green-800)
  font-size: 10px

@media (max-width: 920px)
  .map-home
    grid-template-columns: minmax(320px, 500px)
    padding: 20px

  .prototype-note
    display: none

@media (max-width: 560px)
  .map-home
    display: block
    padding: 0
    background: linear-gradient(145deg, var(--egm-green-900), var(--egm-green-700))

  .app-frame
    width: 100%
    height: 100dvh
    min-height: 620px
    border: 0
    border-radius: 0
    box-shadow: none

  .map-header
    padding-top: max(14px, env(safe-area-inset-top))
    padding-left: 16px
    padding-right: 16px

@media (max-height: 730px) and (min-width: 561px)
  .app-frame
    min-height: 650px
    height: calc(100dvh - 30px)

  .map-header
    padding-top: 16px
    padding-bottom: 12px

  .place-card
    grid-template-columns: 76px minmax(0, 1fr)

  .place-thumb
    min-height: 96px
</style>
