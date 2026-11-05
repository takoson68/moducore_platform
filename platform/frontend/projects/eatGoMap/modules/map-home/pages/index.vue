<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import world from '@/world.js'
import { loadGoogleMaps } from '../googleMaps.js'

const favoriteStore = world.store('eatGoMapFavoriteStore')
const activeMode = ref('food')
const activeTab = ref('map')
const distance = ref('附近 1 公里')
const selectedPlaceId = ref(null)
const selectedMapPoi = ref(null)
const mapElement = ref(null)
const mapState = ref('loading')
const mapMessage = ref('正在連接 Google 地圖…')
const isLocating = ref(false)
const locationMessage = ref('')
const searchQuery = ref('')
const searchSuggestions = ref([])
const isSearching = ref(false)
const searchMessage = ref('')
const searchedPlace = ref(null)
const isSavingFavorite = ref(false)
const loadingFavoriteIds = ref(new Set())
const editingFavoriteId = ref(null)
const editFavoriteName = ref('')
const editFavoriteAddress = ref('')
const editFavoriteNote = ref('')
function favoritePlaceId(item) {
  const id = item?.id || item?.place_id || item?.placeId
  return typeof id === 'string' && id.trim() ? id.trim() : null
}

const savedPlaceIds = computed(() => new Set(favoriteStore.state.items.map(favoritePlaceId).filter(Boolean)))
const savedPlaces = computed(() => favoriteStore.state.items
  .filter(item => favoritePlaceId(item))
  .map(item => {
    const id = favoritePlaceId(item)
    return {
      ...item,
      id,
      displayName: item.customName || item.name || `已收藏地點 ${id.slice(0, 8)}`,
      displayAddress: item.customAddress || item.address
    }
  }))
const favoriteApiState = computed(() => favoriteStore.state.syncState)

let googleMap
let googleMarkers = []
let CurrentLocationMarker
let currentLocationMarker
let locationMessageTimer
let viewportMeta
let originalViewportContent
let AutocompleteSuggestion
let AutocompleteSessionToken
let Place
let autocompleteSessionToken
let autocompleteTimer
let autocompleteRequestId = 0
let searchMarker
let SearchMarkerElement
let FavoritePinElement
let favoriteMarkers = []
let mapPoiClickListener

const mapCenter = { lat: 25.0641, lng: 121.5336 }

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
  return places.find(place => place.id === selectedPlaceId.value) || null
})
const hasSelectedPlace = computed(() => Boolean(selectedMapPoi.value || searchedPlace.value || selectedPlace.value))
const activePlace = computed(() => {
  if (selectedMapPoi.value) {
    return { name: '地圖上的地標', tone: 'teal', kind: 'poi' }
  }
  return searchedPlace.value || selectedPlace.value
})
const selectedPlaceIsSaved = computed(() => {
  if (selectedMapPoi.value) return savedPlaceIds.value.has(selectedMapPoi.value.id)
  if (!searchedPlace.value) return Boolean(selectedPlace.value)
  return savedPlaceIds.value.has(searchedPlace.value.id)
})
const selectedPlaceKicker = computed(() => {
  if (selectedMapPoi.value) return selectedPlaceIsSaved.value ? '已收藏' : 'Google 地圖地標'
  if (!searchedPlace.value) {
    return selectedPlace.value ? `${selectedPlace.value.owner} · ${selectedPlace.value.status}` : ''
  }
  return selectedPlaceIsSaved.value ? '已收藏 · 尚未打卡' : '尚未收藏'
})
const selectedPlaceDetail = computed(() => {
  if (selectedMapPoi.value) return '地點名稱與地址請查看 Google 地圖資訊窗。'
  return searchedPlace.value?.address || selectedPlace.value?.detail || ''
})
const selectedPlaceAction = computed(() => {
  if (selectedMapPoi.value) return selectedPlaceIsSaved.value ? '已收藏' : '加入收藏'
  return selectedPlaceIsSaved.value ? '打卡' : '收藏'
})
const savedPlaceCount = computed(() => savedPlaces.value.length)

async function fetchPlaceDetails(placeId) {
  if (!Place) throw new Error('Places library 尚未載入')
  const place = new Place({ id: placeId })
  await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'nationalPhoneNumber'] })
  const coordinates = place.location?.toJSON?.()
  return {
    name: place.displayName?.toString() || '',
    address: place.formattedAddress || '',
    coordinates: coordinates || null,
    phone: place.nationalPhoneNumber || ''
  }
}

