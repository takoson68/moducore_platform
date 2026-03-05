---
name: dinecore-auth-repair
description: 修復 dineCore staff 401 問題（token/header、staff profile 對應、role/tenant 對齊），並驗證 manager/deputy/counter/kitchen 行為。
---

# DineCore Auth Repair

## 何時使用

- `STAFF_SESSION_REQUIRED` 持續出現
- 登入成功但 staff API 仍 401
- 某些角色應該可用卻被拒絕

## 固定排查流程

1. 驗證 login 回 token
- `POST /api/login` + `X-Project: dineCore`

2. 比對 token 傳遞方式
- 測 `?token=...` 與 `Authorization: Bearer ...`
- 若 Bearer 失敗、query 成功，前端統一改 `tokenQuery: true`

3. 檢查 staff profile 對應
- `users(id, tenant_id, username)`
- `dinecore_staff_profiles(user_id, role, status)`
- 若 user_id 對不上，先 reseed 再清理孤兒 profile

4. 套用修復 seed
- `platform/backend/sql/dinecore/003_dinecore_staff_auth_seed.sql`

5. 逐角色驗證
- manager / deputy / counter / kitchen
- 應確認：
  - manager/deputy/kitchen 可看 kitchen board
  - counter 看 kitchen board 為 403（預期）

## 禁止事項

- 不可直接放寬後端 role 判斷繞過授權
- 不可只修前端而不驗證 DB identity 對齊
