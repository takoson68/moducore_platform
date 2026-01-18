# Change Protocol

本文件定義在此世界中，
對「世界定義文件（00–06）」進行修改時，
必須遵守的變更流程與原則。

本文件不定義世界規則，
只定義「變更世界的合法方式」。

---

## Scope of This Protocol

本變更協議僅適用於以下文件：

- 00_PURPOSE.md
- 01_WORLD_MODEL.md
- 02_WORLD_BOUNDARIES.md
- 03_WORLD_LIFECYCLE.md
- 04_WORLD_RULES.md
- 05_OUTPUT_DEFINITION.md
- 06_STRUCTURE_AND_NAMING.md

不適用於：
- 07_AUTHORING_STYLE.md
- Project、Module、Prompt、Tool 層級內容

---

## Change Classification

所有變更必須先被分類，再執行。

### Type A：Clarification（語意澄清）

特徵：
- 不改變世界行為
- 僅補充或釐清文字描述

允許：
- 隨時進行
- 不需升版本號

---

### Type B：Refinement（結構細化）

特徵：
- 不改變世界核心原則
- 提升可讀性、可執行性、一致性

允許：
- 僅在確認「現有 world 文件一致」後進行
- 需明確標註修改原因

---

### Type C：Behavioral Change（行為變更）

特徵：
- 改變世界行為或邊界語意
- 影響 AI 可產出或不可產出的範圍

限制：
- 不得即席進行
- 必須重新檢查 01–06 全部文件的一致性
- 視為世界版本升級（World vX.Y）

---

## Change Rules

任何修改 world 文件的行為，必須遵守：

- 先說明「為什麼需要改」
- 明確指出受影響的文件與段落
- 說明是否影響世界行為

禁止：
- 默默修改 world 文件
- 為了某一個 Project 的便利而改動 world
- 在未理解既有世界結構前進行改動

---

## Backward Compatibility Principle

除非明確標註為 Behavioral Change：

- 既有 Project 必須仍可被世界接納
- 既有結構不得突然變成非法

---

## Version Awareness

- World 版本僅在 Behavioral Change 時變動
- World 版本變動必須伴隨變更摘要

版本控制是語意上的，
不要求特定工具實作。

---

## Authority

- 世界的修改權限屬於世界設計者
- AI 不得主動修改 world 文件
- AI 僅能「提出修改建議」

任何未遵守本協議的變更，
視為無效。

---

End of Change Protocol