async function refreshFavoriteDetails(favorite, { quiet = false } = {}) {
  const placeId = favoritePlaceId(favorite)
  if (!placeId || !Place || loadingFavoriteIds.value.has(placeId)) return false
  const next = new Set(loadingFavoriteIds.value)
  next.add(placeId)
  loadingFavoriteIds.value = next
  try {
    const updated = await favoriteStore.refreshPlaceDetails({ placeId, fetchDetails: fetchPlaceDetails })
    return Boolean(updated?.detailsFetchedAt)
  } catch {
    if (!quiet) {
      const latest = favoriteStore.state.items.find(item => favoritePlaceId(item) === placeId)
      showLocationMessage(latest?.detailsRefreshFailures >= 2
        ? '這個地點已連續查詢失敗 2 次，已停止再次呼叫。'
        : '地點資訊查詢失敗；同一地點最多再嘗試一次。')
    }
    return false
  } finally {
    const updated = new Set(loadingFavoriteIds.value)
    updated.delete(placeId)
    loadingFavoriteIds.value = updated
  }
}

function refreshExpiredFavoriteDetails() {
  for (const item of favoriteStore.state.items) {
    if (!item.detailsFetchedAt || Date.now() - item.detailsFetchedAt >= 30 * 24 * 60 * 60 * 1000) {
      void refreshFavoriteDetails(item, { quiet: true })
    }
  }
}

function beginFavoriteEdit(favorite) {
  editingFavoriteId.value = favorite.id
  // Leave the form blank unless the user previously saved their own values.
  editFavoriteName.value = favorite.customName || ''
  editFavoriteAddress.value = favorite.customAddress || ''
  editFavoriteNote.value = favorite.personalNote || ''
}

function cancelFavoriteEdit() {
  editingFavoriteId.value = null
  editFavoriteName.value = ''
  editFavoriteAddress.value = ''
  editFavoriteNote.value = ''
}

async function saveFavoriteLabels(favorite) {
  try {
    await favoriteStore.savePersonalFields({
      placeId: favorite.id,
      customName: editFavoriteName.value,
      customAddress: editFavoriteAddress.value,
      personalNote: editFavoriteNote.value
    })
    cancelFavoriteEdit()
    showLocationMessage('已儲存你輸入的收藏名稱與地址。')
  } catch {
    showLocationMessage('無法將自訂名稱或地址儲存至此瀏覽器。')
  }
}

async function removeSavedPlace(placeId) {
  try {
    await favoriteStore.removeFavorite(placeId)
  } catch {
    showLocationMessage('收藏 API 無法連線，尚未移除地點。')
    return
  }
  showLocationMessage('已從此瀏覽器移除收藏。')
}

// 搜尋到合成地點時切回既有卡片，不沿用外部搜尋結果。
function selectMockPlace(placeId) {
  selectedMapPoi.value = null
  searchedPlace.value = null
  selectedPlaceId.value = placeId
  if (searchMarker) searchMarker.map = null
  searchMarker = null
}

// 關閉地點卡片並清除目前搜尋、選取與暫存標記。
function closePlaceCard() {
  selectedPlaceId.value = null
  selectedMapPoi.value = null
  searchedPlace.value = null
  searchQuery.value = ''
  searchSuggestions.value = []
  searchMessage.value = ''
  isSearching.value = false
  autocompleteSessionToken = null
  autocompleteRequestId += 1
  window.clearTimeout(autocompleteTimer)
  if (searchMarker) searchMarker.map = null
  searchMarker = null
}

async function toggleSearchedPlaceSaved() {
  if (!searchedPlace.value) {
    showLocationMessage('這個示意地點已收藏；打卡功能尚未串接後端。')
    return
  }

  if (savedPlaceIds.value.has(searchedPlace.value.id)) {
    await removeSavedPlace(searchedPlace.value.id)
    return
  }

  try {
    const place = searchedPlace.value
    await favoriteStore.addFavorite({
      placeId: place.id,
      kind: 'search',
      name: place.name,
      address: place.address,
      coordinates: place.coordinates,
      phone: place.phone || '',
      detailsFetchedAt: Date.now()
    })
    showLocationMessage('已加入收藏。')
  } catch {
    showLocationMessage('無法連接收藏 API，尚未加入收藏。')
  }
}

// 底圖 POI 收藏將 Place ID 存入 D1，再以 Place ID 取得並快取詳情。
async function handlePlacePrimaryAction() {
  if (selectedMapPoi.value) {
    const selectedPoi = selectedMapPoi.value
    if (selectedPlaceIsSaved.value || isSavingFavorite.value) return

    isSavingFavorite.value = true
    try {
      const favorite = await favoriteStore.addFavorite({ placeId: selectedPoi.id, kind: 'poi' })
      const detailsSaved = await refreshFavoriteDetails(favorite, { quiet: true })
      if (detailsSaved) {
        showLocationMessage('已加入收藏，地點資訊已保存至此瀏覽器。')
      } else {
        const latest = favoriteStore.state.items.find(item => item.id === selectedPoi.id)
        showLocationMessage(latest?.detailsRefreshFailures >= 2
          ? '已加入收藏，但地點資料查詢連續失敗 2 次，已停止再次呼叫。'
          : '已加入收藏，但地點資料尚未保存；可到收藏頁再查詢一次。')
      }
    } catch {
      showLocationMessage('無法連接收藏 API，尚未加入收藏。')
    } finally {
      isSavingFavorite.value = false
    }
    return
  }

  if (!selectedPlaceIsSaved.value) {
    toggleSearchedPlaceSaved()
    return
  }
  showLocationMessage('打卡功能尚未串接後端。')
}

