# FLOWCENTER_PROJECT_PLAN.md
## flowCenter 專案規劃書

---

## 0. 文件用途
本文件用於規劃 `flowCenter` 專案之：

- 前端需求
- 後端需求
- 在現有平台上的最佳落地方式
- 開發階段與執行順序
- 自動除錯與階段推進規則

本文件僅描述 `flowCenter` 專案本身。

本文件不得：

- 重新定義平台共用規格
- 重新定義 `_VibeCore/` 世界或工程裁決
- 擴張使用者未要求的功能

---

## 1. 專案定位
`flowCenter` 是企業內部的「流程中心」平台。

核心概念：

> 一個公司內部流程整合平台

本專案僅涵蓋以下功能範圍：

- 請假申請
- 採購申請
- 公告
- 任務交辦
- 主管審核
- 個人儀表板

除上述範圍外，不得自行新增需求或擴充功能。

---

## 2. 強制限制

### 2.1 需求限制

- 不得自行新增需求
- 不得自行擴充功能
- 所有模組、頁面、資料欄位與流程，都必須回到上述六項範圍

### 2.2 平台限制

- 不得改平台核心：`platform/frontend/src/app/**`
- 若實作過程發現必須修改 `src/app/**` 才能繼續：
  - 必須提出「最小變更提案」
  - 明確指出：
    - 變更原因
    - 受影響檔案
    - 不修改會卡住哪個功能
    - 為何不能在 project 層解決
  - 提案後必須停止，等待使用者確認

---

## X. 產品驗收與平台壓測 KPI（必做）

### X.1 產品閉環（Demo 必須可操作）
- Employee：
  - 可建立請假（leave）
  - 可查看自己的請假狀態（leave list/detail）
  - dashboard 可看到「我的請假狀態摘要」
  - 可建立採購申請（purchase）
  - 可查看自己的採購申請狀態（purchase list/detail）
- Manager：
  - approval 可看到待審清單
  - 可 approve / reject
- 公告（announcement）：
  - 可發布與查看（最小 CRUD）
- 任務（task）：
  - 可建立、指派、查看狀態（最小 CRUD）

### X.2 平台壓測項目（必須可觀察）
- 模組注入差異（tenant 差異）：
  - company-a：purchase module enabled
  - company-b：purchase module disabled（導航不出現、路由不可進）
- 角色可見性：
  - approval route：manager only
  - leave/purchase：employee only
- world 邊界（商用隔離優先）：
  - 所有業務資料表必須包含 company_id
  - 所有 API 查詢必須以 company_id 做隔離（依 token / session 決定）
- 模組邊界：
  - modules 不得直接 import 其他 modules 內部實作；跨模組資料只能走 API 或 container service

---

## 3. 在現有平台上的最佳落地方式

### 3.1 專案層定位
`flowCenter` 應作為新的 `project instance` 建立於：

`platform/frontend/projects/flowCenter/`

並使用現有平台既有機制：

- `loadProject.js`
  - 透過 `project.config.js` 載入 project
- `modulesRegistry.js`
  - 透過 `@project/modules/index.js` 安裝 project 模組
- `boot.js`
  - 沿用現有可見性與模組安裝流程
- `routes.js`
  - 沿用現有路由 bucket 與 root layout 掛載方式

因此本專案最合適的做法不是修改平台核心，
而是以 **project + modules** 的方式完成。

### 3.2 前端架構建議
`flowCenter` 前端應拆為以下 project modules：

1. `dashboard`
   - 對應：個人儀表板

2. `leave`
   - 對應：請假申請

3. `purchase`
   - 對應：採購申請

4. `announcement`
   - 對應：公告

5. `task`
   - 對應：任務交辦

6. `approval`
   - 對應：主管審核

上述命名直接對應功能範圍，
不引入額外模組。

### 3.4 角色矩陣與路由可見性

Roles:

- employee
- manager

Routing Visibility:

- dashboard: employee + manager
- leave: employee
- purchase: employee
- approval: manager only
- announcement: employee + manager
- task: employee + manager

### 3.5 模組邊界規則

Modules 不得直接 import 其他 module 的內部實作。

若需要跨模組資料，必須透過：

- API
或
- container 提供之服務介面

不得形成 module-to-module 直接依賴。

### 3.6 Dashboard 聚合限制

Dashboard 不得直接操作 `leave`、`purchase`、`task` 的內部資料。

