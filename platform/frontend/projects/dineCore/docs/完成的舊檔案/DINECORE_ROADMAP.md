# DINECORE_ROADMAP

更新日期：2026-03-03

## 1. 目前走到哪一步
- 目前主階段：`Phase C`
- 目前位置：顧客端主流程已打通，商家端核心工作台已打通，管理端已有商品管理與桌號管理
- 目前判定：專案已經從「架構建立」走到「可操作 mock 營運閉環」

## 2. 已完成里程碑

### Milestone A1 架構成形
- 專案骨架建立
- 模組註冊完成
- user stories、module map、roadmap、data model、API contract 建立
- API 邊界與 mock runtime 建立
- `world.store -> module service.js -> project api -> mock runtime` 架構定型

### Milestone A2 顧客端主流程
- 固定桌號入口
- 菜單瀏覽
- 子購物車
- 客製選項與備註
- 確認訂單
- 送出訂單
- 成功頁
- 訂單追蹤
- 顧客端 top bar 與唯一導航入口收斂

### Milestone A3 商家端營運閉環
- 員工登入 / 登出
- 角色權限控制
- 櫃台訂單列表與明細
- 訂單狀態更新
- 付款狀態更新
- 取消訂單
- 取餐完成
- 廚房看板與製作狀態
- Dashboard 營運摘要

### Milestone A4 管理端基礎能力
- `menu-admin`
  - 分類新增
  - 分類重新命名
  - 分類排序
  - 分類刪除
  - 商品新增
  - 商品圖片上傳
  - 既有商品變更所屬分類
  - 價格調整
  - 上下架
  - 售完切換
  - 客製規則管理
- `table-admin`
  - 新增桌位
  - 編輯桌位
  - 排序與刪除
  - 固定入口連結
  - QR 預覽與下載
  - 暫停接單 / 恢復接單

## 3. 目前正在收斂的需求

### Milestone B1 文件與現況對齊
- `CURRENT_STATE` 已整理
- `PROGRESS_TRACKER` 已重寫
- `MODULE_MAP` 已重寫
- `ROADMAP` 已重寫
- 後續若功能有新增，這四份文件要同步更新

### Milestone B2 管理端收斂
- `menu-admin` 刪除分類前提示與使用中保護可再強化
- `menu-admin` 商品列表可再補分類篩選與操作提示
- `table-admin` 已完成基本管理，空間配置能力先記為下一階段藍圖

## 4. 下一步里程碑需求

### Milestone C1 報表模組 `reports`
- 定義頁面邊界
- 定義資料欄位
- 定義角色限制
- 規劃每日營收摘要
- 規劃訂單明細查詢
- 規劃匯出能力

### Milestone C2 關帳模組 `audit-close`
- 定義流程
- 定義角色限制
- 定義店長解鎖規則
- 規劃關帳後鎖定
- 規劃稽核留痕

### Milestone C3 文件與舊檔清理
- 清理舊文件亂碼
- 補一份商家端操作地圖
- 補一份 mock flow 轉正式 API 的遷移說明

## 5. 後續版本里程碑

### Milestone D1 正式 API 遷移
- 用正式 backend API 取代 mock runtime
- staff session 改為正式登入來源
- 報表與關帳改用正式資料來源

### Milestone D2 2.0 藍圖能力
- 空間配置管理
- `SVG + JSON` 店面平面圖
- 桌位位置與區域視覺化

## 6. 建議優先順序
1. 先定 `reports` 模組邊界
2. 再定 `audit-close` 模組邊界
3. 再清理舊文件與補操作地圖
4. 最後才開始正式 API 遷移規劃