function selectMode(mode) {
  activeMode.value = mode

  if (selectedPlaceId.value && !visiblePlaces.value.some(place => place.id === selectedPlaceId.value)) {
    selectedPlaceId.value = null
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

function openTab(tab) {
  activeTab.value = tab
  if (tab !== 'map') closeSearchSuggestions()
  if (tab === 'favorites') refreshExpiredFavoriteDetails()
}

// 依輸入文字向 Places Autocomplete 請求店家、地標與地址建議。
function updateSearchSuggestions() {
  window.clearTimeout(autocompleteTimer)
  searchMessage.value = ''

  const input = searchQuery.value.trim()
  if (input.length === 0) autocompleteSessionToken = null
  if (input.length < 2 || !AutocompleteSuggestion || !googleMap) {
    searchSuggestions.value = []
    isSearching.value = false
    autocompleteRequestId += 1
    if (input.length >= 2 && !AutocompleteSuggestion) {
      searchMessage.value = 'Google 地點搜尋尚未就緒，請確認 Places API (New) 已啟用。'
    }
    return
  }

  if (!autocompleteSessionToken) autocompleteSessionToken = new AutocompleteSessionToken()
  const requestId = ++autocompleteRequestId
  isSearching.value = true
  autocompleteTimer = window.setTimeout(async () => {
    try {
      const request = {
        input,
        sessionToken: autocompleteSessionToken,
        language: 'zh-TW'
      }
      const bounds = googleMap.getBounds()
      if (bounds) request.locationBias = bounds

      const { suggestions = [] } = await AutocompleteSuggestion.fetchAutocompleteSuggestions(request)
      if (requestId !== autocompleteRequestId) return
      searchSuggestions.value = suggestions
        .filter(item => item.placePrediction)
        .slice(0, 6)
        .map(item => ({
          prediction: item.placePrediction,
          text: item.placePrediction.text.toString()
        }))
      if (searchSuggestions.value.length === 0) searchMessage.value = '找不到符合的店家或地址。'
    } catch {
      if (requestId === autocompleteRequestId) {
        searchSuggestions.value = []
        searchMessage.value = '搜尋無法使用，請確認 Google Cloud 已啟用 Places API (New)。'
      }
    } finally {
      if (requestId === autocompleteRequestId) isSearching.value = false
    }
  }, 250)
}

// 收合搜尋建議清單並清除暫存提示。
function closeSearchSuggestions() {
  searchSuggestions.value = []
  searchMessage.value = ''
}

// 顯示 Google 地點資料，將地點卡片、地圖中心與搜尋標記同步更新。
async function showGooglePlace(place, fallbackName = '', addSearchMarker = true) {
  const requestId = ++autocompleteRequestId
  window.clearTimeout(autocompleteTimer)
  if (searchMarker) searchMarker.map = null
  searchMarker = null
  selectedMapPoi.value = null
  searchSuggestions.value = []
  searchMessage.value = ''
  isSearching.value = false
  searchQuery.value = fallbackName
  searchedPlace.value = {
    id: place.id,
    name: fallbackName || '載入地點資訊…',
    address: '',
    tone: 'teal',
    kind: 'search'
  }

  try {
    await place.fetchFields({ fields: ['displayName', 'formattedAddress', 'location', 'nationalPhoneNumber'] })
    if (requestId !== autocompleteRequestId || !googleMap) return
    if (!place.location) {
      showLocationMessage('無法取得此地點的位置，請改選其他地點。')
      return
    }

    const name = place.displayName?.toString() || fallbackName || '地圖地標'
    searchQuery.value = name
    searchedPlace.value = {
      id: place.id,
      name,
      address: place.formattedAddress || '',
      tone: 'teal',
      kind: 'search',
      coordinates: place.location.toJSON(),
      phone: place.nationalPhoneNumber || ''
    }
    searchSuggestions.value = []
    autocompleteSessionToken = null
    googleMap.panTo(place.location)
    googleMap.setZoom(Math.max(16, googleMap.getZoom() || 15))

    if (addSearchMarker) {
      searchMarker = new SearchMarkerElement({
        map: googleMap,
        position: place.location,
        title: name
      })
    }
    showLocationMessage(place.formattedAddress ? `已定位：${name}・${place.formattedAddress}` : `已定位：${name}`)
  } catch {
    showLocationMessage('地點卡片已顯示搜尋名稱，但無法取得完整位置資料，請再試一次。')
  } finally {
    autocompleteSessionToken = null
    if (requestId === autocompleteRequestId) isSearching.value = false
  }
}

// 選取搜尋建議後沿用 Places Autocomplete 的 Place 物件與計費 Session。
function selectSearchSuggestion(item) {
  void showGooglePlace(item.prediction.toPlace(), item.text)
}

// 接收底圖 POI 點擊；保留 Google 原生資訊窗，只用 placeId 提供收藏操作。
function handleGoogleMapClick(event) {
  if (!event.placeId) {
    selectedMapPoi.value = null
    return
  }

  selectedPlaceId.value = null
  searchedPlace.value = null
  selectedMapPoi.value = { id: event.placeId }
  searchQuery.value = ''
  searchSuggestions.value = []
  searchMessage.value = ''
  isSearching.value = false
  autocompleteSessionToken = null
  autocompleteRequestId += 1
  window.clearTimeout(autocompleteTimer)
  if (searchMarker) searchMarker.map = null
  searchMarker = null
}

function showLocationMessage(message) {
  locationMessage.value = message
  window.clearTimeout(locationMessageTimer)
  locationMessageTimer = window.setTimeout(() => {
    locationMessage.value = ''
  }, 6500)
}

function getCurrentPosition() {
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      maximumAge: 30000,
      timeout: 15000
    })
  })
}

