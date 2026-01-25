【資料庫結構說明】
資料表：users
用途：平台層（Platform-level）登入與世界（tenant）隔離的身分資料來源。
本資料表「不是」完整會員系統。

---

【資料表定義】
資料表名稱：users

此資料表用於支援以下平台能力：
- 使用者登入成功 / 失敗判斷
- tenant（世界 / 專案）隔離測試
- 登入後 world rebuild 行為驗證

---

【欄位說明】

1. id
- 型別：INT UNSIGNED
- 主鍵（Primary Key）
- 自動遞增
- 用途：
  - 系統內部使用者識別
- 備註：
  - 不具任何業務意義

2. tenant_id
- 型別：VARCHAR(50)
- 是否必填：是
- 用途：
  - 表示使用者所屬的世界 / 專案
  - 前端平台用來觸發 world rebuild 的唯一依據
- 備註：
  - tenant_id 代表「在哪個世界」
  - 不代表權限、不代表角色
  - 範例值：
    - project_a
    - project_b
  - tenant_id 為世界隔離的權威來源

3. username
- 型別：VARCHAR(50)
- 是否必填：是
- 用途：
  - 登入帳號識別
- 備註：
  - username 的唯一性以 tenant 為範圍
  - 不同 tenant 可存在相同 username

4. password
- 型別：VARCHAR(255)
- 是否必填：是
- 用途：
  - 登入憑證
- 備註：
  - 目前為明文或簡單雜湊
  - 此階段不以安全性為目標
  - 未來可直接替換為安全雜湊，不需調整 schema

5. status
- 型別：TINYINT
- 是否必填：是
- 預設值：1
- 用途：
  - 使用者啟用狀態
- 值定義：
  - 1 = 啟用（允許登入）
  - 0 = 停用（禁止登入）
- 備註：
  - 用於測試登入失敗情境（帳號存在但不可用）

6. created_at
- 型別：DATETIME
- 是否必填：是
- 預設值：CURRENT_TIMESTAMP
- 用途：
  - 建立時間紀錄
- 備註：
  - 目前不需要更新時間或稽核欄位

---

【索引與限制】

- 主鍵（Primary Key）：
  - id

- 唯一索引（Unique Key）：
  - (tenant_id, username)
  - 說明：
    - 同一 tenant 內 username 不可重複
    - 不同 tenant 可使用相同 username

- 一般索引（Index）：
  - tenant_id
  - 用於登入時依 tenant 快速查詢

---

【明確非目標（此資料表「不是」什麼）】

此 users 資料表「不是」：
- 完整會員系統
- 使用者個資表
- 權限 / 角色系統（RBAC）
- tenant 管理系統

請勿假設以下欄位存在：
- email
- role / permissions
- profile 資料
- tenant 詳細資訊（目前無 tenants table）

---

【使用規範】

- 後端登入 API：
  - 必須以「tenant_id + username」查詢
  - 登入前必須檢查 status 是否為 active

- 前端平台層：
  - 僅使用回傳的 tenant_id 作為 world rebuild 依據
  - 不得從 users 表推論權限或功能可用性

- Project / Module：
  - 不得直接依賴 users 資料表
  - 身分資訊只能透過平台 auth 機制取得

---

【生命週期說明】

此 users 資料表為「刻意最小化設計」。
存在目的僅為驗證：
- 登入流程是否正確
- 世界（tenant）是否能正確隔離
- 平台 world rebuild 行為是否成立

在平台世界切換能力驗證完成前，
禁止基於此表擴充會員相關功能。