Dashboard 只可透過：

- API 聚合
或
- 單一 service 層取得資料

否則 dashboard 會變成中央整合層。

### 3.3 後端架構建議
後端沿用現有 minimal MVC：

- `public/api.php`
- `src/routes.php`
- `src/Controllers`

`flowCenter` 最合適的做法是新增專案所需 API 路由與 controller，
而不是重寫 backend 入口機制。

建議控制器邊界如下：

1. `LeaveController`
   - 請假申請列表
   - 建立申請
   - 更新申請
   - 查詢單筆申請

2. `PurchaseController`
   - 採購申請列表
   - 建立申請
   - 更新申請
   - 查詢單筆申請

3. `AnnouncementController`
   - 公告列表
   - 建立公告
   - 更新公告
   - 單筆公告

4. `TaskController`
   - 既有任務能力若可重用則重用
   - 若既有任務 API 不符合需求，再以最小方式擴充

5. `ApprovalController`
   - 審核列表
   - 審核操作
   - 查詢待審項目

6. `DashboardController`
   - 個人儀表板聚合資料

### Approval 邊界限制（必做）
- Approval 模組/Controller 不得持有或定義業務狀態機。
- Leave/Purchase 的狀態規則由各自 Controller/Model 定義（例如 status: submitted/approved/rejected）。
- Approval 僅提交決策（approve/reject + comment），並由目標 Controller 套用狀態變更。

不應先做跨 controller 的大一統流程引擎。

---

## 4. 前端需求規劃

### 4.1 專案骨架
新專案應至少包含：

- `project.config.js`
- `layout/`
- `modules/`
- `styles/`
- `docs/`

### 4.2 `project.config.js` 最低內容
應至少包含：

- `name: 'flowCenter'`
- `title: 'Flow Center'`
- `tenant_id: 'flowCenter'`
- `modules`
  - `dashboard`
  - `leave`
  - `purchase`
  - `announcement`
  - `task`
  - `approval`
- `description`
- `scenario`
- `skills`
- `constraints`

### 4.3 layout 規劃
`layout/` 只做 project 殼層，不做業務判斷。

需要：

- `LayoutRoot.vue`
- `index.js`

版面責任：

- 左側主選單
- 頂部使用者區域
- 主內容區
- 審核與提醒入口位置預留

### 4.4 modules 規劃

#### dashboard
- 顯示個人待辦摘要
- 顯示待審件數
- 顯示最近公告
- 顯示本人任務摘要

#### leave
- 請假申請列表
- 建立請假申請
- 查看請假申請狀態
- 編輯尚未完成的申請

#### purchase
- 採購申請列表
- 建立採購申請
- 查看採購申請狀態
- 編輯尚未完成的申請

#### announcement
- 公告列表
- 公告詳情
- 公告建立與更新

#### task
- 任務列表
- 任務詳情
- 任務指派與追蹤

#### approval
- 主管待審列表
- 單筆審核頁
- 審核結果提交

---

## 5. 後端需求規劃

### 5.1 API 類別
本專案後端需求只限於支撐六個功能面。

#### Dashboard API
- 取得個人儀表板資料

#### Leave API
- 取得列表
- 取得單筆
- 建立
- 更新

#### Purchase API
- 取得列表
- 取得單筆
- 建立
- 更新

#### Announcement API
- 取得列表
- 取得單筆
- 建立
- 更新

#### Task API
- 取得列表
- 取得單筆
- 建立或指派
- 更新

#### Approval API
- 取得待審列表
- 取得單筆待審內容
- 提交審核結果

### API 權限與 tenant/module 開關規則（必做）
- API 層必須驗證角色權限，不可僅依賴前端路由可見性。
  - approval API：manager only
  - leave/purchase 建立/更新：employee only（或 employee+manager 視需求，但需明確）
- tenant/module disable 規則：
  - company-b 若 disable purchase：
    - 前端導航不顯示、路由不可進
    - 後端 purchase 相關 API 必須回傳 404 或 403（擇一並統一）

### 5.2 資料模型最小需求
本規劃只定義最小資料責任，不擴充額外業務功能。

#### leave
- id
- applicant_id
- leave_type
- start_date
- end_date
- reason
- status
- approver_id

#### purchase
- id
- applicant_id
- item_name
- amount
- reason
- status
- approver_id

#### announcement
- id
- title
- content
- publisher_id
- published_at
- status