async function locateCurrentPosition() {
  if (isLocating.value) return

  if (!window.isSecureContext) {
    showLocationMessage('目前位置需要 HTTPS 安全連線。請開啟 GPS，並允許瀏覽器存取此網站的位置。')
    return
  }

  if (!navigator.geolocation) {
    showLocationMessage('此瀏覽器不支援定位，請改用支援位置服務的瀏覽器。')
    return
  }

  if (!googleMap || !CurrentLocationMarker) {
    showLocationMessage('地圖仍在載入，請稍後再點定位。')
    return
  }

  isLocating.value = true

  try {
    const position = await getCurrentPosition()
    const coordinates = {
      lat: position.coords.latitude,
      lng: position.coords.longitude
    }
    googleMap.panTo(coordinates)
    googleMap.setZoom(Math.max(16, googleMap.getZoom() || 15))

    if (currentLocationMarker) {
      currentLocationMarker.position = coordinates
      currentLocationMarker.map = googleMap
    } else {
      const markerContent = document.createElement('span')
      markerContent.className = 'current-location-dot'
      markerContent.setAttribute('aria-hidden', 'true')
      currentLocationMarker = new CurrentLocationMarker({
        map: googleMap,
        position: coordinates,
        title: '目前位置',
        content: markerContent,
        zIndex: 1000
      })
    }

    showLocationMessage('已定位到目前位置。')
  } catch (error) {
    if (error?.code === 1) {
      showLocationMessage('請開啟裝置 GPS／定位服務，並允許瀏覽器存取此網站的位置。')
    } else if (error?.code === 2) {
      showLocationMessage('無法取得位置，請確認裝置 GPS／定位服務已開啟後重試。')
    } else if (error?.code === 3) {
      showLocationMessage('定位逾時，請檢查 GPS／定位服務是否開啟後重試。')
    } else {
      showLocationMessage('定位失敗，請檢查 GPS 是否開啟，並確認瀏覽器已允許此網站使用位置。')
    }
  } finally {
    isLocating.value = false
  }
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
      content: pin,
      gmpClickable: true
    })
    marker.addEventListener('gmp-click', () => {
      selectMockPlace(place.id)
      googleMap.panTo(place.coordinates)
    })
    return marker
  })
}

function drawFavoriteMarkers() {
  favoriteMarkers.forEach(marker => { marker.map = null })
  favoriteMarkers = []
  if (!googleMap || !SearchMarkerElement) return
  favoriteMarkers = savedPlaces.value
    .filter(place => place.coordinates && Number.isFinite(place.coordinates.lat) && Number.isFinite(place.coordinates.lng))
    .map(place => {
      const pin = FavoritePinElement ? new FavoritePinElement({
        background: '#0d6961',
        borderColor: '#fffdf9',
        glyphColor: '#fff',
        glyphText: '★',
        scale: 1.05
      }) : undefined
      return new SearchMarkerElement({
        map: googleMap,
        position: place.coordinates,
        title: place.displayName,
        ...(pin ? { content: pin } : {})
      })
    })
}

watch(savedPlaces, drawFavoriteMarkers, { deep: true })

