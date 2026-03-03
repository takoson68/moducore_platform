# DineCore 模組清單與頁面地圖

## 0. 文件用途
本文件將 DineCore 的 MVP user stories 轉為模組清單、頁面地圖與責任邊界。

本文件用途為：
- 讓後續前端模組切分有依據
- 讓資料模型與 API 設計能對齊頁面責任
- 降低不同流程之間的耦合

本文件不負責：
- UI 視覺稿
- API 欄位定稿
- 後端資料表設計

---

## 1. 切分原則
- 顧客端、櫃台端、廚房端、店長端分為不同模組
- 模組以流程責任切分，不以單一頁面數量切分
- MVP 優先建立能跑通點餐主流程的模組
- Phase 2 再補店務管理、報表與稽核能力

## 1.1 當前實作狀態
- `entry / menu / cart / checkout / order-tracker`：已建立骨架，並已接上顧客端 mock 流
- `counter / kitchen / dashboard`：已建立骨架，尚未接上同一套 mock 流
- `order-admin / menu-admin / table-admin / business-hours / access-control / reports / audit-close`：尚未開始

目前實作順序已從「只做 MVP 顧客端」調整為：
- 先把顧客端與商家端的整體模組架構都立起來
- 再回頭優先打通顧客端主流程
- 再補商家端資料流與營運閉環

---

## 2. MVP 模組清單

### M01. `entry`
責任：
- 處理 QR Code 入口解析
- 驗證固定桌號是否有效
- 建立顧客端初始點餐上下文

對應 stories：
- US-A01
- US-A02

建議頁面：
- `/t/:tableCode`
  - 掃碼進入與桌號驗證入口頁
- `/t/:tableCode/unavailable`
  - 桌號停用、非營業中、暫停接單提示頁

備註：
- 可視情況將入口驗證後直接導到菜單首頁，不一定保留獨立長駐頁

### M02. `menu`
責任：
- 顯示菜單分類與品項列表
- 顯示品項狀態、圖片、價格與標示
- 處理客製選項視圖

對應 stories：
- US-B01
- US-B02
- US-B03
- US-B04

建議頁面：
- `/t/:tableCode/menu`
  - 菜單首頁
- `/t/:tableCode/menu/item/:itemId`
  - 品項詳情與客製選項頁或底部抽屜

備註：
- 手機主流程建議以單頁加抽屜完成，不要過多切頁

### M03. `cart`
責任：
- 管理個人子購物車
- 管理購物車品項、數量、備註
- 顯示同桌其他子購物車摘要

對應 stories：
- US-C01
- US-C02

建議頁面：
- `/t/:tableCode/cart`
  - 目前使用者的子購物車頁
- `/t/:tableCode/cart/member/:cartId`
  - 指定子購物車檢視頁

備註：
- 子購物車需要「暱稱或座位標記」機制，否則按人分帳無法成立

### M04. `checkout`
責任：
- 同桌子購物車合單
- 顯示按人分帳金額
- 建立訂單並防止重複送單

對應 stories：
- US-C03
- US-C04
- US-D01
- US-D02

建議頁面：
- `/t/:tableCode/checkout`
  - 合單與結帳明細頁
- `/t/:tableCode/checkout/success/:orderId`
  - 下單成功頁

備註：
- MVP 不做線上支付，只做送單與付款待確認狀態

### M05. `order-tracker`
責任：
- 顧客端查看訂單狀態
- 顯示桌號、訂單編號、目前進度與等待資訊

對應 stories：
- US-E01
- US-E02

建議頁面：
- `/t/:tableCode/order/:orderId`
  - 訂單追蹤頁

### M06. `counter`
責任：
- 顯示櫃台即時訂單列表
- 搜尋與篩選訂單
- 更新訂單狀態
- 人工確認付款方式與付款狀態

對應 stories：
- US-D03
- US-D04
- US-F01
- US-F02
- US-F03

