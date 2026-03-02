# PROJECT_GENERATION_PROMPT.md
## New Project Generation Prompt

---

## 0. 本文件的用途
本文件提供一份可直接交給 AI / Agent 使用的「新專案生成指令模板」。

其用途是：

- 讓新 project 的建立方式固定
- 避免每次建立新專案都重新口述一次規則
- 確保生成結果符合 `_VibeCore/projects/` 的工程規格

---

## 1. 使用前提
在使用本指令前，AI / Agent 應已閱讀：

1. `_VibeCore/STARTUP_DECLARATION.md`
2. `_VibeCore/RootIndex.md`
3. `_VibeCore/projects/index.md`
4. `_VibeCore/projects/PROJECT_AUTHORING_STANDARD.md`
5. `_VibeCore/projects/PROJECT_SCAFFOLD_PROTOCOL.md`

---

## 2. 核心規則

- 新 project 預設只生成工程骨架
- **不生成** `index.md`
- **不生成** `PROJECT_CONTEXT.md`
- **不生成** `decisions/`
- 只在明確要求時，才額外建立 Markdown 專案文件

---

## 3. 標準指令模板

```md
# 任務名稱：建立新專案 <project-name>

請依以下規則建立新 project：

1. 先閱讀：
   - `_VibeCore/projects/index.md`
   - `_VibeCore/projects/PROJECT_AUTHORING_STANDARD.md`
   - `_VibeCore/projects/PROJECT_SCAFFOLD_PROTOCOL.md`

2. 在 `platform/frontend/projects/<project-name>/` 建立新專案骨架。

3. 新專案預設只生成工程內容，不生成：
   - `index.md`
   - `PROJECT_CONTEXT.md`
   - `decisions/`

4. 必須建立：
   - `project.config.js`
   - `layout/`
   - `modules/`
   - `styles/`
   - `docs/`

5. 視需求建立：
   - `components/`
   - `services/`
   - `composables/`

6. `project.config.js` 必須至少包含：
   - `name`
   - `title`
   - `tenant_id`
   - `modules`
   - `description`
   - `scenario`
   - `skills` 或 `capabilities`
   - `constraints` 或 `assumptions`

7. `layout/` 必須至少包含：
   - `index.js`
   - `LayoutRoot.vue`

8. `modules/` 必須至少包含：
   - `index.js`
   - 每個指定模組的目錄
   - 每個模組的 `index.js`
   - 每個模組的 `routes.js`
   - 每個模組的 `pages/`

9. `styles/` 必須至少包含：
   - `sass/main.sass`

10. 若我有指定初始模組，請直接連同模組骨架一起建立。

11. `docs/` 保留作為該新專案的 AI 文件放置目錄。
    - 不得放平台共用規格
    - 不得放 world / engineering / projects 層裁決文件
    - 僅可放該 project 自身的 AI 協作文件、任務上下文與補充說明

12. 完成後請回報：
   - 建立了哪些檔案
   - 模組清單
   - `可載入狀態：已驗證 / 未實測`
   - 若為已驗證，請說明驗證方式
   - 若為未實測，請明確標示結論僅基於結構檢查
```

---

## 4. 最小使用範例

```md
請建立新專案 `project-c`。

需求：
- title: Project C
- tenant_id: project-c
- 初始模組：welcome
- 建立最小可運作骨架
- 不要建立任何 md 說明文件
```

---

## 5. 進階使用範例

```md
請建立新專案 `opsdesk`。

需求：
- title: OpsDesk
- tenant_id: opsdesk
- 初始模組：
  - shell
  - dashboard
  - task
- 建立 `components/` 與 `services/`
- 不要建立 `index.md`、`PROJECT_CONTEXT.md`、`decisions/`
- 完成後列出變更檔案清單
```

---

## 6. 額外文件生成指令
若你之後真的要讓 AI 連同專案文件一起生成，請額外明確加上：

```md
另外建立專案文件：
- index.md
- PROJECT_CONTEXT.md
- decisions/
```

未明確指定時，一律視為 **不生成**。

---
