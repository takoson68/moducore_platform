# DINECORE_PROGRESS_TRACKER

## 0. 目前判定
- 目前主階段：`Phase C`
- 專案策略：先完成顧客端與商家端的可操作閉環，再往正式 API、店務治理與稽核能力延伸
- 目前狀態：顧客端主流程已可運作；商家端已具備登入、角色限制、商品管理、桌號管理、櫃台、廚房與營運總覽

---

## 1. Phase 狀態

| Phase | 狀態 | 說明 |
|---|---|---|
| `Phase A` 整體架構成形 | 已完成 | 規格、stories、module map、roadmap、資料模型、API 契約已建立 |
| `Phase B` 顧客端主流程打通 | 已完成 | 入口、菜單、購物車、結帳、成功頁、追單頁皆已串上 mock flow |
| `Phase C` 商家端營運閉環 | 進行中 | 商家端登入、櫃台、廚房、商品管理、桌號管理、營運總覽皆可操作 |
| `Phase D` 店務管理能力 | 進行中 | `table-admin` 已建立；完整權限治理、刪除規則、排序規則尚未完成 |
| `Phase E` 報表、稽核、關帳 | 未開始 | 關帳、匯出、稽核與進階報表尚未開始 |

---

## 2. 已完成項目

### 文件與規劃
- 已完成 [`dineCore系統規格書.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\dineCore系統規格書.md)
- 已完成 [`DINECORE_USER_STORIES.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\DINECORE_USER_STORIES.md)
- 已完成 [`DINECORE_MODULE_MAP.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\DINECORE_MODULE_MAP.md)
- 已完成 [`DINECORE_ROADMAP.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\DINECORE_ROADMAP.md)
- 已完成 [`DINECORE_M1_DATA_MODEL.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\DINECORE_M1_DATA_MODEL.md)
- 已完成 [`DINECORE_M1_API_CONTRACT.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\DINECORE_M1_API_CONTRACT.md)

### 工程邊界
- DineCore 採用 `world.store -> module service.js -> project-local api -> mock runtime`
- 已移除 project-level `services/` 對業務狀態的承載
- 共享真相只走 [`mockRequest.js`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\api\mockRequest.js) 與 [`mockRuntime.js`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\api\mockRuntime.js)
- 所有 store 已回到 `world.createStore(...)`
- 商家端登入已獨立為 [`staff-auth`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\modules\staff-auth\index.js) 模組

### 顧客端
- 入口頁可載入桌號與點餐狀態
- 菜單頁可切分類、查看品項、加入購物車
- 購物車支援多人子購物車
- 客製選項與備註編輯已完成
- 結帳頁可顯示按人分組的送單前確認摘要
- 成功頁與追單頁可顯示送出的客製內容與備註
- top bar 已成為唯一顧客端導航入口
- top bar 已補齊購物車 badge 與最新訂單追單入口

### 商家端
- 未登入進入商家端時，會先顯示滿版登入畫面
- 商家端登入後才顯示工作台
- 商家端右上角已補 `登出`
- 商家端頁面已依角色限制：
  - 店長 / 副店長：完整管理頁面
  - 櫃台：僅櫃台相關頁面
  - 廚房：僅廚房相關頁面
- 桌號管理已開放給櫃台、店長與副店長
- 櫃台列表可看訂單、快速改狀態、改付款狀態
- 櫃台明細可取消訂單、填原因、標記取餐完成
- 廚房看板可更新製作狀態
- Dashboard 可看營收、訂單數、狀態分布、熱門品項

### 商品管理 `menu-admin`
- 已可新增商品並直接上架
- 已可上傳商品圖片
- 已可調整商品價格
- 已可切換 `下架 / 重新上架`
- 已可切換 `標記售完 / 恢復供應`
- 已可新增客製群組
- 已可設定群組為 `單選 / 多選`
- 已可設定群組為 `必選 / 可略過`
- 已可在群組下新增選項與加價

### 桌號管理 `table-admin`
- 已可新增桌號
- 已可編輯桌位名稱、桌區、狀態
- 已可切換 `開放點餐 / 暫停接單`
- 已可顯示固定桌邊入口
- 已可複製入口連結
- 已可下載桌邊 QR 圖

---

## 3. 目前進行中
- `Phase C` 商家端營運閉環持續補強
- `menu-admin` 已有第一版客製規則管理，但尚未支援編輯、刪除與預設值管理
- `table-admin` 已有 QR 下載，但尚未支援桌位刪除與排序規則

---

## 4. 下一步預計項目
- 補 `menu-admin` 的客製規則編輯、刪除與預設值管理
- 補 `table-admin` 的桌位刪除與排序規則
- 補正式 API 對接前的欄位校準

---

## 5. 模組狀態

| 模組 | 狀態 | 備註 |
|---|---|---|
| `entry` | 已完成 mock flow | 桌號上下文、入口說明、開始點餐 |
| `menu` | 已完成 mock flow | 分類、品項、圖片、客製、售完與下架反映 |
| `cart` | 已完成 mock flow | 子購物車、編輯品項、備註、客製 |
| `checkout` | 已完成 mock flow | 按人摘要、人工付款流程、送單 |
| `order-tracker` | 已完成 mock flow | 最新訂單追蹤、timeline、歷史訂單 |
| `staff-auth` | 已完成第一版 | 商家端登入、session、登出 |
| `counter` | 已完成可操作版本 | 狀態更新、付款更新、取消、取餐完成 |
| `kitchen` | 已完成可操作版本 | 出餐看板、製作狀態更新、備註與客製顯示 |
| `dashboard` | 已完成可操作版本 | 統計卡、分布摘要、熱門品項 |
| `menu-admin` | 已完成第六版 | 新增商品、圖片、價格、上下架、售完、客製規則建立 |
| `table-admin` | 已完成第三版 | 桌號新增、桌位資訊編輯、固定入口、QR 下載、暫停接單控制 |
| `reports` | 未開始 | `Phase E` 再處理 |
| `audit-close` | 未開始 | `Phase E` 再處理 |

---

## 6. 工程規範監測

### 6.1 store 建立方式
- DineCore 所有 store 均使用 `world.createStore(...)`

### 6.2 模組邊界
- project-level `services/` 不得成為跨模組業務中心
- DineCore 目前沒有 project-level business service

### 6.3 store 與 API 邊界
- `world.store` 只作為前端執行期狀態
- 共享真相只走 API 邊界
- 目前 DineCore 符合此規則

---

## 7. 驗證紀錄
- 多次執行 `VITE_PROJECT=dineCore` build，結果皆成功
- 本次補商家登入流程後，再次 build 成功

---

## 8. 目前風險
- `menu-admin` 尚未包含客製規則編輯、刪除與預設值管理
- `table-admin` 尚未包含桌位刪除與排序規則
- mock API 與未來正式 API 欄位仍需持續對齊
- 關帳、稽核、報表尚未開始，暫不適合視為可營運完整版本
