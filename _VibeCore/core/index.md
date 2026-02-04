# core/index.md
## VibeCore — Core Layer Definition

---

## 0. 本目錄的角色（必讀）
`core/` 為 VibeCore 的 **核心能力層（Core Capability Layer）**。

本層負責定義並提供：
- 世界允許被使用的「最小可信能力」
- skills 與 modules 可依賴但不可改寫的核心行為
- 工程運行所需的基礎支撐點

本層 **不是**：
- 世界裁決者
- 世界觀定義者
- 專案或模組的實作層
- 商務邏輯承載處

---

## 1. Core 的存在目的
Core 的唯一目的是：

> **將「世界允許發生的工程行為」  
> 收斂成一組穩定、可控、可被重複使用的能力集合。**

這些能力：
- 必須長期穩定
- 必須可被不同 skills 重複使用
- 必須是「最低權限」的實作

---

## 2. Core 的責任範圍（Scope）
Core 層只負責：

- 能力抽象（Capability Definition）
- 能力實作（Capability Implementation）
- 能力註冊與曝光（Capability Registration）

Core 層 **不負責**：

- 定義技能策略
- 決定模組結構
- 生成專案內容
- 解釋商務語意

---

## 3. Core 與其他層的關係
### 與 `world/`
- Core 完全服從 world 定義
- 不可推翻、覆寫或模糊 world 的裁決

### 與 `skills/`
- skills 僅能透過 core 提供的能力運作
- skills 不得直接操作檔案系統或繞過 core
- skills 不得假設 core 以外的隱含能力

### 與 `_VibeCore/modules/`
- modules 可使用 core 能力
- modules 不得定義或修改 core 行為
- core 不感知任何單一 module 的存在

### 與 `projects/`
- core 對 projects 完全透明
- projects 不得直接依賴 core 實作細節

---

## 4. 能力設計原則（Capability Principles）
Core 中的每一項能力必須符合以下原則：

1. **最小權限原則**
   - 僅提供必要能力
   - 不提供組合策略或高階決策

2. **單一責任原則**
   - 每項能力只做一件事
   - 不混合策略邏輯

3. **可替換性**
   - 能力可以被重新實作
   - 但對外介面必須穩定

4. **與專案無關**
   - 不假設任何特定專案結構
   - 不綁定任何單一模組

---

## 5. 裁決聲明
- 本目錄具 **工程能力層裁決權**
- 可被擴充，但必須保持向下相容
- 不得因單一 skill 或 module 的需求而變更既有能力語意

---

## 6. 當前狀態宣告
目前 `core/` 處於：

> **能力定義期（Capability Definition Phase）**

除非明確需要，暫不引入：
- 複雜抽象
- 高階組合能力
- 動態策略系統

---

本文件為 `core/` 之唯一裁決入口。  
任何未經本文件定義的核心行為，皆視為不合法能力。

---
