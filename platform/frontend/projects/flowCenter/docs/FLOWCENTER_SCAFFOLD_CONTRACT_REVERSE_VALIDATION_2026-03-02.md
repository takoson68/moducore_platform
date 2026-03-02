# flowCenter 對 `PROJECT_SCAFFOLD_CONTRACT` 的反向驗證

Date: 2026-03-02
Target:
- [`PROJECT_SCAFFOLD_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/_VibeCore/engineering/PROJECT_SCAFFOLD_CONTRACT.md)
Project:
- [`projects/flowCenter`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter)

目的：
- 驗證目前的專案骨架 contract 是否足以描述一個可落地的平台專案
- 驗證 `flowCenter` 是否能被這份 contract 合理解釋
- 找出 contract 本身仍缺少的條目

---

## 結論

目前 `PROJECT_SCAFFOLD_CONTRACT.md` 已足以覆蓋 `flowCenter` 約 90% 的實際結構與行為。

可被完整解釋的部分：
- project config
- layout 骨架
- modules registry
- auth single source
- module-local api / service / store 邊界
- route/meta/nav projection
- 後端登入與 session 對齊

本次反向驗證發現的一個主要缺口：
- contract 原本沒有明確寫出「角色 / 公司級 route access 應由 project-local helper 統一解讀」

此缺口已在同日補入 contract。

---

## 驗證結果

## 1. Project Config

Result: Pass

證據：
- [project.config.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/project.config.js)

說明：
- `name / title / tenant_id / modules` 完整
- `description / scenario / constraints` 也已補齊

## 2. Layout Contract

Result: Pass

證據：
- [layout/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/layout/index.js)
- [LayoutRoot.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/layout/LayoutRoot.vue)

說明：
- layout 正常承接 root children
- topbar / sidebar / shell 結構完整
- 權限導頁只承接 route access，不另立第二份 auth truth

## 3. Modules Registry Contract

Result: Pass

證據：
- [modules/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/index.js)

說明：
- 具備 `moduleLoaders / loadModules / listModules / installModules`
- 已補 `_archive` 過濾
- 已補 `ui.slots`
- 已補 `buildModuleRoutes()`

## 4. Auth Contract

Result: Pass

證據：
- [flowCenterAuthService.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/services/flowCenterAuthService.js)

說明：
- `login / restoreSession / logout` 全走 `world.authApi()`
- `isLoggedIn` 以 `authStore` 為真相來源
- 沒有 project-local auth truth

## 5. Module Contract

Result: Pass

證據：
- [dashboard/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/dashboard/index.js)
- [leave/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/leave/index.js)
- [purchase/index.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/purchase/index.js)

說明：
- 模組皆有自己的 `index.js`
- 預設輸出維持 `{ name, setup }`
- `api / service / store / routes / pages` 均落在模組目錄內

## 6. Data Responsibility Contract

Result: Pass

證據：
- [announcement/api/announcementApi.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/announcement/api/announcementApi.js)
- [leave/api/leaveApi.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/leave/api/leaveApi.js)
- [task/api/taskApi.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/task/api/taskApi.js)

說明：
- module-specific API 已留在模組自身
- 沒再回推到 `platform/frontend/src/`

## 7. Route / Nav / Access Contract

Result: Pass, with one contract refinement

證據：
- [FlowSidebar.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/components/FlowSidebar.vue)
- [FlowTopbar.vue](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/components/FlowTopbar.vue)
- [flowCenterRouteAccess.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/services/flowCenterRouteAccess.js)
- [approval/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/approval/routes.js)
- [purchase/routes.js](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/modules/purchase/routes.js)

說明：
- 目前 route access、sidebar、topbar、layout redirect 已使用同一套規則
- 但這次實作暴露出 contract 原本少寫了「project-local route access helper」這個必要落點

已補強：
- `PROJECT_SCAFFOLD_CONTRACT.md` 已加入此條

## 8. Backend Alignment Contract

Result: Pass

說明：
- `/api/login` 與 `/api/session` 已能回完整身份欄位
- 前端也已依此模式工作

## 9. Documentation Contract

Result: Pass

證據：
- [FLOWCENTER_GAP_REPORT_2026-03-02.md](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/docs/FLOWCENTER_GAP_REPORT_2026-03-02.md)
- [FLOWCENTER_PROJECT_PLAN.md](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/docs/FLOWCENTER_PROJECT_PLAN.md)
- [BACKEND_PHASE_STATUS.md](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/flowCenter/docs/BACKEND_PHASE_STATUS.md)

---

## 反向驗證後的判斷

`PROJECT_SCAFFOLD_CONTRACT.md` 現在已足以作為：
- 新專案建立的單一入口
- AI 建立新專案時的主指令基礎
- 之後檢查專案是否偏離平台哲學的第一份對照文件

目前仍未完全上升為平台正式硬規則的部分，不在這份 contract 本身，而在更上層治理：
- 一些關鍵方法仍位於 candidate convention
- 角色 / 公司級 route guard 還是 project-local pattern，尚未升成平台通用 guard 機制

但就「能否完整產出一個符合平台的專案骨架」而言，這份 contract 現在已可用。
