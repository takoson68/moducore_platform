# PROJECT_CONFIG_SCHEMA.md
## VibeCore Project Config Schema

---

## 0. 本文件的用途
本文件定義新 project 在 `project.config.js` 中必須遵守的最低欄位結構。

本文件的目的，是讓：

- 新專案生成時有固定的設定檔 schema
- AI / Agent 不需要每次自行猜測 `project.config.js` 應包含哪些欄位
- project 的最低宣告需求可直接落在可執行的工程檔中

---

## 1. 適用範圍
本文件適用於：

- `platform/frontend/projects/<project-name>/project.config.js`

本文件不適用於：

- world 規則
- core 設計
- modules 內部設定

---

## 2. 核心原則

- 若新 project 未生成 `index.md` 與 `PROJECT_CONTEXT.md`，則 `project.config.js` 必須承載最低宣告資訊
- `project.config.js` 必須同時服務：
  - 執行時載入
  - 專案識別
  - 最低背景宣告
- 不得只保留執行欄位而完全缺少專案語意欄位

---

## 3. 必填欄位
每個新 project 的 `project.config.js` 至少必須包含以下欄位：

1. `name`
   - 型別：`string`
   - 用途：專案內部名稱

2. `title`
   - 型別：`string`
   - 用途：顯示用專案名稱

3. `tenant_id`
   - 型別：`string`
   - 用途：租戶或專案識別值

4. `modules`
   - 型別：`string[]`
   - 用途：啟用模組清單

5. `description`
   - 型別：`string`
   - 用途：專案目的或簡述

6. `scenario`
   - 型別：`string`
   - 用途：主要使用情境或問題場景

---

## 4. 選填欄位
以下欄位非必填，但若需求存在，應優先使用這些欄位，而不是任意發明命名：

1. `skills`
   - 型別：`string[]`
   - 用途：專案會依賴的 skill 名稱

2. `capabilities`
   - 型別：`string[]`
   - 用途：專案所依賴的能力集合

3. `constraints`
   - 型別：`string[]`
   - 用途：技術、商務或時程限制

4. `assumptions`
   - 型別：`string[]`
   - 用途：生成與設計時的前提假設

---

## 5. 最小合法範例

```js
export default {
  name: 'project-c',
  title: 'Project C',
  tenant_id: 'project-c',
  modules: ['welcome'],
  description: '最小可運作的新專案骨架。',
  scenario: '用於驗證新 project 生成流程。',
  skills: [],
  constraints: []
}
```

---

## 6. 較完整範例

```js
export default {
  name: 'opsdesk',
  title: 'OpsDesk',
  tenant_id: 'opsdesk',
  modules: ['shell', 'dashboard', 'task'],
  description: '提供營運工作台的前端 project instance。',
  scenario: '用於營運人員查看儀表板、任務與流程狀態。',
  skills: ['auth', 'routing'],
  capabilities: ['dashboard', 'task-management'],
  constraints: ['先以前端 mock 資料運作', '不生成專案 md 文件'],
  assumptions: ['後端 API 之後再接入']
}
```

---

## 7. 不合法範例
以下情況視為不合法：

### 7.1 缺少最低宣告欄位

```js
export default {
  name: 'project-c',
  modules: ['welcome']
}
```

原因：

- 缺少 `title`
- 缺少 `tenant_id`
- 缺少 `description`
- 缺少 `scenario`

### 7.2 `modules` 不是陣列

```js
export default {
  name: 'project-c',
  title: 'Project C',
  tenant_id: 'project-c',
  modules: 'welcome',
  description: 'test',
  scenario: 'test'
}
```

原因：

- `modules` 必須是 `string[]`

---

## 8. 命名與格式規則

- `name` 建議與資料夾名稱一致
- `tenant_id` 預設與 `name` 一致，除非有多租戶識別需求
- `modules` 內容應與實際建立的模組目錄一致
- 字串欄位不得以空字串取代真實內容，若未知應明確填寫暫時描述

---

## 9. 與其他文件的關係

- `projects/index.md`
  - 定義 project layer 的角色與界線
- `PROJECT_SCAFFOLD_PROTOCOL.md`
  - 定義新專案建立流程
- `PROJECT_GENERATION_PROMPT.md`
  - 提供建立新專案的直接指令

本文件負責：

- 定義 `project.config.js` 的最低合法格式

---