建議頁面：
- `/staff/counter/orders`
  - 櫃台訂單列表頁
- `/staff/counter/orders/:orderId`
  - 櫃台訂單詳情頁

### M07. `kitchen`
責任：
- 顯示未完成訂單
- 顯示品項、數量與備註
- 標示完成與同步訂單狀態
- 設定缺貨

對應 stories：
- US-G01
- US-G02
- US-G03

建議頁面：
- `/staff/kitchen/board`
  - 廚房看板頁

### M08. `dashboard`
責任：
- 顯示今日營收、訂單數、熱門品項
- 提供店長快速掌握當日狀態

對應 stories：
- US-I01

建議頁面：
- `/staff/manager/dashboard`
  - 基礎營運總覽頁

---

## 3. Phase 2 模組清單

### M09. `order-admin`
責任：
- 改單、取消單、補印、異常處理
- 高風險操作紀錄

對應 stories：
- US-F04
- US-F05

建議頁面：
- `/staff/counter/orders/:orderId/edit`
- `/staff/counter/orders/:orderId/print`

### M10. `menu-admin`
責任：
- 管理菜單價格、顯示狀態、停售與客製規則

對應 stories：
- US-H01

建議頁面：
- `/staff/manager/menu`
- `/staff/manager/menu/item/:itemId`

### M11. `table-admin`
責任：
- 管理桌號、區域與桌號可用性

對應 stories：
- US-H02

建議頁面：
- `/staff/manager/tables`

### M12. `business-hours`
責任：
- 設定營業時間與暫停接單

對應 stories：
- US-H03

建議頁面：
- `/staff/manager/business-hours`

### M13. `access-control`
責任：
- 員工角色與權限控制

對應 stories：
- US-H04

建議頁面：
- `/staff/manager/roles`

### M14. `reports`
責任：
- 日報表
- 匯出營收與銷售明細

對應 stories：
- US-I02
- US-I03

建議頁面：
- `/staff/manager/reports/daily`
- `/staff/manager/reports/export`

### M15. `audit-close`
責任：
- 操作紀錄
- 每日關帳
- 店長解鎖流程

對應 stories：
- US-I04
- US-I05

建議頁面：
- `/staff/manager/audit-log`
- `/staff/manager/close-day`

---

## 4. 頁面地圖

### 顧客端頁面流
1. `/t/:tableCode`
2. `/t/:tableCode/menu`
3. `/t/:tableCode/cart`
4. `/t/:tableCode/checkout`
5. `/t/:tableCode/checkout/success/:orderId`
6. `/t/:tableCode/order/:orderId`

### 櫃台端頁面流
1. `/staff/counter/orders`
2. `/staff/counter/orders/:orderId`

### 廚房端頁面流
1. `/staff/kitchen/board`

### 店長端頁面流
1. `/staff/manager/dashboard`
2. `/staff/manager/menu`
3. `/staff/manager/tables`
4. `/staff/manager/business-hours`
5. `/staff/manager/reports/daily`
6. `/staff/manager/audit-log`
7. `/staff/manager/close-day`

---

## 5. 模組依賴順序
1. `entry`
2. `menu`
3. `cart`
4. `checkout`
5. `order-tracker`
6. `counter`
7. `kitchen`
8. `dashboard`
9. Phase 2 管理模組

依賴說明：
- `checkout` 依賴 `cart`
- `order-tracker` 依賴 `checkout`
- `counter` 與 `kitchen` 共同依賴訂單資料
- `dashboard` 依賴基本訂單與付款彙整能力

---

## 6. 目前建議
- 顧客主流程優先做成單一手機體驗，不要過早拆成過多頁面
- 子購物車是 DineCore 與一般點餐系統最大差異點，應優先做清楚
- 櫃台付款確認與廚房看板是 MVP 的營運閉環，不能只做顧客端
- 報表與關帳先做最低可驗證版本，再擴充稽核與匯出能力

---
