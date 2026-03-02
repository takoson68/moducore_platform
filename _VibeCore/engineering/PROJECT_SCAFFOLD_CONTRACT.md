# 專案骨架 Contract

本文件定義「建立一個符合本平台的新專案」所需的最小合法骨架。

目的：
- 讓新專案可被平台 world / boot / router 正常載入
- 讓新專案從一開始就符合模組邊界、auth pattern、資料責任與工程治理
- 避免建立新專案時再次走回臨時拼裝與局部補丁

---

## 1. 最小目錄骨架

新專案至少應包含：

- `projects/<project-name>/project.config.js`
- `projects/<project-name>/layout/`
- `projects/<project-name>/layout/index.js`
- `projects/<project-name>/layout/LayoutRoot.vue`
- `projects/<project-name>/modules/`
- `projects/<project-name>/modules/index.js`
- `projects/<project-name>/styles/sass/main.sass`

依需求選配：

- `projects/<project-name>/components/`
- `projects/<project-name>/services/`
- `projects/<project-name>/docs/`

---

## 2. `project.config.js` Contract

至少必須輸出：

```js
export default {
  name: '<project-name>',
  title: '<Project Title>',
  tenant_id: '<tenant-id>',
  modules: []
}
```

建議欄位：

- `description`
- `scenario`
- `skills`
- `constraints`

規則：

- `name` 必須與 `VITE_PROJECT` 對應
- `tenant_id` 必須與後端登入 tenant 一致
- `modules` 必須列出實際啟用模組
- `scenario` 不得描述過期狀態
- `constraints` 應明確寫出此專案的局部工程限制

---

## 3. Layout Contract

`layout/index.js` 必須提供：

```js
import LayoutRoot from './LayoutRoot.vue'

export function defineLayout() {
  return {
    id: '<project-layout-id>',
    component: LayoutRoot
  }
}
```

`LayoutRoot.vue` 的責任：

- 承接 root router children 的顯示
- 放置 topbar / sidebar / shell 結構
- 如有權限導頁需求，僅作為 route access 的承接點，不另立第二份 auth 真相來源

禁止事項：

- 不得在 layout 自行重建登入系統
- 不得在 layout 直接定義模組資料契約
- 不得在 layout 繞過 route/meta 系統手刻另一套完整導航規則

---

## 4. Modules Registry Contract

`projects/<project-name>/modules/index.js` 必須是模組收集與安裝唯一入口。

至少必須提供：

- `moduleLoaders`
- `loadModules()`
- `listModules()`
- `installModules()`

建議補齊：

- `_archive` 過濾
- `ui.slots` 註冊支援
- `buildModuleRoutes()` 觀測出口

規則：

- 掃描方式應維持同層 `./*/index.js`
- `listModules()` 只回報模組名單，不載入副作用
- `installModules()` 只做宣告式掛載，不做初始化流程控制
- 模組掛入必須經 `register.store()` / `register.routes()` / `world.registerUISlot()`

---

## 5. Auth Contract

若新專案沿用平台既有登入機制，必須滿足：

- 前端登入真相來源只有一個：`authStore`
- `login / restoreSession / logout` 全部走 `world.authApi()`
- route guard 與 auth UI 只依賴 `authStore`
- 不得建立 project-local auth truth
- 若需要 `role / company_id / name`，應先補後端 `/api/login` 與 `/api/session` payload

`authStore.user` 最小身份欄位應至少包含：

- `id`
- `username`
- `name`
- `role`
- `company_id`

若專案需要租戶資訊，建議同時包含：

- `tenant_id`

專案層 auth service 可以存在，但只允許做輕量封裝，例如：

- loading / error 狀態
- `authStore.user` 的 computed 映射

不允許：

- 另打一條 project-specific session API 來決定是否登入
- 以第二份 reactive state 覆蓋 `authStore`

---

## 6. Module Contract

每個模組都必須符合：

- 有自己的 `index.js`
- 預設輸出 `{ name, setup }`
- routes / store / service / api 落在模組自己的目錄內

詳細規格：

- 參考 [`MODULE_TEMPLATE_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md)

---

## 7. 資料責任 Contract

新專案的資料邊界必須滿足：

- module-specific endpoint / payload / response mapping 收斂在模組或 project-local API 邊界
- 不得為單一專案需求修改 `platform/frontend/src/` 共享 API helper
- 共享層只承載跨專案 transport 能力，不承載單一模組資料語意

若要新增共享能力：

- 必須先留下工程提案、friction 或演化記錄

---

## 8. 導覽與 Route Access Contract

新專案應以 route meta 作為導覽與可見性的主要來源。

至少必須滿足：

- 每條 route 都有 `meta.access`
- 導覽顯示優先來自 route meta / nav projection
- route access 與 sidebar / topbar / page gate 不能互相矛盾

若有角色或公司級限制：

- 應集中在同一套 route access 規則
- 不得分散成 route 一套、sidebar 一套、page 一套
- 應建立 project-local route access helper，統一解讀 route meta 的擴充欄位
- route meta 若需承載角色 / 公司限制，必須使用單一擴充欄位來源，不得在多個檔案各自發明命名

建議標準擴充欄位：

```js
meta: {
  access: {
    public: false,
    auth: true
  },
  identityAccess: {
    roles: ['employee'],
    includeCompanies: [],
    excludeCompanies: ['company-b']
  }
}
```

規則：

- `identityAccess` 必須與 `access` 同級
- `roles` 用於角色限制
- `includeCompanies` 用於白名單公司限制
- `excludeCompanies` 用於黑名單公司限制
- 同一專案內不得再發明第二套語意相同的命名

---

## 9. 後端對齊 Contract

新專案建立後，至少要能驗證：

- `/api/login` 可在該 tenant 下登入
- `/api/session` 可還原身份
- 首屏 API 不會在登入後第一跳就 401 並把使用者自動登出
- 若平台帳號主表是 `users`，新專案不得私造平行帳號模型繞開平台

---

## 10. 文件 Contract

新專案落地時，至少應同步完成：

- 必要的 `project.config.js` 描述
- `docs/` 內的 phase / plan / gap report（若任務需要）
- 新 friction 記錄到正確位置

不允許：

- 已知問題只存在對話裡，不落文件
- 把單一專案名稱寫成平台規範本體

---

## 11. 驗證清單

新專案建立完成後，至少應驗證：

1. `VITE_PROJECT=<project-name>` 可正確載入專案
2. `world.start()` 可完成 boot
3. modules 可被 discover / install / register
4. router 可載入 layout 與模組 children
5. 未登入與已登入狀態下導覽一致
6. build 可成功完成

---

## 12. AI 指令模板

```md
請依 `_VibeCore/engineering/PROJECT_SCAFFOLD_CONTRACT.md` 建立新專案 `<project-name>`，並一次完成：

1. 建立 project 最小骨架
2. 建立 `project.config.js`
3. 建立 `layout/` 與 `modules/index.js`
4. 建立至少一個符合 contract 的示範模組
5. 確保 auth pattern 使用平台 `authStore + world.authApi()`
6. 確保模組資料需求不回推共享層
7. 更新必要文件並驗證 build
```
