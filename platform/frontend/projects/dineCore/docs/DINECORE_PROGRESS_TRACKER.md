# DINECORE_PROGRESS_TRACKER

更新日期：2026-03-03

## 1. 目前專案進度
- 總體階段：`Phase C`
- 目前狀態：可操作 mock 營運閉環
- 當前重點：從「功能已可用」收斂到「里程碑、文件、後續需求一致」

## 2. 現在走到哪一步

### 已完成
- 顧客端點餐主流程已完成
- 商家端櫃台 / 廚房 / Dashboard 已完成
- 員工登入與權限已完成
- `menu-admin` 已完成基礎到進階管理版
- `table-admin` 已完成基礎到進階管理版
- 架構邊界已依平台哲學收斂
- 核心文件已開始重寫對齊現況

### 目前正在做
- 把剩餘需求正式寫入里程碑
- 把目前狀態整理成可持續更新的文件
- 收斂下一步應先做 `reports / audit-close` 還是先補管理端細節

## 3. 模組進度
| 模組 | 目前狀態 | 備註 |
|---|---|---|
| `entry` | 已完成 mock flow | 固定桌號入口可用 |
| `menu` | 已完成 mock flow | 菜單與客製可用 |
| `cart` | 已完成 mock flow | 子購物車與備註可用 |
| `checkout` | 已完成 mock flow | 已收斂為確認訂單與送單 |
| `order-tracker` | 已完成 mock flow | 訂單追蹤可用 |
| `staff-auth` | 已完成 mock flow | 登入 / 登出 / session 可用 |
| `counter` | 已完成可操作版 | 列表、明細、付款、取消、取餐完成 |
| `kitchen` | 已完成可操作版 | 看板與製作狀態可用 |
| `dashboard` | 已完成可操作版 | 摘要與狀態分布可用 |
| `menu-admin` | 已完成進階管理版 | 分類、商品、圖片、價格、上下架、客製規則可管 |
| `table-admin` | 已完成進階管理版 | 桌號、排序、刪除、固定入口、QR、接單控制可管 |
| `reports` | 未開始 | 需先定邊界 |
| `audit-close` | 未開始 | 需先定邊界 |

## 4. 已寫入里程碑的需求
- `reports` 模組規劃
- `audit-close` 模組規劃
- 舊文件亂碼清理
- 商家端操作地圖
- mock flow 轉正式 API 遷移說明
- 2.0 空間配置管理藍圖已另存 [`下一階段藍圖.md`](F:\GitHub\moducore_platform\platform\frontend\projects\dineCore\docs\下一階段藍圖.md)

## 5. 目前最主要缺口
1. `reports` 邊界未定
2. `audit-close` 邊界未定
3. 舊文件仍有部分亂碼
4. 正式 API 遷移策略尚未落文件

## 6. 工程規範狀態
- `store` 使用 `world.createStore(...)`
- 共享真相只走 API 邊界
- project-level `services/` 不承載 business state
- `LayoutRoot` 為可降級容器
- 頁面依資料存在與否決定顯示，不因模組缺席直接報錯

## 7. 驗證狀態
- `VITE_PROJECT=dineCore` build 已成功
- 本次主要為文件收斂，未再執行新的功能驗證

## 8. 下一步建議
1. 先定 `reports` 的資料欄位與頁面邊界
2. 再定 `audit-close` 的角色、流程與鎖定規則
3. 最後清理舊文件與補操作地圖
