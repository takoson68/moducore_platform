# PROJECT_SCAFFOLD_PROTOCOL.md
## VibeCore Project Scaffold Protocol

---

## 0. 本文件的用途
本文件定義「建立新 project 實例」時的固定流程與最低骨架。

它處理的是：

- 要建立哪些目錄與文件
- 哪些是預設工程產出
- 哪些只在明確要求時才建立
- 先建立什麼，後建立什麼
- 哪些模板必須被使用

它不處理：

- world 規則
- core 能力設計
- skill 行為設計

補充界線：

- 本文件預設只用於 **新 project 的生成**
- 本文件不構成對既有專案的補件要求
- 除非任務明確指定，否則不得依本文件自動回填舊專案的說明文件

---

## 1. 建立順序
新 project 必須依以下順序建立：

1. 建立專案目錄
2. 建立 `project.config.js`
3. 建立 `layout/`
4. 建立 `modules/`
5. 建立 `styles/`
6. 建立 `docs/`
7. 依需求建立 `components/`、`services/`、`composables/`

只有在任務明確要求時，才另外建立：

8. `index.md`
9. `PROJECT_CONTEXT.md`
10. `decisions/`

---

## 2. 最低目錄骨架

```txt
projects/<project-name>/
  project.config.js
  layout/
  modules/
  styles/
  docs/
```

常見擴充目錄：

```txt
projects/<project-name>/
  components/
  services/
  composables/
```

`docs/` 的用途：

- 放置該新 project 自身的 AI 文件
- 放置專案級補充說明、AI 任務輸入或生成紀錄
- 不得用來覆寫 `_VibeCore/` 的世界或工程裁決
- 不得放置平台共用規格
- 不得重新定義 world、engineering、projects 層規則
- 若內容具平台共用性，必須回到 `_VibeCore/` 對應層級管理

僅在明確要求專案文件時，才另外建立：

```txt
projects/<project-name>/
  index.md
  PROJECT_CONTEXT.md
  decisions/
```

---

## 3. 建立來源
建立新 project 時，必須以下列來源為準：

1. `projects/index.md`
2. `PROJECT_AUTHORING_STANDARD.md`
3. `templates/index.md`
4. 對應模板文件

不得以舊專案直接複製貼上取代模板。
若參考舊專案，仍需回到模板校正章節。

若任務未要求生成 Markdown 專案文件，
則可不進入模板產出步驟。

舊專案的用途僅限於：

- 觀察現有實作
- 提取可重用模式
- 驗證模板是否符合實務

舊專案的用途不包括：

- 作為必須補齊新格式文件的對象
- 被自動寫入 `index.md`、`PROJECT_CONTEXT.md` 或 `decisions/`

---

## 4. `index.md` 的建立規則（僅在明確要求時）

- 必須使用 `templates/PROJECT_INDEX_TEMPLATE.md`
- 必須填入專案名稱
- 必須列出實際存在的目錄與文件
- 必須明確指向 `PROJECT_CONTEXT.md`

---

## 5. `PROJECT_CONTEXT.md` 的建立規則（僅在明確要求時）

- 必須使用 `templates/PROJECT_CONTEXT_TEMPLATE.md`
- 若需求尚未明確，保留章節並標示 `待補`
- 不得省略章節，只能暫留待補內容

---

## 6. `decisions/` 的建立規則（僅在明確要求時）

- 目錄可先為空
- 一旦出現非預設結構、例外路由、特殊模組策略，必須建立第一份 decision 文件
- decision 文件命名應採流水號

---

## 7. 專案完成前的最低檢查
新 project 建立完成後，至少需確認：

- `project.config.js` 已與專案目標一致
- `project.config.js` 已至少包含：
  - `name`
  - `title`
  - `tenant_id`
  - `modules`
  - `description`
  - `scenario`
- `layout/`、`modules/`、`styles/` 已建立
- `docs/` 已建立
- 模組入口與路由已與 `project.config.js` 一致
- 已完成至少一種可驗證回報：
  - 結構驗證：確認 `@project` 解析所需檔案存在
  - 建置驗證：執行 build 或等價檢查

若無法執行建置驗證，回報時必須明確標示：

- `可載入狀態：未實測`
- `結論依據：僅結構檢查`

若任務明確要求生成專案文件，另需確認：

- 已存在 `index.md`
- 已存在 `PROJECT_CONTEXT.md`
- `index.md` 已列出閱讀順序
- `index.md` 已註冊 `PROJECT_CONTEXT.md`
- `decisions/` 已建立

本檢查清單僅適用於：

- 新建立的專案
- 明確要求依本規格重建的專案

不適用於：

- 單純維護中的既有專案
- 未被指定進行文件重構的歷史專案

---

## 8. 對 AI / Agent 的建立指令格式
若要要求 AI 建立新 project，建議使用以下格式：

```md
# 任務名稱：建立新專案 <project-name>

請依 `_VibeCore/projects/index.md`、
`_VibeCore/projects/PROJECT_AUTHORING_STANDARD.md`、
`_VibeCore/projects/PROJECT_SCAFFOLD_PROTOCOL.md`
建立新 project，並完成：

1. 建立標準工程骨架
2. 建立 `project.config.js`
3. 建立 `layout/`、`modules/`、`styles/`、`docs/`
4. 若需要，再補 `components/`、`services/`、`composables/`
```

若要連同專案文件一起生成，需明確額外指出：

```md
另外建立專案文件：
- index.md
- PROJECT_CONTEXT.md
- decisions/
```

`project.config.js` 預設至少應宣告：

```js
export default {
  name: '<project-name>',
  title: '<Project Title>',
  tenant_id: '<tenant-id>',
  modules: [],
  description: '<project description>',
  scenario: '<project scenario>',
  skills: [],
  constraints: []
}
```

---
## Module State Rule
- 若 project 採用 module 架構，模組必須保有自己的 `store.js` 作為業務狀態邊界。
- `services/` 可建立，但只允許承載 project-level 內容，例如 API 呼叫、transport、純函式轉換、專案級協調入口。
- `services/` 不得承載模組私有狀態，不得替代 module store，不得引入跨模組耦合。
- `modules/index.js` 若支援模組安裝，必須同時處理 `setup.routes` 與 `setup.stores`。
- 未明確授權前，不得把多個模組的狀態集中到 project-level service。