watch(() => favoriteStore.state.items, () => {
  if (Place) refreshExpiredFavoriteDetails()
}, { deep: true })

watch([visiblePlaces, selectedPlaceId], () => {
  if (!googleMap) return
  const place = places.find(item => item.id === selectedPlaceId.value)
  if (place) googleMap.panTo(place.coordinates)
})

onMounted(async () => {
  void favoriteStore.hydrate()
  viewportMeta = document.querySelector('meta[name="viewport"]')
  originalViewportContent = viewportMeta?.content
  if (viewportMeta) {
    viewportMeta.content = 'width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no'
  }

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
    CurrentLocationMarker = AdvancedMarkerElement
    SearchMarkerElement = AdvancedMarkerElement
    FavoritePinElement = PinElement

    googleMap = new Map(mapElement.value, {
      center: mapCenter,
      zoom: 15,
      mapId: import.meta.env.VITE_GOOGLE_MAPS_MAP_ID || 'DEMO_MAP_ID',
      clickableIcons: false,
      fullscreenControl: false,
      mapTypeControl: false,
      streetViewControl: false
    })
    try {
      const placesLibrary = await maps.importLibrary('places')
      AutocompleteSuggestion = placesLibrary.AutocompleteSuggestion
      AutocompleteSessionToken = placesLibrary.AutocompleteSessionToken
      Place = placesLibrary.Place
      googleMap.setOptions({ clickableIcons: true })
      mapPoiClickListener = googleMap.addListener('click', handleGoogleMapClick)
      void favoriteStore.hydrate().then(refreshExpiredFavoriteDetails)
    } catch {
      // Places 不可用時仍保留底圖與既有地圖互動，並停用無法載入卡片的底圖 POI。
    }
    drawGoogleMarkers(AdvancedMarkerElement, PinElement)
    drawFavoriteMarkers()
    mapState.value = 'ready'
    void locateCurrentPosition()
  } catch (error) {
    mapState.value = 'error'
    mapMessage.value = error instanceof Error ? error.message : 'Google 地圖載入失敗。'
  }
})

onUnmounted(() => {
  if (viewportMeta && originalViewportContent) viewportMeta.content = originalViewportContent
  viewportMeta = null
  originalViewportContent = undefined
  window.clearTimeout(locationMessageTimer)
  window.clearTimeout(autocompleteTimer)
  autocompleteRequestId += 1
  mapPoiClickListener?.remove()
  mapPoiClickListener = null
  if (searchMarker) searchMarker.map = null
  searchMarker = null
  googleMarkers.forEach(marker => { marker.map = null })
  googleMarkers = []
  favoriteMarkers.forEach(marker => { marker.map = null })
  favoriteMarkers = []
  if (currentLocationMarker) currentLocationMarker.map = null
  currentLocationMarker = null
  googleMap = null
})
</script>