#### task
- id
- title
- description
- assignee_id
- creator_id
- status
- due_date

#### approval
- id
- source_type
- source_id
- approver_id
- decision
- comment
- decided_at

#### dashboard
- 從 leave / purchase / task / announcement / approval 聚合

所有業務資料表必須包含 `company_id`。

API 查詢必須以 `company_id` 作為隔離條件。

---

## 6. 平台最合適的實作策略

### 6.1 前端策略

- 使用 `flowCenter` 作為新的 project
- 不碰 `src/app/**`
- 所有功能以 project modules 實作
- 使用現有 `@project/modules/index.js` 作為模組安裝入口
- 使用現有 route bucket 機制掛載 routes

### 6.2 後端策略

- 沿用現有 `src/routes.php`
- 以 controller 增量擴充
- 若 `task` 已有 API 足夠，就優先重用
- 若缺口存在，再用最小增量補 route 與 controller

### 6.3 不應做的事

- 不先改 `boot.js`
- 不先改 `world.js`
- 不先改 container 核心
- 不先建立共用流程引擎
- 不先做跨專案抽象化

---

## 7. 開發計畫步驟

### Phase 0：專案骨架建立
目標：

- 建立 `flowCenter` project 基本骨架
- 建立 `project.config.js`
- 建立 `layout/`
- 建立 `modules/`
- 建立 `styles/`
- 建立 `docs/`

完成條件：

- `VITE_PROJECT=flowCenter` 時，`loadProject.js` 可讀到 `project.config.js`
- `@project/layout/LayoutRoot.vue` 可被 import
- `@project/modules/index.js` 存在

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 1：殼層與儀表板
目標：

- 完成 `layout/`
- 完成 `dashboard` module
- 首頁可顯示個人儀表板基本區塊

完成條件：

- 根路由可正常載入
- 導航可看到儀表板入口
- dashboard route 可正常渲染

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 2：申請類模組
目標：

- 完成 `leave`
- 完成 `purchase`

完成條件：

- 兩個模組都具備列表、單筆、建立、更新
- 前端 route 與 backend API 對應完成

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 3：公告與任務
目標：

- 完成 `announcement`
- 完成 `task`

完成條件：

- 公告可查看與維護
- 任務交辦可查看與追蹤

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 4：主管審核
目標：

- 完成 `approval`
- 串接 leave / purchase 的審核流

完成條件：

- 待審列表可顯示
- 單筆審核可提交結果

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 5：整合驗證
目標：

- 驗證 dashboard 聚合資料
- 驗證各模組流程互通
- 驗證 route、API、狀態切換

完成條件：

- 六個功能模組全部可進入
- 前後端資料鏈可通
- 不需修改 `src/app/**`

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

### Phase 6：阻塞點判斷
目標：

- 若出現 platform-core 阻塞點，產出最小變更提案

完成條件：

- 只要出現必須動 `src/app/**` 的需求，就停止並提案

### Governance Check（必做）

- 是否新增跨模組依賴？
- 是否出現 container 以外的直接引用？
- 是否產生新的全域 state？
- 是否需要修改 platform core？
- module 是否仍為可卸載狀態？

---

## 8. 自動除錯與自動推進規則

### 8.1 自動除錯原則
每個 phase 完成後，必須先做以下檢查：

1. 結構檢查
   - 必要檔案是否存在
   - import 路徑是否正確
   - `project.config.js` 與 modules 是否一致

2. 路由檢查
   - `routes.js` 是否可匯入
   - module routes 是否完成註冊

3. API 檢查
   - route 是否已在 `platform/backend/src/routes.php` 宣告
   - controller 是否存在

4. 建置檢查
   - 執行前端 build 或等價檢查

### 8.2 階段推進規則

- 若本 phase 結構檢查失敗：
  - 先在本 phase 自行修正
  - 不得跳下一階段

- 若本 phase build 失敗：
  - 先除錯
  - 仍不得跳下一階段

- 若本 phase 問題屬 project 層可修：
  - 允許自動修正並重試

- 若本 phase 問題屬 `src/app/**` 核心限制：
  - 立即停止
  - 產出最小變更提案
  - 等待使用者確認

### 8.3 自動執行條件
在不違反下列條件時，可自動進入下一 phase：

- 未新增使用者未要求的新功能
- 未修改 `src/app/**`
- 本 phase 的結構、路由、API、建置檢查已通過

