# Friction Item Template

用途：定義單一 friction item 的標準記錄格式（人類可讀 + machine-readable）。

## Human-readable

- ID:
- Target:
- Target Type: `WB | WC | CT | BP | NT | RP`
- Scope: `project | module | boot | api | router | container | ui`
- Severity: `L | M | H`
- Summary:
- Evidence:
- Related: （可選）

## Machine-readable（JSON）

```json
{
  "id": "FR-YYYYMMDD-001",
  "target": "path/or/governance-id",
  "targetType": "WB",
  "scope": "module",
  "severity": "M",
  "summary": "一句話描述 friction",
  "evidence": "git diff path 或摘要",
  "related": ["AA-WB-runtime-boundary-clarification.md"]
}
```

## 欄位說明（固定）

- `id`：例如 `FR-20260224-001`
- `target`：路徑或治理 ID
- `targetType`：治理身份（`WB / WC / CT / BP / NT / RP`）
- `scope`：影響範圍（`project / module / boot / api / router / container / ui`）
- `severity`：嚴重度（`L / M / H`）
- `summary`：一句話摘要
- `evidence`：可追溯證據（檔案路徑、diff 摘要、log）
- `related`：關聯候選文件或既有規範（可選）

## 範例 A（WB）

### Human-readable
- ID: FR-20260224-001
- Target: `platform/frontend/projects/_proTemp/modules/welcome/routes.js`
- Target Type: `WB`
- Scope: `router`
- Severity: `H`
- Summary: 路由註冊邊界被繞過，直接引用未授權入口。
- Evidence: `git diff` 顯示直接 import 非白名單路徑。
- Related: `AA-WB-router-entry-boundary.md`

### Machine-readable（JSON）

```json
{
  "id": "FR-20260224-001",
  "target": "platform/frontend/projects/_proTemp/modules/welcome/routes.js",
  "targetType": "WB",
  "scope": "router",
  "severity": "H",
  "summary": "路由註冊邊界被繞過，直接引用未授權入口。",
  "evidence": "git diff: routes.js 直接 import 非白名單路徑",
  "related": ["AA-WB-router-entry-boundary.md"]
}
```

## 範例 B（WC）

### Human-readable
- ID: FR-20260224-002
- Target: `C009_runtime_provider_naming_and_placement`
- Target Type: `WC`
- Scope: `container`
- Severity: `M`
- Summary: provider 命名慣例在新模組容器中出現不一致。
- Evidence: `git diff` 顯示 `provider` 與 `runtimeProvider` 混用。
- Related: `AB-WC-provider-naming-normalization.md`, `conventions/C009_runtime_provider_naming_and_placement.md`

### Machine-readable（JSON）

```json
{
  "id": "FR-20260224-002",
  "target": "C009_runtime_provider_naming_and_placement",
  "targetType": "WC",
  "scope": "container",
  "severity": "M",
  "summary": "provider 命名慣例在新模組容器中出現不一致。",
  "evidence": "git diff: container 檔案出現 provider/runtimeProvider 混用",
  "related": [
    "AB-WC-provider-naming-normalization.md",
    "conventions/C009_runtime_provider_naming_and_placement.md"
  ]
}
```
