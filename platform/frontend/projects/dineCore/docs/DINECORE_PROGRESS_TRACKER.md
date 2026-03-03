# DINECORE_PROGRESS_TRACKER

更新日期：2026-03-03

## 1. 目前專案進度
- 總體階段：`Phase C`
- 目前狀態：顧客端與 staff-auth / reports / audit-close 已進入 real/mock 雙模，其餘商家端仍以 mock 為主
- 當前重點：從顧客端與管理端正式後端，逐步推進到 `counter / kitchen / dashboard`

## 2. 現在走到哪一步

### 已完成
- 顧客端點餐主流程已完成
- 顧客端正式後端最小主鏈已完成
- `staff-auth / reports / audit-close` 正式後端最小主鏈已完成
- 商家端櫃台 / 廚房 / Dashboard 已完成
- 員工登入與權限已完成
- `menu-admin` 已完成基礎到進階管理版
- `table-admin` 已完成基礎到進階管理版
- 架構邊界已依平台哲學收斂
- 核心文件已開始重寫對齊現況

### 目前正在做
- 收斂顧客端與管理端正式後端驗證結果與文件
- 規劃 `counter / kitchen / dashboard` 的正式 API 切換順序

## 3. 模組進度
| 模組 | 目前狀態 | 備註 |
|---|---|---|
| `entry` | 已完成 real/mock 雙模 | 固定桌號入口與 ordering session 可用 |
| `menu` | 已完成 real/mock 雙模 | 菜單與客製可用 |
| `cart` | 已完成 real/mock 雙模 | 子購物車、編輯、同步可用 |
| `checkout` | 已完成 real/mock 雙模 | 已收斂為確認訂單與送單 |
| `order-tracker` | 已完成 real/mock 雙模 | 訂單追蹤可用 |
| `staff-auth` | 已完成 real/mock 雙模 | 登入 / 登出 / session 可用 |
| `counter` | 已完成可操作版 | 列表、明細、付款、取消、取餐完成 |
| `kitchen` | 已完成可操作版 | 看板與製作狀態可用 |
| `dashboard` | 已完成可操作版 | 摘要與狀態分布可用 |
| `menu-admin` | 已完成進階管理版 | 分類、商品、圖片、價格、上下架、客製規則可管 |
| `table-admin` | 已完成進階管理版 | 桌號、排序、刪除、固定入口、QR、接單控制可管 |
| `reports` | 第一版可用 | 骨架、real/mock API、唯讀報表頁已完成 |
| `audit-close` | 第一版可用 | 骨架、real/mock API、關帳 / 解鎖 flow 已完成 |

## 4. 已寫入里程碑的需求
- `reports` 模組規劃
- `audit-close` 模組規劃
- 舊文件亂碼清理
- 商家端操作地圖
- mock flow 轉正式 API 遷移說明
- 2.0 空間配置管理藍圖已另存 [`下一階段藍圖.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\下一階段藍圖.md)

## 5. 目前最主要缺口
1. 舊文件仍有部分亂碼
2. `counter / kitchen / dashboard` 尚未開始切正式 API
3. `reports` 匯出欄位細節尚未完整化，但第一版摘要與篩選條件已進 CSV
4. `audit-close` 稽核細節已補上原因分類、影響範圍與狀態差異，仍未進入正式後端模型
5. 顧客端與 `staff-auth / reports / audit-close` 已完成前後端最小落地，但其餘 staff 模組尚未切 real API

## 6. 工程規範狀態
- `store` 使用 `world.createStore(...)`
- 共享真相只走 API 邊界
- project-level `services/` 不承載 business state
- `LayoutRoot` 為可降級容器
- 頁面依資料存在與否決定顯示，不因模組缺席直接報錯

## 7. 驗證狀態
- `VITE_PROJECT=dineCore` build 已成功
- `dineCore` backend schema / seed 已匯入本機資料庫
- `entry-context -> menu -> carts -> add-item -> checkout-summary -> checkout-submit -> order-tracker` 已以本機 API 驗證通過
- `login -> reports summary/orders -> audit-close summary/close/unlock/history` 已以本機 API 驗證通過

## 8. 下一步建議
1. 把最新 `real-mode` build 發佈並做真實畫面驗證
2. 再開始 `counter / kitchen / dashboard` real API 對接
3. 最後清理舊文件與補操作地圖
