export default {
  name: 'eatGoMap',
  title: '食旅共享地圖與日誌',
  tenant_id: 'eatGoMap',
  modules: ['map-home'],
  description: '供兩位專案成員共同收藏地點、建立打卡紀錄，並將足跡整理為美食與旅遊日誌的私人前端 Project。',
  scenario: '以手機為主要使用情境，從地圖探索或搜尋地點，保存共同收藏、個人打卡、評分、評論與照片，再將打卡紀錄組合成旅程足跡與日誌。',
  skills: [],
  capabilities: ['map-home-visual-prototype', 'google-maps-javascript-api'],
  constraints: [
    '首頁使用 Google Maps JavaScript API 顯示大阪難波底圖與合成地點標記；Key 由本機 .env.local 提供，分享或部署前須限制 API 與允許來源。',
    '目前不串接定位、後端 API 或照片服務。',
    '前端預計部署於 ModuCore 的前端環境，後端由合作開發者以獨立伺服器提供 API。',
    '前端不得直接存取後端資料庫，所有後端事實一律透過 API 交換。',
    '第一階段優先規劃地圖、地點收藏與打卡；旅遊日誌於後續階段實作。'
  ],
  assumptions: [
    '初期僅供兩位已知成員私人使用，正式身分驗證與多人權限可延後設計。',
    'Google Maps JavaScript API 已選作首頁底圖；地點搜尋、照片儲存服務與後端 API 契約尚未定案。',
    '目前畫面資料皆為合成假資料，不代表外部地點或後端現況。'
  ]
}
