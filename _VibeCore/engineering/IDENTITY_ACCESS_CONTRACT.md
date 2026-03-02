# 身份與 Access Contract

本文件定義平台專案中：

- 身份資料應如何表達
- `authStore.user` 最小欄位應為何
- route access 與角色 / 公司限制應如何表達

目的：
- 避免新專案各自發明身份欄位
- 避免 route access、sidebar、page gate 各自用不同命名
- 讓 auth、身份、授權規則有單一入口

---

## 1. Auth Truth Source

若專案沿用平台既有登入機制：

- 前端登入真相來源只能是 `authStore`
- `login / restoreSession / logout` 一律經 `world.authApi()`
- 不得建立第二份 project-local auth truth
- 不得以 project-specific session API 決定前端是否登入

---

## 2. `authStore.user` 最小身份欄位

`authStore.user` 至少應包含：

- `id`
- `username`
- `name`
- `role`
- `company_id`

建議同時包含：

- `tenant_id`

說明：

- `id`：平台使用者唯一識別
- `username`：帳號識別
- `name`：顯示名稱
- `role`：角色授權判斷
- `company_id`：公司隔離與模組限制判斷
- `tenant_id`：租戶識別

若缺少 `role / company_id / name`：

- 應先補齊後端 `/api/login` 與 `/api/session` payload
- 不得在前端額外建立第二份身份狀態補救

---

## 3. 後端 Payload Contract

若專案需要角色或公司級授權，後端至少應保證：

- `/api/login` 可回傳完整身份欄位
- `/api/session` 可回傳完整身份欄位

最小 user payload 形狀：

```json
{
  "id": 22,
  "tenant_id": "flowCenter",
  "username": "fc_employee_a",
  "name": "一般員工 A1",
  "role": "employee",
  "company_id": "company-a"
}
```

---

## 4. Route Access Contract

每條 route 至少應提供：

```js
meta: {
  access: {
    public: false,
    auth: true
  }
}
```

規則：

- `public` 與 `auth` 必須同時存在
- `public: true, auth: true` 表示公開可進入
- `public: false, auth: true` 表示需登入
- `public: false, auth: false` 視為 disabled route

---

## 5. 角色 / 公司級 Access 擴充欄位

若 route 有角色或公司限制，應統一使用單一擴充欄位：

```js
meta: {
  access: {
    public: false,
    auth: true
  },
  identityAccess: {
    roles: ['employee'],
    includeCompanies: [],
    excludeCompanies: ['company-b']
  }
}
```

欄位語意：

- `roles`：允許角色白名單
- `includeCompanies`：允許公司白名單
- `excludeCompanies`：禁止公司黑名單

`access` 與 `identityAccess` 的分工：

- `access`：表達 route 是公開、需登入、或停用
- `identityAccess`：表達登入後是否符合角色 / 公司限制
- `identityAccess` 必須與 `access` 同級，不得巢狀塞進 `access` 內

規則：

- 同一專案內不得再發明第二套同義欄位命名
- route、sidebar、topbar、layout redirect、page gate 應使用同一套 access helper 解讀這些欄位

---

## 6. Project-local Access Helper

若專案存在角色 / 公司級授權：

- 應建立 project-local access helper
- helper 專責解讀 route meta 的擴充欄位
- sidebar / topbar / layout / route redirect 應共用這份 helper

helper 的責任：

- 判斷 route 是否可進入
- 過濾目前身份可見的 routes
- 提供 fallback path 計算

不應由 helper 負責：

- 決定登入狀態
- 發請求抓 session
- 持有第二份身份狀態

---

## 7. 禁止事項

- 不得在 page / component 各自手刻角色判斷當成唯一 access 規則
- 不得在 sidebar 自行重建另一份模組可見性矩陣
- 不得在不同模組中使用不同欄位名表達同一種身份限制
- 不得把 `identityAccess` 巢狀放進 `access`
- 不得用第二份 reactive state 補 `authStore.user`

---

## 8. 驗證清單

至少應驗證：

1. 未登入時，公開 routes 與需登入 routes 行為正確
2. 已登入 employee 時，只能看到 employee 允許模組
3. 已登入 manager 時，只能看到 manager 允許模組
4. company 限制能正確影響 route 與導覽
5. 重新整理後 `authStore.user` 仍能還原足夠欄位

---

## 9. 與其他文件的關係

- 專案骨架：[`PROJECT_SCAFFOLD_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/_VibeCore/engineering/PROJECT_SCAFFOLD_CONTRACT.md)
- 模組樣板：[`MODULE_TEMPLATE_CONTRACT.md`](/Users/zhangyu/Desktop/moducore_platform/_VibeCore/engineering/MODULE_TEMPLATE_CONTRACT.md)
- auth 單一真相來源：`AC-WC-project-auth-single-source-pattern.md`
