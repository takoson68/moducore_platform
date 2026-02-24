# VibeCore Evolver：Proposal Schema（Analyze-only）

## 1. 說明
- 本文件定義 Evolver Analyze 模式的 proposal JSON 結構。
- 本 schema 用於提案與審閱，不是執行指令。
- Evolver native 編碼規則必須同時適用於：文件、報告、proposal、版本紀錄。

## 2. Proposal JSON Schema（討論版）

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "title": "VibeCore Evolver Proposal",
  "type": "object",
  "required": [
    "id",
    "mode",
    "actions",
    "affectedFiles",
    "risk",
    "acceptanceCriteria",
    "rollbackPlan",
    "indexPatch",
    "illegalRefs",
    "namingCompliance"
  ],
  "properties": {
    "id": { "type": "string", "pattern": "^E[0-9]{3}$" },
    "mode": { "type": "string", "enum": ["analyze"] },
    "title": { "type": "string" },
    "summary": { "type": "string" },
    "topic": { "type": "string" },
    "outputFile": { "type": "string" },
    "actions": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["type", "description"],
        "properties": {
          "type": { "type": "string", "enum": ["split", "move", "merge", "deprecate", "promote"] },
          "description": { "type": "string" },
          "source": { "type": "string" },
          "targets": { "type": "array", "items": { "type": "string" } },
          "genes": { "type": "array", "items": { "type": "string" } }
        }
      }
    },
    "affectedFiles": { "type": "array", "items": { "type": "string" } },
    "risk": { "type": "string", "enum": ["L", "M", "H"] },
    "acceptanceCriteria": { "type": "array", "items": { "type": "string" } },
    "rollbackPlan": { "type": "array", "items": { "type": "string" } },
    "indexPatch": {
      "type": "object",
      "required": ["add", "move", "deprecate"],
      "properties": {
        "add": { "type": "array", "items": { "type": "string" } },
        "move": { "type": "array", "items": { "type": "string" } },
        "deprecate": { "type": "array", "items": { "type": "string" } }
      }
    },
    "illegalRefs": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["from", "to", "type"],
        "properties": {
          "from": { "type": "string" },
          "to": { "type": "string" },
          "type": { "type": "string" }
        }
      }
    },
    "namingCompliance": {
      "type": "object",
      "required": ["pattern", "conformsPattern", "validGovernanceType", "visualSlotIgnoredForGovernance"],
      "properties": {
        "pattern": {
          "type": "string",
          "const": "[A-Z]{2}-(IX|WB|WC|CT|BP|NT|RP)-[a-z0-9-]+\\.md"
        },
        "conformsPattern": { "type": "boolean" },
        "validGovernanceType": { "type": "boolean" },
        "visualSlotIgnoredForGovernance": { "type": "boolean", "const": true }
      }
    }
  }
}
```

## 3. Proposal 範例（Analyze-only）

### 3.1 `split` 範例（抽 Gene 拆 Boundary / Contract）
```json
{
  "id": "E001",
  "mode": "analyze",
  "title": "分裂 V2 藍圖中的 Scope 與 Payload Gene",
  "summary": "從 V2 藍圖抽出 request-scope 裁決與 SSR payload schema，形成獨立可裁決文件提案。",
  "topic": "V2 SSR-native blueprint gene extraction",
  "outputFile": "AA-RP-proposal-E001.json",
  "actions": [
    {
      "type": "split",
      "description": "抽取 Scope 裁決表為 Boundary（WB）。",
      "source": "AA-BP-v2-ssr-native-blueprint.md",
      "targets": ["AB-WB-runtime-scope-boundary.md"],
      "genes": ["request-scope vs singleton", "runtime mutable scope"]
    },
    {
      "type": "split",
      "description": "抽取 SSR payload schema 為 Contract（CT）。",
      "source": "AA-BP-v2-ssr-native-blueprint.md",
      "targets": ["AC-CT-ssr-payload-schema.md"],
      "genes": ["SSRPayload schema", "JSON-safe rule"]
    }
  ],
  "affectedFiles": [
    "_VibeCore/new_engineering/blueprints/V2平台SSR-native設計藍圖.md",
    "_VibeCore/new_engineering/index.md"
  ],
  "risk": "M",
  "acceptanceCriteria": [
    "母文件仍保留 why 與脈絡",
    "子文件可獨立裁決",
    "Index Patch Proposal 含新增條目",
    "Illegal References 已列出或為空"
  ],
  "rollbackPlan": [
    "apply 後若重複裁決，先回退 index 註冊變更",
    "撤回子文件註冊並保留母文件原段落"
  ],
  "indexPatch": {
    "add": ["AB-WB-runtime-scope-boundary.md", "AC-CT-ssr-payload-schema.md"],
    "move": [],
    "deprecate": []
  },
  "illegalRefs": [],
  "namingCompliance": {
    "pattern": "[A-Z]{2}-(IX|WB|WC|CT|BP|NT|RP)-[a-z0-9-]+\\.md",
    "conformsPattern": true,
    "validGovernanceType": true,
    "visualSlotIgnoredForGovernance": true
  }
}
```

### 3.2 `deprecate` 範例（過期規範提案）
```json
{
  "id": "E002",
  "mode": "analyze",
  "title": "淘汰重複舊規範並保留引用策略",
  "summary": "將被新規範覆蓋的舊規範列入 deprecated 提案。",
  "topic": "duplicate convention deprecation",
  "outputFile": "AB-RP-proposal-E002.md",
  "actions": [
    {
      "type": "deprecate",
      "description": "舊規範標記 deprecated，保留舊引用遷移說明。",
      "source": "BA-WC-old-pipeline-rule.md",
      "targets": [],
      "genes": ["deprecation notice", "legacy reference strategy"]
    }
  ],
  "affectedFiles": ["_VibeCore/new_engineering/index.md"],
  "risk": "L",
  "acceptanceCriteria": [
    "不再作為新裁決依據",
    "保留遷移指引",
    "Index Patch Proposal 以 deprecate 表達"
  ],
  "rollbackPlan": [
    "若依賴仍多，撤回 deprecate 提案",
    "暫維持 candidate 並補遷移說明"
  ],
  "indexPatch": {
    "add": [],
    "move": [],
    "deprecate": ["BA-WC-old-pipeline-rule.md"]
  },
  "illegalRefs": [
    {
      "from": "BA-WC-old-pipeline-rule.md",
      "to": "ZZ-NT-legacy-note.md",
      "type": "evidence_path"
    }
  ],
  "namingCompliance": {
    "pattern": "[A-Z]{2}-(IX|WB|WC|CT|BP|NT|RP)-[a-z0-9-]+\\.md",
    "conformsPattern": true,
    "validGovernanceType": true,
    "visualSlotIgnoredForGovernance": true
  }
}
```

### 3.3 `merge` 範例（重複主題合併提案）
```json
{
  "id": "E003",
  "mode": "analyze",
  "title": "合併重複的 Pipeline 規則草案",
  "summary": "兩份候選規範重複定義 prepare/activate/effects，建議合併。",
  "topic": "pipeline staging duplication",
  "outputFile": "AC-RP-proposal-E003.json",
  "actions": [
    {
      "type": "merge",
      "description": "以較完整版本為主，合併重複條款。",
      "source": "AB-WC-pipeline-staging-rules.md",
      "targets": ["AC-WC-pipeline-rules-draft.md"],
      "genes": ["prepare 禁止事項", "activate 裁決", "effects 允許事項"]
    }
  ],
  "affectedFiles": ["_VibeCore/new_engineering/index.md"],
  "risk": "M",
  "acceptanceCriteria": [
    "合併後裁決語意不矛盾",
    "來源關聯可追溯",
    "index 提案避免重複註冊"
  ],
  "rollbackPlan": [
    "若語意模糊，保留兩份文件並降級其中一份",
    "撤回 index move/deprecate 提案"
  ],
  "indexPatch": {
    "add": [],
    "move": ["AC-WC-pipeline-rules-draft.md -> related to AB-WC-pipeline-staging-rules.md"],
    "deprecate": []
  },
  "illegalRefs": [],
  "namingCompliance": {
    "pattern": "[A-Z]{2}-(IX|WB|WC|CT|BP|NT|RP)-[a-z0-9-]+\\.md",
    "conformsPattern": true,
    "validGovernanceType": true,
    "visualSlotIgnoredForGovernance": true
  }
}
```

## 裁決條款

### 硬規則
- Proposal schema 必須包含 `indexPatch`、`illegalRefs`、`namingCompliance`。
- `mode` 在本版只能是 `analyze`。
- Proposal 必須包含驗收條件與回退策略（即使本版不執行 apply）。

### 建議
- `actions` 應聚焦單一主題，避免一個 proposal 處理過多無關議題。
- `outputFile` 優先使用 `RP` 類型命名規則（`[VisualSlot]-RP-proposal-<EID>`）。
