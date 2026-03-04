# 購物車及訂單流程 code task 拆解

## 0. 文件用途

本文件用於將前面三份規格文件，拆成可直接執行的工程任務。

本文件只關心：

- 先做什麼
- 每一步要改哪些層
- 每一步完成後要驗證什麼

本文件不再重述世界觀與流程理由。

---

## 1. 任務分期

建議分成五個 Phase：

1. Phase A：資料模型落地
2. Phase B：顧客端 batch API 落地
3. Phase C：前端 cart / checkout 對齊 batch
4. Phase D：tracker / 商家端對齊 batch
5. Phase E：清理舊語意與補測試資料

---

## 2. Phase A：資料模型落地

### Task A1：新增 `dinecore_order_batches`

修改範圍：

- `platform/backend/sql/dinecore/`

工作內容：

- 新增 batch table schema
- 補外鍵到 `dinecore_orders`
- 補 `batch_no` 唯一鍵
- 補 `order_id + status` 索引

完成標準：

- DB 可建立批次表

驗證：

- 可成功建立 table
- 可手動 insert 一筆 draft batch

---

### Task A2：為 `dinecore_cart_items` 新增 `batch_id`

修改範圍：

- `platform/backend/sql/dinecore/`

工作內容：

- 新增 `batch_id`
- 補 `batch_id` 外鍵
- 保留 `order_id` 作相容欄位

完成標準：

- cart item 可清楚掛到某個 batch

驗證：

- insert cart item 時可同時寫入 `order_id` 與 `batch_id`

---

### Task A3：回填舊資料到 batch 結構

修改範圍：

- `platform/backend/sql/dinecore/`
- 必要時補一次性腳本

工作內容：

- 對既有 `dinecore_orders`
  - 每張單補一筆 `batch_no = 1`
- 將既有 `dinecore_cart_items` 掛到對應 batch

完成標準：

- 舊資料仍可讀
- 後續 API 不會因缺 `batch_id` 失敗

驗證：

- 舊資料查詢後，每筆 item 都有 batch

---

## 3. Phase B：顧客端 batch API 落地

### Task B1：調整 `entry-context`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 取得或建立主單
- 取得或建立目前最新 `draft batch`
- response 補：
  - `current_batch_id`
  - `current_batch_no`
  - `current_batch_status`

完成標準：

- 進桌號後就能拿到當前 draft batch

驗證：

- 首次進桌號會有 `batch-1`
- 已有 draft batch 時不重建新 batch

---

### Task B2：調整 `GET /carts`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 只讀目前 `draft batch`
- 回：
  - `currentBatchId`
  - `currentBatchNo`
  - `currentBatchStatus`
  - `participantCount`
  - `submittedBatches`

完成標準：

- cart payload 已有 batch 語意

驗證：

- 同桌多顧客可看到相同 draft batch
- 已送出批次不混在可編輯 cart item 裡

---

### Task B3：調整 `add-item / update-item / change-item-quantity`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 所有 cart mutation 一律只操作當前 `draft batch`
- 若 batch 非 `draft`
  - 回 `BATCH_LOCKED`

完成標準：

- 已送出批次無法再被修改

驗證：

- 送單後再打 cart mutation 會被拒絕

---

### Task B4：重寫 `checkout-submit`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 將當前 `draft batch` 改為 `submitted`
- 寫入 `submitted_at`
- 寫入 `locked_at`
- 立即建立下一個新的 `draft batch`
- response 補：
  - `submittedBatchId`
  - `submittedBatchNo`
  - `nextBatchId`
  - `nextBatchNo`

完成標準：

- 一次送單後，舊批次鎖定，新批次立即可用

驗證：

- 送單前後 DB 可看出 batch 狀態切換

---

### Task B5：調整 `checkout-summary`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 只統計目前 `draft batch`
- 不再把整張主單歷史內容混進 summary

完成標準：

- checkout 顯示的就是本次準備送出的那一批

驗證：

- 第二輪加點時，summary 不包含第一輪已送出內容

---

### Task B6：調整 `order-tracker`

修改範圍：

- `platform/backend/src/Controllers/DineCoreGuestApiController.php`

工作內容：

- 回主單摘要
- 回 `batches[]`
- 每批次回 items / subtotal / status / submittedAt

完成標準：

- tracker 可清楚看出批次順序

驗證：

- 送兩輪後 tracker 能看到 batch-1 與 batch-2

---

## 4. Phase C：前端 cart / checkout 對齊 batch

### Task C1：entry store 補 batch 狀態

修改範圍：

- `platform/frontend/projects/dineCore/modules/entry/store.js`

工作內容：