若任一條件不成立，禁止自動前進。

### X.3 Phase Gate（治理驗收）
自動進入下一 Phase 前，必須輸出：

- 變更檔案列表
- 本 Phase 新增 public API
- 本 Phase 新增/修改的 routes 與 API 清單
- 模組依賴圖（列出是否有跨模組引用）
- 是否出現跨模組 import（若有，列出路徑並修正）
- 是否產生 global state
- 是否需要 platform core 變更（若需要，提出最小變更提案並停止）

若上述任一項缺失，不得自動前進。

---

### 8.4 Phase 監聽 / Gate 規則

1. Phase 狀態以 `docs/PHASE_STATUS.md` 為唯一真實來源（Single Source of Truth）。
2. 每次執行前，必須先讀取 `docs/PHASE_STATUS.md`：
   - 只能執行 `Next Allowed Phase` 指定的 Phase
   - 不得跳 Phase，不得同時執行多個 Phase
3. 每完成一個 Phase（且 build/檢查通過）後，必須更新 `docs/PHASE_STATUS.md`：
   - 更新 `Current Phase`
   - 更新 `Next Allowed Phase`
   - 在 `Phase Timeline` 中追加或更新該 Phase 的紀錄（含 `Files Changed`、`Build`、`Core Modified`、`Cross-Module Import`、`Global State`）
4. 若 build 未通過或治理檢查未通過，不得更新 `Next Allowed Phase`，代表仍停留在同一 Phase。
5. 若需要修改 platform core（`src/app/**`），必須：
   - 將 `blockedByCore` 設為 `true`
   - 在 `Blockers` 區塊寫入最小變更提案摘要
   - `Next Allowed Phase` 必須維持不變
   - 並停止等待使用者確認

### 8.5 Phase 狀態執行規則

- 後續每次執行任一 Phase 前，必須先閱讀 `docs/PHASE_STATUS.md`。
- 若 `Current Phase`、`Next Allowed Phase`、`blockedByCore` 或 `Phase Timeline` 未更新到上一個 Phase 的實際結果，禁止進入下一個 Phase。
- 每次 Phase 完成後，必須先更新 `docs/PHASE_STATUS.md`，再進行下一次任務啟動。
- 若 `blockedByCore = true`，必須停止，不得以任何形式繞過 Gate 繼續實作。

## 9. 實作優先順序 實作優先順序

1. 先建 project 骨架
2. 再建 layout
3. 再建 dashboard
4. 再建 leave / purchase
5. 再建 announcement / task
6. 最後建 approval
7. 最後做整合驗證

這個順序最適合目前平台，因為：

- 先讓 project 可被載入
- 再讓 route 可被掛載
- 再逐步接入功能模組
- 把 approval 放後面，避免一開始就把流程耦合拉高

---


## 10. 完成定義
`flowCenter` 視為完成，必須同時滿足：

- 已建立為獨立 project instance
- 六個功能範圍全部落地
- 前後端 API 已對應
- `project.config.js` 合乎 `PROJECT_CONFIG_SCHEMA`
- 未未經批准修改 `platform/frontend/src/app/**`
- 若曾遇到 core 阻塞點，已提出最小變更提案並獲確認

---


## Phase 狀態檔案

- `PHASE_STATUS` 已獨立於 `docs/PHASE_STATUS.md`。
- 後續所有 Phase 執行、Gate 檢查與狀態更新，均以該檔案為唯一真實來源。
## 設計事故紀錄：模組狀態邊界
- 本專案曾出現一次錯誤實作：將多個模組的狀態集中到 project-level services，造成 module store 缺席、模組自動註冊不完整、模組邊界被削弱。
- 此作法已被認定為違反 `flowCenter` 的核心認知、module-first 設計哲學與工程規則。
- `flowCenter` 之後必須維持以下邊界：
  - 每個模組必須擁有自己的 store，並由模組安裝流程註冊。
  - `services/` 可以建立，但只可作為 project-level 內容，例如 API client、transport、純資料處理層、專案級協調入口。
  - page / component 不得把 project-level service 當成模組狀態中心。
  - `services/` 不得承載模組私有 state，不得形成跨模組耦合，不得要求模組彼此知道對方內部實作。
- 後續任何 AI / Agent / 開發者不得再次以集中式 service state 取代 module store。
- 若未來出現類似提案，必須先停下並提出最小變更提案，等待確認後才能進行。
