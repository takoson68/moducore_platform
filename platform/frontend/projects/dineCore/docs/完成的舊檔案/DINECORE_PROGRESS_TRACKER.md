# DINECORE_PROGRESS_TRACKER

更新日期：2026-03-04

## 1. 最新進度

- 已完成顧客端 batch 流程
- 已完成櫃台、廚房、dashboard、reports、audit-close 真實 API 串接
- 已完成購物車顧客卡 UI 固定尺寸三欄顯示
- 已清理 staff profile 中文亂碼
- 已整理並歸檔本輪已完成的規劃文件
- 已完成第一批顧客體驗優化：購物車、送單成功頁、追單頁

## 2. 本輪已完成

### 後端
- `dinecore_order_batches` schema 已建立
- `dinecore_cart_items.batch_id` 已接上
- `checkout-submit` 已支援鎖批次與開新批次
- `order-tracker` 已回傳 `batches[]`
- `counter / kitchen` staff API 已支援 batch 視角
- `counter` 付款狀態回切時會同步恢復 guest session

### 前端
- 顧客端 `entry / cart / checkout / order-tracker` 已承接 batch 欄位
- `cart / checkout / order-tracker / counter / kitchen` 頁面已清為 UTF-8 版本
- 購物車顧客卡改為固定尺寸格狀排版
- 同一瀏覽器以 `localStorage` 共用顧客身份
- `cart` 已改為批次導向文案，主按鈕為 `確認本批餐點`
- `checkout success` 已顯示本批批次、品項數、金額與下一批提示
- `order-tracker` 已補最近送出批次與可續點草稿批次提示

### 文件
- 本輪完成的小階段規劃與執行書已移入 `完成的舊檔案/`
- `README / CURRENT_STATE / PROGRESS_TRACKER` 已更新到現況

## 3. 目前待做

| 項目 | 狀態 | 說明 |
|---|---|---|
| `dashboard` batch 視角 | 已完成 | 已整合 reports / counter / kitchen 資料 |
| `reports` 回歸驗證 | 已完成 | 已排除空主單與 draft-only 主單 |
| `audit-close` 回歸驗證 | 已完成 | 已排除空主單造成的誤阻塞 |
| 顧客 / staff 全流程實機回歸 | 待做 | 需以乾淨桌號再跑一次完整流程 |
| `checkout` 確認頁送單說明 | 已完成 | 已補送出後鎖批次與可續點說明 |

## 4. 建議下一步

1. 以乾淨桌號重跑雙瀏覽器顧客流程
2. 驗證櫃台接單、廚房出單、付款完成、關帳的完整閉環
3. 視需要再補 manager 端更細的批次分析指標

## 5. 驗證基準

目前應成立：
- `VITE_PROJECT=dineCore` 可正常 build
- `counter / kitchen` 頁可吃真實 API
- `A01` 清空後可重新從零建立主單、批次與顧客 session
- staff profile 顯示名稱為正常中文
