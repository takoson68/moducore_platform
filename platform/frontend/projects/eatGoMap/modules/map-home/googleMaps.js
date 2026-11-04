let mapsApiPromise

export function loadGoogleMaps(apiKey) {
  if (!apiKey) return Promise.reject(new Error('請在 platform/frontend/.env.local 設定 VITE_GOOGLE_MAPS_API_KEY。'))
  if (window.google?.maps?.importLibrary) return Promise.resolve(window.google.maps)
  if (mapsApiPromise) return mapsApiPromise

  mapsApiPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    const callbackName = 'eatGoMapGoogleMapsLoaded'
    const params = new URLSearchParams({
      key: apiKey,
      loading: 'async',
      v: 'weekly',
      language: 'zh-TW',
      region: 'JP',
      callback: callbackName
    })

    window[callbackName] = () => {
      delete window[callbackName]
      resolve(window.google.maps)
    }
    script.async = true
    script.src = `https://maps.googleapis.com/maps/api/js?${params}`
    script.dataset.eatgomapGoogleMaps = 'true'
    script.onerror = () => {
      delete window[callbackName]
      mapsApiPromise = undefined
      reject(new Error('Google Maps API 載入失敗，請檢查 API Key、API 啟用狀態與網路連線。'))
    }
    document.head.append(script)
  })

  return mapsApiPromise
}
