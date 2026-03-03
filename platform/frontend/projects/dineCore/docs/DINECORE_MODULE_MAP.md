# DINECORE_MODULE_MAP

更新日期：2026-03-03

## 1. 目前啟用模組
- `entry`
- `menu`
- `cart`
- `checkout`
- `order-tracker`
- `counter`
- `kitchen`
- `dashboard`
- `reports`
- `audit-close`
- `menu-admin`
- `table-admin`
- `staff-auth`

## 2. 顧客端模組

### 2.1 `entry`
- 角色：顧客
- 主要責任：固定桌號入口、桌號狀態檢查、導入菜單
- 主要頁面：
  - `/`
  - `/t/:tableCode`
  - `/t/:tableCode/unavailable`
- 依賴狀態：可單獨存在
- 目前狀態：已完成 mock flow

### 2.2 `menu`
- 角色：顧客
- 主要責任：顯示菜單分類、商品卡、客製選項、加入購物車
- 主要頁面：
  - `/t/:tableCode/menu`
- 依賴狀態：依賴 `entry` 提供桌號上下文；`cart` 缺席時不應報錯
- 目前狀態：已完成 mock flow

### 2.3 `cart`
- 角色：顧客
- 主要責任：子購物車切換、品項編輯、備註、客製內容回看
- 主要頁面：
  - `/t/:tableCode/cart`
- 依賴狀態：依賴 `menu` 已產生加購資料
- 目前狀態：已完成 mock flow

### 2.4 `checkout`
- 角色：顧客
- 主要責任：確認訂單、合併子購物車、送出訂單、顯示送單成功摘要
- 主要頁面：
  - `/t/:tableCode/checkout`
  - `/t/:tableCode/checkout/success/:orderId`
- 依賴狀態：依賴 `cart`
- 目前狀態：已完成 mock flow

### 2.5 `order-tracker`
- 角色：顧客
- 主要責任：顯示訂單狀態、timeline、已送出品項摘要
- 主要頁面：
  - `/t/:tableCode/order/:orderId`
- 依賴狀態：依賴 `checkout` 或既有訂單
- 目前狀態：已完成 mock flow

## 3. 商家端模組

### 3.1 `staff-auth`
- 角色：員工
- 主要責任：登入、登出、session、角色資訊
- 主要頁面：
  - 商家端滿版登入遮罩
- 依賴狀態：商家端基礎模組
- 目前狀態：已完成 mock flow

### 3.2 `counter`
- 角色：櫃台 / 副店長 / 店長
- 主要責任：訂單列表、訂單明細、狀態更新、付款更新、取消、取餐完成
- 主要頁面：
  - `/staff/counter/orders`
  - `/staff/counter/orders/:orderId`
- 依賴狀態：依賴 `staff-auth`
- 目前狀態：已完成可操作版

### 3.3 `kitchen`
- 角色：廚房 / 副店長 / 店長
- 主要責任：未完成訂單看板、製作狀態更新、客製資訊判讀
- 主要頁面：
  - `/staff/kitchen/board`
- 依賴狀態：依賴 `staff-auth`
- 目前狀態：已完成可操作版

### 3.4 `dashboard`
- 角色：副店長 / 店長
- 主要責任：營收摘要、訂單數、熱門品項、狀態分布
- 主要頁面：
  - `/staff/manager/dashboard`
- 依賴狀態：依賴 `staff-auth`
- 目前狀態：已完成可操作版

### 3.5 `reports`
- 角色：副店長 / 店長
- 主要責任：營運報表、訂單查詢、付款方式分布、品項排行、CSV 匯出
- 主要頁面：
  - `/staff/manager/reports`
- 依賴狀態：依賴 `staff-auth`；資料需經 API 邊界取得，不得直接依賴 `dashboard` 或 `counter` store
- 目前狀態：第一版可用

### 3.6 `audit-close`
- 角色：店長
- 主要責任：關帳、解鎖、鎖定規則、稽核留痕、異常提示、原因分類與狀態差異
- 主要頁面：
  - `/staff/manager/audit-close`
