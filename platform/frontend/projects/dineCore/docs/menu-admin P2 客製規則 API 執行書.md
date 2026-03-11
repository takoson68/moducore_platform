# menu-admin P2 客製規則 API 執行書

更新日期：2026-03-11
狀態：已完成

## 1. 目標

本文件原本用來定義 `dineCore` `menu-admin` 的 `P2` 客製規則真實 API 落地。
本次更新後，文件改為完成紀錄，反映目前實作已落地的現況。

本階段完成的能力如下：

1. `add-option-group`
2. `update-option-group`
3. `delete-option-group`
4. `add-option`
5. `update-option`
6. `delete-option`
7. `update-default-options`

## 2. 實作結果

### 2.1 後端 routes

已補齊以下 routes：

1. `POST /api/dinecore/staff/menu/add-option-group`
2. `POST /api/dinecore/staff/menu/update-option-group`
3. `POST /api/dinecore/staff/menu/delete-option-group`
4. `POST /api/dinecore/staff/menu/add-option`
5. `POST /api/dinecore/staff/menu/update-option`
6. `POST /api/dinecore/staff/menu/delete-option`
7. `POST /api/dinecore/staff/menu/update-default-options`

### 2.2 權限與 API 風格

延續既有 `staff menu API` 風格：

- 驗證 staff session
- 驗證 `manager / deputy_manager` 權限
- 不建立第二套 auth truth
- 成功後統一回傳更新後單筆 `item`

### 2.3 資料模型

本階段維持既有欄位，不拆表、不改 schema：

- `dinecore_menu_items.option_groups_json`
- `dinecore_menu_items.default_option_ids_json`

### 2.4 資料一致性

後端已補上統一 normalization 與 persistence 邏輯，確保：

- group id 不重複
- option id 不重複
- `single` 群組最多只保留一個 default option
- default options 只會保存實際存在的 option id
- 刪除群組後，該群組的 option 與 default 關聯會一起移除
- 刪除 option 後，default options 不會殘留髒資料
- 傳入非法 option id 時，會被過濾，不會污染資料

## 3. 前端結果

`platform/frontend/projects/dineCore/modules/menu-admin/service.js` 已改為：

- `apiMode=real` 時優先呼叫真實 API
- mock fallback 保留

涉及方法：

1. `addMenuAdminOptionGroup`
2. `addMenuAdminOption`
3. `updateMenuAdminOptionGroup`
4. `deleteMenuAdminOptionGroup`
5. `updateMenuAdminOption`
6. `deleteMenuAdminOption`
7. `updateMenuAdminDefaultOptions`

`store.js` 維持既有單筆 `item` patch 模式，不新增新狀態中心。

`MenuAdminPage.vue` 只做了必要的錯誤訊息補強，未重構整頁。

## 4. 驗證結果

已完成：

- `php -l platform/backend/src/Controllers/DineCoreStaffApiController.php`
- `php -l platform/backend/src/routes.php`
- `VITE_PROJECT=dineCore npm run build`

另外已用真實 DB 直接驗證以下流程：

1. 新增 option group
2. 新增 option
3. 將同群組 default options 設成多個
4. 把群組從 `multi` 改成 `single`
5. 確認同群組 default options 自動收斂為最多一個
6. 修改 option 名稱與加價
7. 刪除 option 後確認 default options 乾淨
8. 傳入非法 option id 更新 default options，確認不會寫入髒資料
9. 刪除 option group 後確認 group 與 default 關聯一併清理

驗證後已將測試資料還原。

## 5. 修改檔案

- `platform/backend/src/routes.php`
- `platform/backend/src/Controllers/DineCoreStaffApiController.php`
- `platform/frontend/projects/dineCore/modules/menu-admin/service.js`
- `platform/frontend/projects/dineCore/modules/menu-admin/pages/MenuAdminPage.vue`

## 6. 判定

`menu-admin P2` 已完成，且目前 `menu-admin` 已無 P0 / P1 / P2 的真實 API 缺口。

後續若再有 menu-admin 工作，應改以：

- 營運流程驗證
- UI 使用細節微調
- 顧客端整段點餐整合驗證

為主，而不是再補本輪 API 基礎能力。

## 7. 已知限制

- option group / option 目前仍採 `option_groups_json` 與 `default_option_ids_json` 儲存
- 非法 option id 目前採後端過濾，不直接報錯
- 前端僅補必要錯誤提示，未針對整體編輯體驗做 UI 重構

## 8. 下一階段建議

`menu-admin` API 基礎能力已補齊，下一步應轉向：

1. 顧客端點餐整合驗證
2. option / default options 的價格與預設顯示驗證
3. 真實營運情境測試
4. 員工後台操作流程細節微調