<template lang="pug">
main.map-home
  section.app-frame(aria-label="食旅地圖首頁視覺原型")
    header.map-header(:class="{ 'map-header-page': activeTab !== 'map' }")
      .brand-row(v-if="activeTab === 'map'")
        button.brand-home-button(type="button" aria-label="重新整理食旅地圖" title="重新整理網站" @click="refreshSite")
          .brand-mark(aria-hidden="true") 路
        .search-area
          label.search-box
            span.search-icon(aria-hidden="true") ⌕
            input(
              v-model="searchQuery"
              type="search"
              placeholder="搜尋店家或地址"
              aria-label="搜尋店家或地址"
              role="combobox"
              aria-autocomplete="list"
              :aria-expanded="searchSuggestions.length > 0 || isSearching || Boolean(searchMessage)"
              aria-controls="place-search-results"
              @input="updateSearchSuggestions"
              @keydown.esc="closeSearchSuggestions"
            )
          .search-suggestions(
            v-if="searchSuggestions.length || isSearching || searchMessage"
            id="place-search-results"
            role="listbox"
          )
            button.search-suggestion(
              v-for="(item, index) in searchSuggestions"
              :key="`${item.text}-${index}`"
              type="button"
              role="option"
              @click="selectSearchSuggestion(item)"
            )
              span.suggestion-icon(aria-hidden="true") ⌖
              span {{ item.text }}
            p.search-feedback(v-if="isSearching" role="status") 搜尋中…
            p.search-feedback(v-else-if="searchMessage" role="status") {{ searchMessage }}

      .page-header(v-else)
        h1 {{ activeTab === 'favorites' ? '我的最愛' : '旅遊日誌' }}
        span(v-if="activeTab === 'favorites'") {{ savedPlaceCount }} 個收藏地點

      .filter-row(v-if="activeTab === 'map'" aria-label="地圖篩選")
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

    section.map-canvas(v-show="activeTab === 'map'" aria-label="大阪難波地圖")
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
        @click="selectMockPlace(place.id)"
      )
        span.marker-bubble
          span {{ place.icon }}
        span.marker-name {{ place.name }}

      p.location-message(v-if="locationMessage" role="status" aria-live="polite") {{ locationMessage }}

      button.location-button(
        type="button"
        :aria-label="isLocating ? '正在取得目前位置' : '定位到目前位置'"
        :title="isLocating ? '正在定位…' : '定位到目前位置'"
        :disabled="isLocating"
        @click="locateCurrentPosition"
      )
        svg.location-icon(
          :class="{ locating: isLocating }"
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        )
          path.location-crosshair(d="M12 2v3M12 19v3M2 12h3M19 12h3")
          circle.location-ring(cx="12" cy="12" r="7.5")
          circle.location-center(cx="12" cy="12" r="2")

      article.place-card(v-if="hasSelectedPlace" :class="{ 'poi-action-card': selectedMapPoi }")
        button.close-card(type="button" aria-label="關閉地點卡片" @click="closePlaceCard") ×
        .place-thumb(v-if="!selectedMapPoi" :class="activePlace.tone" aria-hidden="true")
          span {{ searchedPlace ? '地' : activePlace.kind === 'food' ? '麵' : '旅' }}
        .place-card-content
          .place-heading
            div
              span.place-kicker {{ selectedPlaceKicker }}
              h2 {{ activePlace.name }}
            button.bookmark-button(
              v-if="!selectedMapPoi"
              type="button"
              :class="{ saved: selectedPlaceIsSaved }"
              :aria-label="selectedPlaceIsSaved ? '取消收藏此地點' : '收藏此地點'"
              @click="toggleSearchedPlaceSaved"
            ) {{ selectedPlaceIsSaved ? '◆' : '◇' }}
          p {{ selectedPlaceDetail }}
          .place-actions(:class="{ 'single-action': selectedMapPoi }")
            button.secondary-action(v-if="!selectedMapPoi" type="button") 查看詳情
            button.primary-action(
              type="button"
              :disabled="Boolean(selectedMapPoi && (selectedPlaceIsSaved || isSavingFavorite))"
              @click="handlePlacePrimaryAction"
            ) {{ isSavingFavorite && selectedMapPoi ? '加入中…' : selectedPlaceAction }}

    section.favorites-page(v-if="activeTab === 'favorites'" aria-label="收藏地點列表")
      p.favorites-notice(v-if="favoriteApiState === 'ready'") 收藏清單由 API 同步；D1 只保存 Place ID。地點名稱、地址、座標、電話與你的自訂名稱／備註保存在此瀏覽器，資料超過 30 天後會在下次使用時重新查詢。
      p.favorites-notice(v-else-if="favoriteApiState === 'loading'") 正在載入收藏清單…
      p.favorites-notice(v-else) 目前顯示此瀏覽器上次快取的收藏；API 無法連線，變更不會成功。
      .favorites-list(v-if="savedPlaces.length")
        article.favorite-item(v-for="place in savedPlaces" :key="place.id")
          .favorite-thumb(:class="place.kind === 'poi' ? 'teal' : 'coral'" aria-hidden="true")
            span {{ place.kind === 'poi' ? '地' : '⌖' }}
          .favorite-item-content
            span.favorite-kicker {{ place.kind === 'poi' ? 'Google 地圖地標' : '搜尋地點' }}
            template(v-if="editingFavoriteId === place.id")
              input.favorite-edit-input(v-model="editFavoriteName" type="text" maxlength="255" placeholder="輸入自訂名稱" aria-label="自訂收藏名稱")
              input.favorite-edit-input(v-model="editFavoriteAddress" type="text" maxlength="1000" placeholder="輸入自訂地址或備註" aria-label="自訂收藏地址或備註")
              textarea.favorite-edit-input(v-model="editFavoriteNote" maxlength="5000" placeholder="記下你的心得或日記" aria-label="個人地點日記")
              p.favorite-edit-hint 自訂名稱與地址只保存於此瀏覽器，不會寫入後端。
              .favorite-edit-actions
                button.favorite-details-button(type="button" @click="saveFavoriteLabels(place)") 儲存
                button.favorite-details-button(type="button" @click="cancelFavoriteEdit") 取消
            template(v-else)
              button.favorite-name-button(type="button" title="點擊編輯收藏名稱" @click="beginFavoriteEdit(place)") {{ place.displayName }}
              p(v-if="place.displayAddress") {{ place.displayAddress }}
              p(v-else-if="place.coordinates") {{ place.coordinates.lat.toFixed(5) }}, {{ place.coordinates.lng.toFixed(5) }}
              p(v-else) Place ID：{{ place.id }}
              p(v-if="place.phone") 電話：{{ place.phone }}
              p(v-if="place.personalNote") {{ place.personalNote }}
              button.favorite-details-button(type="button" :disabled="!Place || loadingFavoriteIds.has(place.id) || place.detailsRefreshFailures >= 2" @click="refreshFavoriteDetails(place)")
                | {{ loadingFavoriteIds.has(place.id) ? '更新中…' : place.detailsRefreshFailures >= 2 ? '已停止查詢（失敗 2 次）' : '重新查詢地點資料' }}
          button.remove-favorite(type="button" :aria-label="`移除 ${place.displayName} 收藏`" @click="removeSavedPlace(place.id)") 移除
      .favorites-empty(v-else)
        span.favorites-empty-icon(aria-hidden="true") ♢
        h2 還沒有收藏地點
        p 在地圖上點選地標，再加入收藏，就會出現在這裡。
        button.return-map-button(type="button" @click="openTab('map')") 回到地圖

    section.favorites-page.journal-placeholder(v-else-if="activeTab === 'journal'" aria-label="旅遊日誌")
      .favorites-empty
        span.favorites-empty-icon(aria-hidden="true") ▤
        h2 旅遊日誌尚未開放
        p 日誌功能會在打卡與旅程整理流程完成後加入。
        button.return-map-button(type="button" @click="openTab('map')") 回到地圖

    nav.bottom-nav(aria-label="主要導覽")
      button.nav-item(type="button" :class="{ active: activeTab === 'map' }" @click="openTab('map')")
        span.nav-icon(aria-hidden="true") ●
        span 地圖
      button.nav-item(type="button" :class="{ active: activeTab === 'favorites' }" @click="openTab('favorites')")
        span.nav-icon(aria-hidden="true") ♢
        span 收藏
        span.nav-count(v-if="savedPlaceCount") {{ savedPlaceCount }}
      button.nav-item(type="button" :class="{ active: activeTab === 'journal' }" @click="openTab('journal')")
        span.nav-icon(aria-hidden="true") ▤
        span 日誌

  aside.prototype-note
    span.prototype-tag VISUAL PROTOTYPE
    h2 先把旅行的期待，放進地圖裡。
    p 使用 Google 地圖底圖與合成地點標記；收藏已可保存並在地圖標記，打卡與日誌仍待串接。
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
  background: var(--eatgomap-header-background)
  color: white

