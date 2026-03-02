# index.md
## Project Templates Registry

---

## 0. 本目錄的角色
`projects/templates/` 為 project instance layer 的模板目錄。

本目錄只負責：

- 提供新 project 文件的固定模板
- 確保不同 project 使用一致的文件骨架

本目錄不負責：

- 定義 world 規則
- 定義工程裁決
- 取代 project 本身的 `index.md`

---

## 1. 使用規則

- 任何模板的使用，必須先經過 `../index.md`
- 模板不可直接作為專案定義文件；必須複製到 project 實例後再填寫
- 模板可擴充內容，但不得任意刪除核心章節

---

## 2. 閱讀順序

1. `../index.md`
2. `../PROJECT_AUTHORING_STANDARD.md`
3. `../PROJECT_SCAFFOLD_PROTOCOL.md`
4. `index.md`
5. 目標模板文件

---

## 3. Templates Registry

- `PROJECT_INDEX_TEMPLATE.md`
  - 專案入口文件模板
- `PROJECT_CONTEXT_TEMPLATE.md`
  - 專案背景與範圍模板
- `DECISION_RECORD_TEMPLATE.md`
  - 專案決策紀錄模板

---

## 4. 裁決聲明

- 本目錄不是裁決來源
- 模板僅提供固定格式
- 若模板與上層標準衝突，以 `../index.md` 與 `../PROJECT_AUTHORING_STANDARD.md` 為準

---
