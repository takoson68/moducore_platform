# 模組樣板 Contract

本文件定義新模組的最小合法骨架。

目的：
- 讓新模組可被 `modules/index.js` 收集
- 讓模組可被 `boot -> install -> register -> router` 正確掛入
- 避免模組把責任放錯層

---

## 1. 最小檔案集合

至少應建立：
- `modules/<module-name>/index.js`
- `modules/<module-name>/routes.js`
- `modules/<module-name>/pages/index.vue`

依需求選配：
- `modules/<module-name>/store.js`
- `modules/<module-name>/service.js`
- `modules/<module-name>/api/*.js`
- `modules/<module-name>/components/*`

## 2. `index.js` Contract

每個模組的預設輸出必須是：

```js
export default {
  name: '<module-name>',
  setup: {
    stores: {},
    routes,
    ui: {
      slots: {}
    }
  }
}
```

規則：
- `name` 必須與模組目錄名稱一致
- `setup` 只能放宣告式掛件
- `setup` 不得執行副作用
- `index.js` 不得直接抓資料、登入、操作 router、或操作 container instance

最小範例：

```js
import { routes } from './routes.js'

export default {
  name: 'announcement',
  setup: {
    routes
  }
}
```

含 store 範例：

```js
import { routes } from './routes.js'
import { createAnnouncementStore } from './store.js'

export default {
  name: 'announcement',
  setup: {
    stores: {
      announcementStore: createAnnouncementStore
    },
    routes
  }
}
```

## 3. `routes.js` Contract

`routes.js` 必須輸出陣列：

```js
export const routes = [
  {
    path: '/announcement',
    component: () => import('./pages/index.vue'),
    meta: {
      access: {
        public: false,
        auth: true
      },
      nav: [
        { area: 'sidebar', label: '公告管理', order: 20 }
      ]
    }
  }
]
```

規則：
- route 必須顯式提供 `component`
- `meta.access.public` 與 `meta.access.auth` 必須同時存在且為布林值
- `meta.nav` 應為陣列；若不想顯示導覽，可給空陣列
- 單頁模組預設禁止 `children`
- path 應使用絕對路徑

若模組有角色 / 公司級 access 限制，應統一使用單一擴充欄位，例如：

```js
meta: {
  access: {
    public: false,
    auth: true
  },
  identityAccess: {
    roles: ['manager'],
    includeCompanies: [],
    excludeCompanies: []
  }
}
```

規則：
- `access` 只負責公開 / 需登入 / 停用的粗粒度 gate
- `identityAccess` 只負責登入後的角色 / 公司限制
- `identityAccess` 必須與 `access` 同級
- 禁止在不同模組內各自發明不同命名來表達相同身份限制

## 4. `store.js` Contract

若模組有狀態，應由模組自己的 store 持有。

規則：
- 一律使用 `world.createStore(...)`
- 不得直接 import `@/app/*` 底層 store 實作
- store factory 必須輸出可被 `setup.stores` 註冊的函式

最小範例：

```js
import world from '@/world.js'

export function createAnnouncementStore() {
  return world.createStore({
    name: 'announcementStore',
    defaultValue: {
      loading: false,
      items: [],
      error: ''
    }
  })
}
```

## 5. `service.js` / `api/` Contract

規則：
- 模組資料需求優先放在模組自己的 `api/` 與 `service.js`
- `api/` 負責 transport 與 endpoint 呼叫
- `service.js` 負責資料整理、unwrap、錯誤語意轉換
- 不得為單一模組需求修改平台共享 API helper

推薦分工：
- `api/*.js`：`apiRequest(...)`
- `service.js`：`fetchX / createX / updateX`
- `store.js`：狀態與 actions

## 6. 掛入鏈 Contract

新模組必須符合這條合法掛入鏈：

1. `modules/<name>/index.js` 被 `modules/index.js` 的 glob 掃描到
2. `listModules()` 回報模組名稱
3. `boot()` 經 visibility 算出 `allowList`
4. `installModules()` 載入模組 default export
5. `setup.stores` 經 `register.store()` 註冊進 container
6. `setup.routes` 經 `register.routes()` 寫進 route bucket
7. router 由 `buildRoutes()` 將 bucket 組進 root children

任何新模組若不能走完這條鏈，就代表 contract 不完整。

## 7. 禁止事項

- 不得在模組 `index.js` 執行資料抓取
- 不得在模組 `index.js` 決定登入狀態
- 不得直接改 `window.__MODULE_ROUTES__`
- 不得直接改 root router children
- 不得直接操作 container instance 取代 `register.store()`
- 不得把 module-specific API 契約推進 `platform/frontend/src/`

## 8. AI 生成指令模板

```md
請建立新模組 `<module-name>`，並遵守 `_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md`：

1. 建立：
   - index.js
   - routes.js
   - pages/index.vue
   - store.js（若需要）
   - service.js / api/*（若需要）
2. `index.js` 必須輸出 `{ name, setup }`
3. route 必須帶 `meta.access` 與 `meta.nav`
4. store 必須使用 `world.createStore()`
5. 模組資料需求不得回推到平台共享層
6. 完成後更新對應 project.config.js，並驗證 build
```
