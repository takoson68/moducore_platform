# DINECORE_AUDIT_CLOSE_BOUNDARY

更新日期：2026-03-03

## 1. 模組定位

`audit-close` 是 `dineCore` 商家端的關帳與稽核模組。

它的責任是：
- 定義營業日關帳流程
- 鎖定指定營業日的訂單與付款調整
- 記錄關帳執行者、時間與備註
- 提供店長解鎖與再次關帳的稽核留痕

它不負責：
- 一般訂單操作
- 即時櫃台收款
- 菜單管理
- 桌號管理
- 直接產出完整報表畫面

`audit-close` 必須是獨立模組，不得把關帳規則散落在 `counter`、`dashboard` 或 project-level `services/`。

---

## 2. 角色與權限邊界

第一版建議角色限制：

- `manager`

第一版可考慮只讀檢視：

- `deputy_manager`

第一版不開放：

- `counter`
- `kitchen`

理由：
- 關帳屬於高風險營運動作
- 一旦完成關帳，會影響訂單是否仍可被修改
- 執行權應集中在店長，避免現場角色誤操作

route meta 建議：

```js
meta: {
  title: '關帳與稽核',
  staffRoles: ['manager'],
  access: {
    public: true,
    auth: true
  }
}
```

說明：
- `access` 只描述是否需要登入
- `staffRoles` 只描述登入後哪些角色可執行關帳

若未來要讓 `deputy_manager` 可讀，應拆成：
- 執行關帳：`manager`
- 檢視歷史：`deputy_manager / manager`

---

## 3. 第一版頁面邊界

第一版只做一個主頁：

- `/staff/manager/audit-close`

頁面內區塊：
- 關帳目標營業日摘要
- 關帳前檢查清單
- 未完成項目提示
- 關帳執行區
- 關帳歷史紀錄
- 解鎖申請 / 解鎖紀錄

第一版先不要拆成多路由：
- 不拆 `/close-records`
- 不拆 `/unlock-history`
- 不拆 `/exceptions`

理由：
- 目前先把流程與資料契約定清楚，比先切多頁更重要

---

## 4. 第一版流程邊界

第一版流程建議固定為：

1. 選定營業日
2. 讀取該營業日摘要與檢查清單
3. 若仍有未付款或未完成訂單，禁止關帳
4. 若檢查全數通過，允許執行關帳
5. 關帳後將該營業日標記為 `closed`
6. 關帳後相關資料進入鎖定狀態
7. 若需修正，只能由 `manager` 執行解鎖並留下原因

第一版檢查清單至少包含：
- 是否仍有 `unpaid` 訂單
- 是否仍有 `pending / preparing / ready` 訂單
- 是否已有既存關帳紀錄

第一版先不要處理：
- 多次分批關帳
- 跨日自動關帳
- 多門市聯合關帳
- 稅務憑證整合

---

## 5. 第一版資料邊界

`audit-close` 第一版應讀取「關帳投影資料」，不要直接拼接其他模組 store。

第一版最小資料集合：

### 5.1 closingSummary
- `businessDate`
- `grossSales`
- `paidAmount`
- `unpaidAmount`
- `orderCount`
- `unfinishedOrderCount`
- `closeStatus`
- `closedAt`
- `closedBy`

### 5.2 blockingIssues
- `type`
- `label`
- `count`
- `orderIds`

### 5.3 closeHistory
- `id`
- `businessDate`
- `action`
- `actorName`
- `actorRole`
- `createdAt`
- `reason`

### 5.4 lockState
- `businessDate`
- `isLocked`
- `lockedScopes`

---

## 6. API 邊界

共享真相只能走 API 邊界，因此 `audit-close` 必須有自己的 module-local API。

建議最小檔案：

- `modules/audit-close/api/auditCloseApi.js`
- `modules/audit-close/service.js`
- `modules/audit-close/store.js`

責任分工：

- `api/auditCloseApi.js`
  - 只負責 endpoint / mockRequest 呼叫
  - 不持有 business state