.map-header-page
  padding-top: 12px
  padding-bottom: 12px

.page-header
  display: flex
  align-items: baseline
  justify-content: space-between
  min-height: 36px

.page-header h1
  margin: 0
  font-size: 18px
  font-weight: 900

.page-header span
  color: rgba(255,255,255,.78)
  font-size: 12px

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

.search-area
  position: relative
  flex: 1
  min-width: 0

.search-area .search-box
  width: 100%

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

.search-suggestions
  position: absolute
  z-index: 40
  top: calc(100% + 7px)
  left: 0
  right: 0
  display: grid
  max-height: min(45dvh, 320px)
  overflow-y: auto
  padding: 6px
  border: 1px solid rgba(21, 37, 35, .1)
  border-radius: 15px
  background: #fffdf9
  box-shadow: 0 12px 28px rgba(4, 48, 44, .22)
  color: var(--egm-ink)

.search-suggestion
  display: flex
  align-items: center
  gap: 10px
  min-height: 44px
  padding: 8px 10px
  border: 0
  border-radius: 10px
  background: transparent
  color: inherit
  text-align: left
  font: inherit
  font-size: 13px
  cursor: pointer

.search-suggestion:hover,
.search-suggestion:focus-visible
  outline: 0
  background: #e8f2ef

.suggestion-icon
  flex: 0 0 auto
  color: var(--egm-green-700)
  font-size: 18px

.search-feedback
  margin: 0
  padding: 10px
  color: var(--egm-muted)
  font-size: 12px

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

.favorites-page
  min-height: 0
  overflow-y: auto
  padding: 14px 14px 24px
  background: #f7f4ed

.favorites-notice
  margin: 0 0 12px
  padding: 10px 12px
  border-radius: 12px
  background: #e5f1ee
  color: #386c66
  font-size: 11px
  line-height: 1.6

.favorites-list
  display: grid
  gap: 10px

.favorite-item
  display: grid
  grid-template-columns: 54px minmax(0, 1fr) auto
  align-items: center
  gap: 10px
  padding: 11px
  border: 1px solid rgba(35,48,44,.08)
  border-radius: 17px
  background: #fffdf9
  box-shadow: 0 5px 14px rgba(35,48,44,.07)

