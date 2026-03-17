# DINECORE_REPORTS_BOUNDARY

更新日期：2026-03-03

## 1. 模組定位

`reports` 是 `dineCore` 商家端的唯讀報表模組。

它的責任是：
- 提供店長 / 副店長查看營運摘要
- 提供訂單明細查詢與篩選
- 提供付款分布、品項銷售、時段表現等報表視角
- 為後續匯出能力保留明確 API 邊界

它不負責：
- 關帳
- 解鎖關帳
- 修改訂單狀態
- 修改付款狀態
- 直接操作其他模組 store

`reports` 必須是獨立模組，不得把報表邏輯塞進 `dashboard`、`counter` 或 project-level `services/`。

---

## 2. 角色與權限邊界

第一版建議角色限制：

- `deputy_manager`
- `manager`

第一版不開放：

- `counter`
- `kitchen`

理由：
- 報表屬於營運判讀，不是現場執行工作台
- `counter` 與 `kitchen` 需要的是操作介面，不是跨日或聚合分析

route meta 應沿用目前 `dineCore` 商家端既有 schema：

```js
meta: {
  title: '營運報表',
  staffRoles: ['deputy_manager', 'manager'],
  access: {
    public: true,
    auth: true
  }
}
```

說明：
- `access` 只描述是否需要登入
- `staffRoles` 只描述登入後哪些員工角色可進入

---

## 3. 第一版頁面邊界

第一版只做一個主頁：

- `/staff/manager/reports`

頁面內區塊：
- 報表篩選列
- 今日 / 區間摘要卡
- 訂單狀態分布
- 付款方式分布
- 品項銷售排行
- 訂單明細表

第一版先不要拆成多路由：
- 不拆 `/sales`
- 不拆 `/items`
- 不拆 `/payments`
- 不拆 `/exports`

理由：
- 目前 `dineCore` 還在 mock 閉環階段
- 先把單一頁面骨架、資料契約、角色限制定清楚，比先拆多頁更穩

---

## 4. 第一版資料邊界

`reports` 第一版應只讀取「報表投影資料」，不要直接拼接其他模組 store。

第一版最小資料集合：

### 4.1 summary
- `businessDate`
- `grossSales`
- `paidAmount`
- `unpaidAmount`
- `orderCount`
- `completedOrderCount`
- `cancelledOrderCount`
- `averageOrderValue`

### 4.2 statusBreakdown
- `pending`
- `confirmed`
- `preparing`
- `ready`
- `completed`
- `cancelled`

### 4.3 paymentBreakdown
- `cash`
- `line_pay`
- `card`
- `other`
- `unpaid`

### 4.4 topItems
- `itemId`
- `itemName`
- `quantity`
- `grossSales`

### 4.5 orderRows
- `orderId`
- `tableCode`
- `createdAt`
- `status`
- `paymentStatus`
- `paymentMethod`
- `totalAmount`
- `itemCount`
- `staffNoteSummary`

---

## 5. 篩選邊界

第一版允許的篩選條件：

- `dateFrom`
- `dateTo`
- `status`
- `paymentStatus`
- `paymentMethod`
- `keyword`

第一版先不要加入：

- 多店篩選
- 員工績效維度
- 品類維度 drill-down
- 關帳批次維度

理由：
- 這些都會把 `reports` 推向更重的營運分析或稽核系統
- 目前應先維持「門市單體營運報表」

---

## 6. API 邊界

共享真相只能走 API 邊界，因此 `reports` 必須有自己的 module-local API。

建議最小檔案：

- `modules/reports/api/reportsApi.js`
- `modules/reports/service.js`
- `modules/reports/store.js`

責任分工：

- `api/reportsApi.js`
  - 只負責 endpoint / mockRequest 呼叫
  - 不持有 business state
- `service.js`
  - 只負責整理報表 payload、錯誤轉譯、預設篩選條件
- `store.js`
  - 只持有本模組的 filters / loading / reportData

禁止事項：

- 不得直接讀 `dashboardStore` 當報表資料來源
- 不得直接讀 `counterStore` 當報表資料來源
- 不得在 `projects/dineCore/services/` 建立 `reportsService` 當跨模組業務中心
- 不得把 `reports` 的聚合邏輯藏進 `api/mockRuntime.js` 以外的共享層

第一版 API contract 建議：

- `GET /staff/reports/summary`
- `GET /staff/reports/orders`

mock 階段可先由 `project api -> mock runtime` 實作，但 route / payload / response shape 應先固定。

---

## 7. Store 邊界

`reports` store 只應持有：

- `filters`
- `loading`
- `error`
- `summary`
- `statusBreakdown`
- `paymentBreakdown`
- `topItems`
- `orderRows`
- `lastLoadedAt`

不應持有：

- 全專案共享訂單真相
- `counter` 操作狀態
- `dashboard` 的 UI state
- `audit-close` 的鎖定狀態

也就是說：
- `reports` 可以讀取報表投影資料
- `reports` 不擁有訂單主資料真相

---

## 8. 與其他模組的邊界

### 8.1 與 `dashboard`
- `dashboard` 是營運摘要工作台
- `reports` 是可查詢、可篩選、可延伸匯出的報表模組
- 同一批資料來源可以存在，但不可直接共享 store

### 8.2 與 `counter`
- `counter` 負責現場訂單操作
- `reports` 只負責觀察與查詢
- `reports` 不得呼叫 `counter` 的操作 action

### 8.3 與 `audit-close`
- `audit-close` 之後會負責關帳、鎖定、稽核留痕
- `reports` 第一版不承擔關帳責任
- 未來若要查「關帳批次報表」，應以新的篩選欄位或 API 擴充，而不是把關帳流程塞進 `reports`

---

## 9. Layout 與可降級原則

`LayoutRoot` 必須是可降級容器，因此：

- `reports` 模組缺席時，商家端 layout 不得報錯
- 導航只在模組存在且 route 可見時顯示 `reports`
- `reports` 頁面內若某一區塊暫無資料，應隱藏區塊或顯示空狀態，不得整頁崩潰

這意味著第一版頁面應遵守：
- 有 `summary` 就畫摘要卡
- 沒有 `topItems` 就不畫排行或畫空狀態
- 沒有 `orderRows` 就顯示空表格提示

---

## 10. 第一版完成定義

滿足以下條件即可視為 `reports` 第一版完成：

1. 已有 `reports` 模組目錄與 `index.js`
2. 已有 `/staff/manager/reports` route
3. 已有 `staffRoles` 與 `access` 限制
4. 已有 module-local `api/`、`service.js`、`store.js`
5. 已能顯示摘要卡、付款分布、狀態分布、訂單明細表
6. 頁面在資料缺席時只顯示空狀態，不報錯
7. 不透過 project-level business service 串接資料

---

## 11. 下一步實作順序

1. 建立 `reports` 模組骨架
2. 定義 mock API payload 與 response shape
3. 建立 `reports` store / service / api`
4. 完成 `/staff/manager/reports` 主頁
5. 最後再補匯出按鈕與欄位細節
