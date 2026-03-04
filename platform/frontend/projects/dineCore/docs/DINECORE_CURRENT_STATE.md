# DINECORE_CURRENT_STATE

更新日期：2026-03-04

## 1. 目前系統狀態

DineCore 已完成下列主流程：
- 顧客端入桌、菜單、購物車、結帳、送單成功、訂單追蹤
- 顧客端 `ordering_session_token` 已改為 `localStorage`
- 同桌點餐已改為「主單 + 多批次送單」模型
- 每次送單後，舊批次鎖定並自動建立新的 `draft batch`
- 櫃台與廚房已改為可讀取 batch-aware API
- staff 登入、櫃台查單、廚房看板皆可走真實後端

## 2. 模組狀態

| 模組 | 狀態 | 補充 |
|---|---|---|
| `entry` | 可用 | 進桌後建立或接續顧客 session |
| `menu` | 可用 | 讀取真實菜單與加購流程 |
| `cart` | 可用 | 已補強批次提示與顧客導向文案 |
| `checkout` | 可用 | 送單後切到下一個 draft batch，成功頁可顯示本批摘要 |
| `order-tracker` | 可用 | 顯示批次歷史、最近送出批次與可續點狀態 |
| `staff-auth` | 可用 | 真實登入 / session 邏輯已接上 |
| `counter` | 可用 | 可查看主單與批次明細、更新付款與訂單狀態 |
| `kitchen` | 可用 | 以批次卡片為單位接單與更新狀態 |
| `dashboard` | 可用 | 已整合今日營收、主單與批次流量視角 |
| `reports` | 可用 | 已排除空主單並可正常匯出 CSV |
| `audit-close` | 可用 | 已排除空主單誤判，關帳摘要可正常回傳 |
| `menu-admin` | 既有功能 | 本輪未調整 |
| `table-admin` | 既有功能 | 本輪未調整 |

## 3. 已完成的關鍵調整

- 修正 ghost session 問題，非 `entry-context` API 不會偷偷建立新顧客
- 顧客 token 從 `sessionStorage` 改為 `localStorage`
- 新增 `dinecore_order_batches`
- `dinecore_cart_items` 已掛上 `batch_id`
- `checkout-submit` 會將當前批次轉為 `submitted`
- 送單後自動建立下一個 `draft batch`
- 購物車主按鈕已改為 `確認本批餐點`
- 送單成功頁已改為顯示本批送單資訊與下一批提示
- 追單頁已區分已送出批次與可繼續加點的草稿批次
- `counter / kitchen` API 已能回傳批次資訊
- `paid -> unpaid` 時，guest session 狀態會正確從 `expired` 恢復為 `active`

## 4. 目前已知限制

- 部分舊 seed 仍有中文編碼問題，已逐步清理
- `dashboard / reports / audit-close` 已完成第一輪 batch 回歸驗證
- 若有已開啟的顧客頁面持續輪詢，同桌資料可能在清空後再次被建立

## 5. 文件入口

優先閱讀：
- `README.md`
- `DINECORE_PROGRESS_TRACKER.md`
- `DINECORE_MODULE_MAP.md`
- 與目前任務直接相關的契約文件

已完成的小階段規劃文件已移到：
- `docs/完成的舊檔案/`
