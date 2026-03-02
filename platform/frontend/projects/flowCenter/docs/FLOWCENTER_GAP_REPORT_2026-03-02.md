# flowCenter 與平台規則差異報告

Date: 2026-03-02
Scope: `projects/flowCenter`
Baseline:
- `_VibeCore/engineering/NEW_PROJECT_CHECKLIST.md`
- `_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md`
- `_VibeCore/new_engineering/conventions/AC-WC-project-auth-single-source-pattern.md`
- `_VibeCore/new_engineering/conventions/AD-WC-module-registry-boot-pipeline.md`

本文件只整理差異，
不直接執行重構。

Update:
- 2026-03-02 晚間已依本報告執行第 1、2、4、5 項建議修正。
- 第 3 項已由平台裁決改為正式承認 `world.createStore()`，因此不再視為 flowCenter 缺口。

---

## 判定摘要

`flowCenter` 目前屬於「部分符合」。

已符合：
- 模組資料需求大致已收回各模組自己的 `api/`、`service.js`、`store.js`
- auth 真相來源已收斂回平台 `authStore`
- 模組預設輸出大致符合 `{ name, setup }` contract

主要差異：
- route access 與實際權限規則曾經不一致，現已修正
- 導覽邏輯曾繞過平台 route/meta/nav projection，現已修正
- 模組 store 建立方式已由平台裁決統一為 `world.createStore()`
- `modules/index.js` 曾與平台標準 registry pipeline 有小幅落差，現已補齊主要能力面

---

## 差異 1：Route Access 與實際權限規則分裂

Status: Resolved in code

Severity: High

現況：
- 多數 `flowCenter` 模組 route 宣告為 `public: true, auth: true`
- 但實際上頁面是否可見、可操作，卻依賴 sidebar 與 store 內的 role 判斷

證據：
- [approval/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/approval/routes.js)
- [leave/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/leave/routes.js)
- [purchase/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/purchase/routes.js)
- [task/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/task/routes.js)
- [FlowSidebar.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/components/FlowSidebar.vue)

為何不符合：
- checklist 要求「導覽與可見性應由 route meta 與平台既有可見性機制推導」
- 目前 route 說可以公開進入，但 sidebar/store 又說需要登入或特定角色
- 這代表 route guard、導覽、頁面行為不是同一份規則

風險：
- 未登入者可直接進入本不該公開的 URL
- manager / employee 權限邏輯分散在 route、sidebar、store 三處
- 後續新增角色時容易漏改某一層

建議方向：
- 重新定義各模組 route 的 `meta.access`
- 讓 route guard 先擋掉不合法路徑
- sidebar 只消費 route/meta projection，不再自行重建一份權限矩陣

處理結果：
- 已為 `leave / purchase / approval` 補上 `identityAccess`
- 已將需要登入的模組 route 改為 `public: false, auth: true`
- 已在 layout 層加入 route access fallback redirect

---

## 差異 2：Sidebar 導覽繞過平台 Nav Projection

Status: Resolved in code

Severity: High

現況：
- `FlowSidebar.vue` 沒有使用 route bucket 與 `resolveNavProjection`
- 它直接讀 `projectConfig.modules`，再手刻一份 `moduleMetaMap` 與角色判斷

證據：
- [FlowSidebar.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/components/FlowSidebar.vue)

為何不符合：
- 平台標準 pipeline 是：
  `module routes -> register.routes() -> __MODULE_ROUTES__ -> resolveNavProjection() -> sidebar/topbar`
- `flowCenter` 目前是：
  `projectConfig.modules -> 手刻 label/path -> 手刻 role filter -> sidebar`

風險：
- route meta 與 sidebar 導覽資料源分裂
- 模組若調整 path / nav / parent / order，sidebar 不會自動同步
- 未來若增加 topbar nav 或巢狀路由，手刻 map 很容易失真

建議方向：
- `FlowSidebar.vue` 改用 `world.service('resolveNavProjection')`
- 導覽資料應從 `window.__MODULE_ROUTES__` 投影而來
- 權限可見性應以 route access 為主，少量 project rule 再做補充，而不是整份重寫

處理結果：
- `FlowSidebar.vue` 已改為吃 route bucket + `resolveNavProjection()`
- `FlowTopbar.vue` 也已改用 route meta/title/description 與 topbar nav projection

---

## 差異 3：Store 建立方式與模組樣板 Contract 不一致

Severity: Medium

現況：
- `flowCenter` 模組 store 多數使用 `world.createStore(...)`
- 目前模組樣板 contract 已回修為統一使用 `world.createStore()`

證據：
- [announcement/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/announcement/store.js)
- [dashboard/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/dashboard/store.js)
- [leave/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/leave/store.js)
- [purchase/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/purchase/store.js)
- [task/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/task/store.js)
- [approval/store.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/approval/store.js)

目前裁決：
- 平台正式保留 `world.createStore()`，並統一以 world 作為模組 store 建立入口

處理結果：
- 已回修 `_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md`
- `flowCenter` 目前在此項視為符合

---

## 差異 4：`modules/index.js` 尚未完全對齊標準 Registry 能力面

Status: Resolved in code

Severity: Medium

現況：
- `flowCenter/modules/index.js` 已具備 loader / list / install 基本能力
- 但相較平台目前較完整的 registry pattern，仍缺少：
  - `_archive` 過濾
  - `ui.slots` 註冊支援
  - `buildModuleRoutes()` 類型的觀測出口

證據：
- [modules/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/index.js)

為何不符合：
- 不是完全違規，但和目前抽出的 registry pipeline 標準版相比仍有能力缺口

風險：
- 之後若 `flowCenter` 想使用 UI slot 掛入，registry 要再補
- 不同專案的 `modules/index.js` 能力面不一致，會增加新專案複製時的變異

建議方向：
- 將 `flowCenter/modules/index.js` 收斂到平台標準 registry pattern
- 至少補齊 `ui.slots` 註冊能力

處理結果：
- 已補 `_archive` 過濾
- 已補 `ui.slots` 註冊支援
- 已補 `buildModuleRoutes()` 觀測出口

---

## 差異 5：Topbar 標題與模組語意未使用 Route Meta

Status: Resolved in code

Severity: Low

現況：
- `FlowTopbar.vue` 用 `pageTitleMap` 手動依 path 對應標題

證據：
- [FlowTopbar.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/components/FlowTopbar.vue)

為何不符合：
- 雖然目前可用，但這又是一份獨立的 path-to-title 對照表
- 若未來 route label 變更，topbar 不會自動同步

建議方向：
- 優先從 route meta 或 nav projection 推導顯示標題

處理結果：
- `FlowTopbar.vue` 已由 route meta 的 `title` / `description` 推導頁面語意

---

## 建議處理順序

1. 先修 route access 與 sidebar/nav projection
2. 再決定 store 建立入口要統一到 `@/core` 還是回修文件
3. 最後補齊 `modules/index.js` 的 registry 能力面

## 不建議直接動手的部分

- 不建議先做大規模視覺改版
- 不建議先重寫所有 module store
- 不建議在尚未統一路由 access 前再加新角色規則

## 下一步候選

若要實作，建議先從最小範圍開始：

1. 只先重構 `FlowSidebar.vue`，改成吃 route/nav projection
2. 同步修正六個模組 `routes.js` 的 `meta.access`
3. 驗證未登入 / employee / manager 三種狀態下的 route 與導覽一致性