.favorite-thumb
  width: 54px
  height: 54px
  display: grid
  place-items: center
  border-radius: 14px
  background: linear-gradient(145deg, #8bc9b7, #16776d)
  color: white
  font-size: 24px
  font-weight: 900

.favorite-thumb.coral
  background: linear-gradient(145deg, #f1a27e, #ca5841)

.favorite-item-content
  min-width: 0

.favorite-kicker
  color: var(--egm-green-700)
  font-size: 10px
  font-weight: 900

.favorite-item-content h2
  overflow: hidden
  margin: 3px 0
  color: var(--egm-ink)
  font-size: 14px
  text-overflow: ellipsis
  white-space: nowrap

.favorite-name-button
  display: block
  max-width: 100%
  overflow: hidden
  margin: 3px 0
  padding: 0
  border: 0
  background: transparent
  color: var(--egm-ink)
  font: inherit
  font-size: 14px
  font-weight: 900
  text-align: left
  text-overflow: ellipsis
  white-space: nowrap
  cursor: pointer

.favorite-item-content p
  overflow: hidden
  margin: 0
  color: var(--egm-muted)
  font-size: 10px
  text-overflow: ellipsis
  white-space: nowrap

.favorite-details-button
  margin-top: 4px
  padding: 0
  border: 0
  background: transparent
  color: var(--egm-green-700)
  font: inherit
  font-size: 10px
  font-weight: 800
  cursor: pointer

.favorite-details-button:disabled
  opacity: .5
  cursor: not-allowed

.favorite-edit-input
  display: block
  width: 100%
  min-width: 0
  margin-top: 5px
  padding: 6px 8px
  border: 1px solid #c8d9d3
  border-radius: 8px
  background: white
  color: var(--egm-ink)
  font: inherit
  font-size: 11px

.favorite-edit-hint
  margin: 5px 0 0 !important
  color: var(--egm-muted)
  font-size: 9px !important
  line-height: 1.4
  white-space: normal !important

.favorite-edit-actions
  display: flex
  gap: 10px

.remove-favorite
  padding: 7px 8px
  border: 0
  border-radius: 9px
  background: #f6e9e3
  color: #a74f3c
  font: inherit
  font-size: 10px
  font-weight: 800
  cursor: pointer

.favorites-empty
  display: grid
  justify-items: center
  align-content: center
  min-height: 260px
  padding: 20px
  color: var(--egm-muted)
  text-align: center

.favorites-empty-icon
  display: grid
  place-items: center
  width: 56px
  height: 56px
  border-radius: 18px
  background: #e5f1ee
  color: var(--egm-green-700)
  font-size: 28px

.favorites-empty h2
  margin: 14px 0 6px
  color: var(--egm-ink)
  font-size: 16px

.favorites-empty p
  max-width: 230px
  margin: 0 0 14px
  font-size: 12px
  line-height: 1.6

.return-map-button
  padding: 9px 18px
  border: 1px solid var(--egm-green-700)
  border-radius: 999px
  background: white
  color: var(--egm-green-700)
  font: inherit
  font-size: 12px
  font-weight: 900
  cursor: pointer

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

.location-button:disabled
  cursor: wait
  opacity: .76

.location-icon
  width: 22px
  height: 22px
  display: block
  fill: none
  stroke: var(--egm-green-700)
  stroke-linecap: round
  stroke-width: 1.8

.location-center
  fill: var(--egm-green-700)
  stroke: none

.location-icon.locating
  animation: locating-pulse 900ms ease-in-out infinite alternate

@keyframes locating-pulse
  from
    opacity: .4
    transform: scale(.82)
  to
    opacity: 1
    transform: scale(1.08)

.location-message
  position: absolute
  z-index: 12
  top: 128px
  left: 50%
  width: min(calc(100% - 32px), 340px)
  margin: 0
  padding: 11px 14px
  border: 1px solid rgba(13,105,97,.16)
  border-radius: 14px
  background: rgba(255,253,249,.97)
  box-shadow: 0 8px 22px rgba(31,46,42,.18)
  color: var(--egm-ink)
  font-size: 12px
  font-weight: 700
  line-height: 1.5
  text-align: center
  transform: translateX(-50%)

.current-location-dot
  width: 22px
  height: 22px
  display: block
  border: 3px solid white
  border-radius: 50%
  background: #4285f4
  box-shadow: 0 1px 5px rgba(22,52,92,.55), 0 0 0 5px rgba(66,133,244,.2)

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

.place-card.poi-action-card
  grid-template-columns: minmax(0, 1fr)

.place-actions.single-action
  grid-template-columns: minmax(0, 1fr)

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
  position: relative
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

.nav-count
  position: absolute
  top: 3px
  right: calc(50% - 26px)
  min-width: 15px
  padding: 1px 4px
  border-radius: 999px
  background: var(--egm-green-700)
  color: white
  font-size: 9px
  line-height: 1.4

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
    background: var(--eatgomap-header-background)

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