- `service.js`
  - 只負責關帳摘要整理、錯誤轉譯、流程條件判斷
- `store.js`
  - 只持有本模組的 selectedDate / loading / summary / issues / history

禁止事項：

- 不得直接讀 `counterStore` 當關帳真相來源
- 不得直接讀 `dashboardStore` 當關帳摘要來源
- 不得在 `projects/dineCore/services/` 建立 `auditCloseService` 當跨模組業務中心
- 不得在 layout 或 page 內手刻關帳規則

第一版 API contract 建議：

- `GET /staff/audit-close/summary`
- `POST /staff/audit-close/close`
- `POST /staff/audit-close/unlock`
- `GET /staff/audit-close/history`

mock 階段可先由 `project api -> mock runtime` 實作，但 route / payload / response shape 應先固定。

---

## 7. Store 邊界

`audit-close` store 只應持有：

- `selectedDate`
- `loading`
- `error`
- `closingSummary`
- `blockingIssues`
- `closeHistory`
- `lockState`
- `lastLoadedAt`

不應持有：

- 訂單主資料真相
- `counter` 操作中的表單狀態
- `reports` 的查詢條件
- 員工登入真相

也就是說：
- `audit-close` 可以讀取與修改關帳狀態
- `audit-close` 不擁有訂單主資料真相

---

## 8. 與其他模組的邊界

### 8.1 與 `counter`
- `counter` 負責日常訂單處理
- `audit-close` 負責營業日結束後的鎖定
- 一旦某營業日已關帳，`counter` 後續對該日資料的修改應被 API 拒絕

### 8.2 與 `dashboard`
- `dashboard` 提供即時營運摘要
- `audit-close` 提供關帳前最終檢查摘要
- 可共享同一批底層資料來源，但不得共享 store

### 8.3 與 `reports`
- `reports` 負責查詢與分析
- `audit-close` 負責鎖定與稽核
- 未來若要看「已關帳報表」，應由 `reports` 加上關帳維度，而不是把報表 UI 搬進 `audit-close`

### 8.4 與 `staff-auth`
- `audit-close` 不得自行維護登入狀態
- 所有執行者資訊必須來自 `staff-auth` session

---

## 9. 鎖定規則

第一版先定以下鎖定原則：

- 已關帳營業日不得再更新訂單狀態
- 已關帳營業日不得再更新付款狀態
- 已關帳營業日不得再重新計算營收摘要
- 若需修正，必須先解鎖

解鎖規則：
- 只允許 `manager`
- 必須填寫原因
- 必須留下解鎖紀錄
- 解鎖後應明確標記該營業日為 `reopened`

---

## 10. Layout 與可降級原則

`LayoutRoot` 必須是可降級容器，因此：

- `audit-close` 模組缺席時，商家端 layout 不得報錯
- 導航只在模組存在且 route 可見時顯示 `audit-close`
- 關帳摘要若暫無資料，頁面應顯示空狀態，不得整頁崩潰

這意味著第一版頁面應遵守：
- 有摘要就畫摘要卡
- 有 blocking issues 就畫阻塞提示
- 沒有歷史紀錄就畫空狀態

---

## 11. 第一版完成定義

滿足以下條件即可視為 `audit-close` 第一版完成：

1. 已有 `audit-close` 模組目錄與 `index.js`
2. 已有 `/staff/manager/audit-close` route
3. 已有 `staffRoles` 與 `access` 限制
4. 已有 module-local `api/`、`service.js`、`store.js`
5. 已能顯示關帳摘要、阻塞清單、歷史紀錄
6. 已能執行關帳與解鎖 mock flow
7. 關帳後 API 已能拒絕對已關帳營業日的修改
8. 不透過 project-level business service 串接資料

---

## 12. 下一步實作順序

1. 建立 `audit-close` 模組骨架
2. 定義 mock API payload 與 response shape
3. 建立 `audit-close` store / service / api
4. 完成 `/staff/manager/audit-close` 主頁
5. 最後再補稽核細節與異常處理
