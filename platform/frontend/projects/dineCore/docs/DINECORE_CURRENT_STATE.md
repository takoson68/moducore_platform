# DINECORE_CURRENT_STATE

日期：2026-03-03

## 1. 目前已註冊模組

目前 `project.config.js` 已啟用的模組：

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

---

## 2. 模組狀態總覽

| 模組 | 狀態 | 說明 |
|---|---|---|
| `entry` | 可用 | 顧客端桌號入口、桌號上下文、暫停接單頁 |
| `menu` | 可用 | 菜單分類、商品卡、客製選項、加入購物車 |
| `cart` | 可用 | 子購物車、數量調整、客製與備註編輯 |
| `checkout` | 可用 | 確認訂單、合單摘要、送出訂單、成功頁 |
| `order-tracker` | 可用 | 訂單追蹤、時間線、歷史訂單摘要 |
| `staff-auth` | 可用 | 商家端登入、session 載入、登出，已支援 real/mock 雙模 |
| `counter` | 可用 | 櫃台訂單列表、明細、付款與狀態更新 |
| `kitchen` | 可用 | 廚房看板、製作狀態更新、客製資訊顯示 |
| `dashboard` | 可用 | 營運摘要、訂單狀態分布、付款分布 |
| `reports` | 第一版可用 | 唯讀報表、付款分布、品項排行、訂單查詢、CSV 匯出，已支援 real/mock 雙模 |
| `audit-close` | 第一版可用 | 關帳摘要、阻塞檢查、關帳 / 解鎖、歷史紀錄、原因分類、影響範圍、狀態差異，已支援 real/mock 雙模 |
| `menu-admin` | 可用 | 商品新增、圖片、價格、上下架、售完、客製規則 |
| `table-admin` | 可用 | 桌號管理、排序、刪除、暫停接單、固定入口、QR 下載 |

---

## 3. 顧客端頁面清單

| 路由 | 頁面 | 狀態 |
|---|---|---|
| `/` | DineCore 入口 | 可用 |
| `/t/:tableCode` | 桌號入口 | 可用 |
| `/t/:tableCode/unavailable` | 暫停接單頁 | 可用 |
| `/t/:tableCode/menu` | 菜單 | 可用 |
| `/t/:tableCode/cart` | 購物車 | 可用 |
| `/t/:tableCode/checkout` | 確認訂單 | 可用 |
| `/t/:tableCode/checkout/success/:orderId` | 送單成功 | 可用 |
| `/t/:tableCode/order/:orderId` | 訂單追蹤 | 可用 |

---

## 4. 商家端頁面清單

| 路由 | 頁面 | 權限 | 狀態 |
|---|---|---|---|
| `/staff/counter/orders` | 櫃台訂單列表 | `counter / deputy_manager / manager` | 可用 |
| `/staff/counter/orders/:orderId` | 櫃台訂單明細 | `counter / deputy_manager / manager` | 可用 |
| `/staff/kitchen/board` | 廚房看板 | `kitchen / deputy_manager / manager` | 可用 |
| `/staff/manager/dashboard` | 營運總覽 | `deputy_manager / manager` | 可用 |
| `/staff/manager/reports` | 營運報表 | `deputy_manager / manager` | 第一版可用 |
| `/staff/manager/audit-close` | 關帳與稽核 | `manager` | 第一版可用 |
| `/staff/manager/menu-items` | 商品管理 | `deputy_manager / manager` | 可用 |
| `/staff/manager/tables` | 桌號管理 | `counter / deputy_manager / manager` | 可用 |

---

## 5. 顧客端主流程

### 5.1 基本點餐流程
1. 顧客進入 `/t/:tableCode`
2. 系統載入桌號上下文
3. 顧客進入 `/t/:tableCode/menu`
4. 顧客選擇商品與客製選項
5. 商品加入子購物車
6. 顧客進入 `/t/:tableCode/cart`
7. 顧客檢查各子購物車內容
8. 顧客進入 `/t/:tableCode/checkout`
9. 顧客確認合單結果並送出
10. 系統導向 `/t/:tableCode/checkout/success/:orderId`
11. 顧客可進入 `/t/:tableCode/order/:orderId` 追單

### 5.2 目前已支援的顧客端能力
- 桌號上下文載入
- 本機加點目標已可由 API 指定 `orderingCartId`
- `ordering_session_token` 已完成「未結單訂單作用域」運作
- 顧客端 `entry / menu / cart / checkout / order-tracker` 已具備 real/mock 雙模 API adapter
- `dineCore` backend 已落地第一版顧客端主流程 API 與最小 schema / seed
- staff 端 `staff-auth / reports / audit-close` 已具備 real/mock 雙模 API adapter
- `dineCore` backend 已落地第一版 staff auth、報表與關帳 API
- `cart / checkout` 已支援 5 秒 polling 與背景頁暫停
- 菜單分類切換
- 商品客製選項
- 備註編輯
- 子購物車模式
- 合單確認
- 送單成功摘要
- 追單時間線

---

## 6. 商家端主流程

### 6.1 登入與工作台
1. 進入任一 `/staff/...` 頁面
2. 未登入時顯示滿版登入頁
3. 登入後依角色顯示可進入頁面
4. 無權限頁面以登入遮罩阻擋

### 6.2 櫃台流程
1. 櫃台查看訂單列表
2. 進入訂單明細
3. 更新付款狀態
4. 更新訂單狀態
5. 可標記取餐完成
6. 可取消訂單並填寫原因

### 6.3 廚房流程
1. 廚房查看未完成訂單
2. 依單張訂單查看品項、客製、備註
3. 更新製作狀態

### 6.4 管理流程
1. 店長或副店長查看營運總覽
2. 進入商品管理維護菜單
3. 進入桌號管理維護桌位與 QR

---

## 7. 已完成的營運能力

### 7.1 顧客端
- 固定桌號入口
- 點餐流程
- 子購物車
- 客製選項
- 備註
- 合單確認
- 訂單送出
- 訂單追蹤

### 7.2 商家端
- 登入
- 角色限制
- 櫃台訂單處理
- 廚房狀態更新
- 營運摘要
- 營運報表
- 關帳與稽核
- 商品管理
- 桌號管理
- QR 下載

---

## 8. 尚未開始或尚未完整化

- `menu-admin` 分類管理
- `menu-admin` 商品分類排序
- `table-admin` 列印版桌號 QR
- 關帳流程
- `counter / kitchen / dashboard` 正式後端 API 對接
- `reports` 匯出專用後端 endpoint（若要改成後端直出檔案）

---

## 9. 目前最適合的下一步

若以功能完整度排序，下一步建議：

1. guest ordering session 正式後端 API 落地
2. `table-admin` 桌位列印版 QR / 列印樣式
3. `reports / audit-close` 正式 API 對接

若以文件對齊排序，下一步建議：

1. 確保 `reports` 邊界文件與 `ROADMAP / MODULE_MAP / PROGRESS_TRACKER` 一致
2. 補 `audit-close` 邊界文件