- 依賴狀態：依賴 `staff-auth`；資料需經 API 邊界取得，不得直接依賴 `counter`、`dashboard` 或 `reports` store
- 目前狀態：第一版可用

### 3.7 `menu-admin`
- 角色：副店長 / 店長
- 主要責任：商品管理、圖片、價格、上下架、售完、客製規則
- 主要頁面：
  - `/staff/manager/menu-items`
- 依賴狀態：依賴 `staff-auth`
- 目前狀態：已完成基礎管理版

### 3.8 `table-admin`
- 角色：櫃台 / 副店長 / 店長
- 主要責任：桌號管理、入口連結、QR、接單控制、排序、刪除
- 主要頁面：
  - `/staff/manager/tables`
- 依賴狀態：依賴 `staff-auth`
- 目前狀態：已完成基礎管理版

## 4. 共享基礎層

### 4.1 `layout`
- 主要責任：顧客端 top bar、商家端 top bar、開發選單、登入遮罩容器
- 原則：
  - 只作為容器
  - 依 route / meta 與可用模組決定導航
  - 模組缺席時不得報錯

### 4.2 `api`
- 主要責任：project API 邊界與 mock runtime
- 目前檔案：
  - `api/mockRequest.js`
  - `api/mockRuntime.js`
- 原則：
  - 共享真相只走 API 邊界
  - 不以 project-level `services/` 承載 business state

## 5. 主流程地圖

### 5.1 顧客端流程
1. `entry`
2. `menu`
3. `cart`
4. `checkout`
5. `order-tracker`

### 5.2 商家端流程
1. `staff-auth`
2. `counter`
3. `kitchen`
4. `dashboard`
5. `menu-admin`
6. `table-admin`

## 6. 依賴順序

### 6.1 顧客端
1. `entry`
2. `menu`
3. `cart`
4. `checkout`
5. `order-tracker`

### 6.2 商家端
1. `staff-auth`
2. `counter`
3. `kitchen`
4. `dashboard`
5. `menu-admin`
6. `table-admin`

## 7. 可拆卸性說明
- `LayoutRoot` 必須容忍模組缺席
- 頁面必須依資料存在與否決定顯示，不得因缺席依賴直接報錯
- 導航入口必須依 route / meta 與可用模組顯示
- 顧客端與商家端共享真相只經過 API 邊界交換

## 8. 尚未納入的模組
- 正式 API adapter
- 正式員工帳號管理

## 8.1 已定義邊界、已建立第一版的模組

### `reports`
- 角色：副店長 / 店長
- 主要責任：營運報表、訂單查詢、付款分布、品項排行
- 預計主要頁面：
  - `/staff/manager/reports`
- 依賴狀態：依賴 `staff-auth`；資料需經 API 邊界取得，不得直接依賴 `dashboard` 或 `counter` store
- 目前狀態：第一版可用
- 邊界文件：
  - [`DINECORE_REPORTS_BOUNDARY.md`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/dineCore/docs/DINECORE_REPORTS_BOUNDARY.md)

### `audit-close`
- 角色：店長
- 主要責任：關帳、解鎖、鎖定規則、稽核留痕
- 預計主要頁面：
  - `/staff/manager/audit-close`
- 依賴狀態：依賴 `staff-auth`；資料需經 API 邊界取得，不得直接依賴 `counter`、`dashboard` 或 `reports` store
- 目前狀態：第一版可用
- 邊界文件：
  - [`DINECORE_AUDIT_CLOSE_BOUNDARY.md`](/Users/zhangyu/Desktop/moducore_platform/platform/frontend/projects/dineCore/docs/DINECORE_AUDIT_CLOSE_BOUNDARY.md)

## 9. 下一步建議
1. 補 `audit-close` 稽核細節與異常處理
2. 細化 `reports` 匯出欄位與格式
3. 補一份 mock flow 轉正式 API 的遷移說明
