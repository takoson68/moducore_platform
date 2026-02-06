# new_engineering Index

本目錄為「工程規範生成前」之觀察與實驗空間。

本層級 **不具工程治理裁決權**，
亦不作為 engineering/ 之替代。

---

## 使用裁決原則（重要）

- 未被本 index.md 明確列為「可使用」的內容，
  一律視為：
  - 僅供觀察
  - 不可引用
  - 不可作為工程依據

- 本目錄下之任何文件：
  - 即使存在
  - 即使內容完整
  - **未經允許，不代表可被使用**

---

## 當前可使用項目（白名單）

> 僅列於此處之項目，方可被引用或作為工程依據。

- notes/
  - 僅限於「閱讀與歸納」
  - 不得直接升級為規範

---

## 明確禁止事項

- 將 new_engineering 內容視為既定工程規範
- 跳過 index.md 直接引用任一檔案
- 推論未列入白名單之內容具有工程效力

---

## 語意聲明

本 index.md 僅負責：
「使用權限裁決」

不負責：
- 世界治理
- 工程裁決
- 架構合理性判斷

---

## notes/ 列冊

- [Structure] `notes/001_projects_structure.md` — Observation Only
- [Module] `notes/002_modules_glob.md` — Observation Only
- [Module] `notes/003_modules_index_imports.md` — Observation Only
- [Lifecycle] `notes/004_boot_paths.md` — Observation Only

---

## Templates

- Title: Convention Template | Path: templates/CONVENTION_TEMPLATE.md | Type: template | Status: - | Scope: platform | Evidence: notes/001_projects_structure.md, notes/002_modules_glob.md, notes/003_modules_index_imports.md, notes/004_boot_paths.md
- Title: Index Schema | Path: templates/INDEX_SCHEMA.md | Type: template | Status: - | Scope: platform | Evidence: notes/001_projects_structure.md, notes/002_modules_glob.md, notes/003_modules_index_imports.md, notes/004_boot_paths.md

---

## Conventions

- Title: Projects 子目錄結構邊界 | Path: conventions/C001_projects_structure.md | Type: convention | Status: candidate | Scope: platform | Evidence: notes/001_projects_structure.md
- Title: modules/index.js 掃描邊界 | Path: conventions/C002_modules_glob.md | Type: convention | Status: candidate | Scope: platform | Evidence: notes/002_modules_glob.md
- Title: @project/modules/index.js 入口引用邊界 | Path: conventions/C003_modules_index_imports.md | Type: convention | Status: candidate | Scope: platform | Evidence: notes/003_modules_index_imports.md

---

## Boundaries

- Title: Platform Project Boundary | Path: boundaries/B001_platform_project_boundary.md | Type: boundary | Status: active | Scope: platform | Evidence: conventions/C001_projects_structure.md
- Title: Module Discovery Boundary | Path: boundaries/B002_module_discovery_boundary.md | Type: boundary | Status: active | Scope: platform | Evidence: conventions/C002_modules_glob.md, conventions/C003_modules_index_imports.md

---

## Evolution Logs

- Title: Daily Evolution Log 2026-02-06 | Path: evolution/daily_log/2026-02-06.md | Type: note | Status: - | Scope: platform | Evidence: -
