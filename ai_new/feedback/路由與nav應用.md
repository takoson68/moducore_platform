# 路由與 nav 應用（Multi-Nav Projection）

本文件整理 `frontend` 內 Multi-Nav Projection 的規則與範例，涵蓋 `meta.access`、`meta.nav[]` 與 `navParent` 的行為。

## 資料來源

- `platform/frontend/src/app/nav/resolveNavProjection.js`
- `platform/frontend/src/app/container/register.js`
- `platform/frontend/src/router/routes.js`
- `platform/frontend/projects/project-a/modules/*/routes.js`

## 核心概念

Multi-Nav Projection 指的是：
- 同一條 route 可以投影到多個導航區域（例如 sidebar、topbar）。
- 投影規則主要由 `meta.nav[]` 控制；若沒有 `meta.nav[]`，則以 `meta.access` 與 `defaultAreas` 推導出預設投影。

## 規則整理

### 1) `meta.access`（可見性與可投影前置條件）

路由註冊階段會先驗證 `meta.access`：
- `meta.access.public` 與 `meta.access.auth` 必須是布林值。
- 若 `meta.access.public === true` 且 `meta.auth === false`，會拋錯。

投影階段（`resolveNavProjection`）會再檢查：
- 若未提供 `meta.nav[]`，則必須同時存在 `public` 與 `auth` 的布林值，才會進入預設投影。
- 若 `meta.nav[]` 存在，則不再要求 `meta.access` 作為投影條件。

### 2) `meta.nav[]`（多區域投影規則）

`meta.nav` 必須是陣列，元素代表一個投影目標：
- 每個 entry 需要至少包含 `area`。
- 可選：`label`、`order`、`parent`。

行為細節：
- `meta.nav` 是空陣列時，代表「不投影到任何 nav」，會被直接略過。
- `meta.nav` 有內容時，會逐筆投影到對應 `area`。
- 未指定 `label` 時，會使用 fallback：`meta.label || route.name || route.path`。
- `order` 若不是有限數字，預設為 `0`。

### 3) `navParent` 與 `parent`

- `meta.navParent` 會在路由展平時自動產生（見 `register.js/flattenRoutes`），用於把子路由投影到父路由之下。
- `meta.nav[]` 的 entry 若有 `parent`，會優先使用該值；否則回退到 `meta.navParent`。

> 優先序：`navEntry.parent` > `meta.navParent` > `null`

### 4) 預設投影（當沒有 `meta.nav[]`）

當 `meta.nav` 不存在（非陣列）且 `meta.access` 合法時：
- 會依 `resolveNavProjection` 的 `defaultAreas` 將路由投影到各區域。
- 預設 `defaultAreas = ['sidebar']`。

### 5) 排序規則

每個區域內的 nav items 會依下列規則排序：
1. `order` 由小到大
2. 若 `order` 相同，使用 `label` 字典序

## 範例

### 範例 A：同一路由投影到 sidebar + topbar

來源：`platform/frontend/projects/project-a/modules/welcome/routes.js`

```js
export const routes = [{
  path: '/',
  meta: {
    access: {
      public: true,
      auth: true
    },
    nav: [
      { area: 'sidebar', label: '歡迎光臨', order: 1 },
      { area: 'topbar', label: '歡迎光臨', order: 1 }
    ]
  }
}]
```

結果：
- 會同時出現在 sidebar 與 topbar。

### 範例 B：父子路由 + `meta.child` 自動 navParent

來源：`platform/frontend/projects/project-a/modules/about/routes.js`

```js
export const routes = [
  {
    path: '/about',
    meta: {
      access: { public: true, auth: true },
      nav: [
        { area: 'sidebar', label: '關於我的內容', order: 2 },
        { area: 'topbar', label: '關於我的內容', order: 2 }
      ],
      child: [
        {
          path: '/about/team',
          meta: {
            access: { public: true, auth: true },
            nav: [
              { area: 'sidebar', label: 'About · Team', order: 3 }
            ]
          }
        }
      ]
    }
  }
]
```

展平時：
- 子路由會被加上 `meta.navParent = '/about'`。
- 子路由的 `nav` entry 未指定 `parent`，因此會使用 `meta.navParent`。

### 範例 C：無 `meta.nav[]` 的預設投影

```js
{
  path: '/docs',
  name: 'docs',
  meta: {
    access: { public: true, auth: true },
    label: '文件'
  }
}
```

結果：
- 因為 `meta.nav` 不存在且 `access` 合法，會被投影到 `defaultAreas`（預設 sidebar）。
- label 會使用 `meta.label`。

### 範例 D：`meta.nav = []` 明確禁止投影

```js
{
  path: '/hidden',
  meta: {
    access: { public: true, auth: true },
    nav: []
  }
}
```

結果：
- 直接略過，不產生任何 nav item。

## 快速檢查清單

- `meta.access.public` 與 `meta.access.auth` 必須是布林值。
- 想控制多區域投影，請使用 `meta.nav[]`。
- 要關閉投影，用 `meta.nav = []`。
- 子路由若要自動掛在父路由下，確保父路由存在且由 `flattenRoutes` 產生 `meta.navParent`。
- 排序以 `order` 為主，同序再比 `label`。