- 補：
  - `currentBatchId`
  - `currentBatchNo`
  - `currentBatchStatus`

完成標準：

- 前端入口狀態已知道自己在哪個 draft batch

---

### Task C2：cart store 補 batch payload

修改範圍：

- `platform/frontend/projects/dineCore/modules/cart/store.js`

工作內容：

- 補：
  - `currentBatchId`
  - `currentBatchNo`
  - `currentBatchStatus`
  - `participantCount`
  - `submittedBatches`

完成標準：

- cart store 已完整承接新 payload

---

### Task C3：cart page 輪詢切換 batch

修改範圍：

- `platform/frontend/projects/dineCore/modules/cart/pages/CartPage.vue`

工作內容：

- 輪詢時檢查 `currentBatchId`
- 若 batch 改變或已非 `draft`
  - 清 editor
  - 切到新 draft batch
  - 顯示提示

完成標準：

- A 送單後，B 停留 cart 頁也能自動切到新 draft batch

---

### Task C4：checkout store / page 對齊新 submit response

修改範圍：

- `platform/frontend/projects/dineCore/modules/checkout/store.js`
- `platform/frontend/projects/dineCore/modules/checkout/pages/CheckoutPage.vue`

工作內容：

- submit 成功後清掉舊 draft batch 上下文
- 若 batch 已失效，阻止重複送單

完成標準：

- 不會重複送出同一批

---

### Task C5：menu page 對齊 batch 鎖定

修改範圍：

- `platform/frontend/projects/dineCore/modules/menu/store.js`
- `platform/frontend/projects/dineCore/modules/menu/pages/MenuPage.vue`

工作內容：

- 若加購時 API 回 `BATCH_LOCKED`
  - 重新抓上下文
  - 切到新 draft batch

完成標準：

- 不會把商品加到舊批次

---

## 5. Phase D：tracker / 商家端對齊 batch

### Task D1：tracker 顯示批次列表

修改範圍：

- `platform/frontend/projects/dineCore/modules/order-tracker/`

工作內容：

- UI 顯示 `batches[]`
- 每批次顯示：
  - 批次編號
  - 狀態
  - 送單時間
  - 品項
  - 小計

完成標準：

- tracker 不再只是平面單張訂單

---

### Task D2：櫃台端對齊批次

修改範圍：

- `platform/backend/src/Controllers/DineCoreStaffApiController.php`
- `platform/frontend/projects/dineCore/modules/counter/`

工作內容：

- 櫃台可看主單總覽
- 也可看各批次明細

完成標準：

- 可辨識首單與加點單

---

### Task D3：廚房端對齊批次

修改範圍：

- `platform/backend/src/Controllers/DineCoreStaffApiController.php`
- `platform/frontend/projects/dineCore/modules/kitchen/`

工作內容：

- 以 batch 為主要出單單位

完成標準：

- 廚房看板知道這是第幾輪送單

---

## 6. Phase E：清理舊語意與補測試資料

### Task E1：清理舊 order 草稿語意

修改範圍：

- backend controller / query
- frontend store / page 文案

工作內容：

- 移除仍把 `order` 當單次草稿單的邏輯

完成標準：

- 專案內語意一致：主單是容器，batch 才是送單單位

---

### Task E2：補 demo seed

修改範圍：

- `platform/backend/sql/dinecore/`

工作內容：

- 補首單 + 第二輪加點的 demo data

完成標準：

- 本機可直接驗證多批次流程

---

### Task E3：補驗證腳本或測試清單

修改範圍：

- `docs/`
- 必要時 backend test / manual verification notes

工作內容：

- 補雙瀏覽器驗證清單
- 補送單後輪詢驗證清單

完成標準：

- 下次驗證不需重新口頭整理流程

---

## 7. 建議執行順序

建議直接照這個順序做：

1. A1
2. A2
3. A3
4. B1
5. B2
6. B3
7. B4
8. B5
9. B6
10. C1
11. C2
12. C3
13. C4
14. C5
15. D1
16. D2
17. D3
18. E1
19. E2
20. E3

---

## 8. 第一階段最小里程碑

若要先做一個最小可驗證版本，第一階段至少做到：

- A1
- A2
- A3
- B1
- B2
- B3
- B4
- C1
- C2
- C3
- C4

完成這一批後，至少可以驗證：

- 送單後舊批次被鎖住
- B 顧客輪詢後切到新 draft batch
- 後續加點不再污染上一批

---

## 9. 開工建議

若下一步要正式進 code，我建議從：

- `A1 + A2 + A3`

先把資料模型落地，再進 controller。

原因：

- 若資料層還沒切乾淨，後端流程改到一半一定會反覆重寫

