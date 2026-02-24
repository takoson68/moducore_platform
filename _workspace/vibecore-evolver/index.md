# VibeCore Evolver Index

Title: VibeCore Evolver 規格索引（Analyze-only）
Type: spec-index
Status: draft
Scope: vibecore-evolver
Owner: architecture
Mode-Gate: analyze-only

## 目的
- 管理 `_workspace/vibecore-evolver/` 目錄內文件的使用權限、閱讀順序與引用範圍。
- 明確區分：哪些文件屬於核心規格、哪些文件僅作討論與示例。
- 作為 `VibeCore Evolver` 規格體系的唯一入口（本目錄層級）。

## Index Gate（本目錄）
- 文件存在 ≠ 可引用。
- 僅列於本 `index.md` 的文件，方可作為 `VibeCore Evolver` 討論規格依據。
- 本 index 的裁決範圍僅限 `_workspace/vibecore-evolver/`，不取代 `_VibeCore/` 內任何 `index.md`。

## 模式裁決（Mode Gate）
- 本目錄目前僅允許：`Analyze-only`
- 不允許：
  - apply / refactor / auto-move / auto-rewrite
  - 任何對 `_VibeCore/` 的實際修改行為
- 若未來要擴充 Apply 模式，必須先新增對應規格文件並更新本 index 狀態與白名單。

## 閱讀順序（建議）
1. `00_OVERVIEW.md`
2. `01_GOVERNANCE_MODEL.md`
3. `02_LIFECYCLE_AND_METADATA.md`
4. `03_ANALYZE_ENGINE_SPEC.md`
5. `04_PROPOSAL_SCHEMA.md`
6. `05_MVP_RUNBOOK.md`

## 當前可引用項目（白名單）

### Core Specs
- Title: Overview | Path: 00_OVERVIEW.md | Type: overview | Status: draft | Scope: vibecore-evolver
- Title: Governance Model | Path: 01_GOVERNANCE_MODEL.md | Type: spec | Status: draft | Scope: vibecore-evolver
- Title: Lifecycle and Metadata | Path: 02_LIFECYCLE_AND_METADATA.md | Type: spec | Status: draft | Scope: vibecore-evolver
- Title: Analyze Engine Spec | Path: 03_ANALYZE_ENGINE_SPEC.md | Type: spec | Status: draft | Scope: vibecore-evolver
- Title: Proposal Schema | Path: 04_PROPOSAL_SCHEMA.md | Type: schema-spec | Status: draft | Scope: vibecore-evolver
- Title: MVP Runbook | Path: 05_MVP_RUNBOOK.md | Type: runbook | Status: draft | Scope: vibecore-evolver

## 引用邊界（與 `_VibeCore/` 的關係）
- 可引用 `_VibeCore/` 文件作為案例或治理模型來源（例如 `new_engineering` 的 boundary/convention/index）。
- 不可因引用 `_VibeCore/` 文件而取得其修改權。
- `VibeCore Evolver` 的分析輸出若涉及 `_VibeCore/`，必須以提案形式呈現（Analyze-only）。

## 未來升級入口（保留）
- 若要進入 `Apply` 模式規格，建議新增：
  - `06_APPLY_ENGINE_GUARDRAILS.md`
  - `07_INDEX_PATCH_PROTOCOL.md`
  - `08_LINK_REWRITE_POLICY.md`
- 並更新本 index：
  - `Mode-Gate`
  - 白名單條目
  - 狀態（`draft -> candidate`）

## 裁決條款

### 硬規則
- 本目錄的治理效力以本 `index.md` 為唯一入口。
- 未列入白名單的文件不得作為 Evolver 規格依據。
- 本版僅允許 Analyze-only 規格引用與討論。

### 建議
- 新增文件時先更新本 `index.md`，再進入討論。
- 維持單一入口閱讀順序，避免規格使用者跳讀造成誤解。
