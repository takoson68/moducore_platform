export default {
  name: 'dineCore',
  title: 'DineCore',
  tenant_id: 'dineCore',
  modules: [
    'entry',
    'menu',
    'cart',
    'checkout',
    'order-tracker',
    'counter',
    'counter-map',
    'kitchen',
    'dashboard',
    'reports',
    'visitor-stats',
    'audit-close',
    'menu-admin',
    'table-admin',
    'restaurant-map-editor'
  ],
  description: '以餐廳手機點餐為核心，並提供櫃台、廚房、營運管理等後台工作流程的前端專案。',
  scenario: '顧客以桌邊固定桌號入口進入點餐流程；商家以櫃台、廚房、店長後台處理訂單、商品與桌位管理。',
  skills: [],
  constraints: [
    '模組資料共享必須走 API 邊界，不得讓 project-level services 成為跨模組業務中心，也不得把 world.store 當成共享事實來源。',
    '顧客端以手機操作為優先，但目前提供 web 內容容器；商家端以桌機或平板工作台為主，並依員工角色限制可進入頁面。'
  ]
}

