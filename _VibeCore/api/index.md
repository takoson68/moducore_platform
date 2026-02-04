# API World — Governance Index

> 本文件為 **API World 的治理入口（Governance Entry）**。
>
> 此文件**不是目錄（TOC）**，也不是工程說明，而是用來界定：
>
> * API World 在整個世界體系中的**地位**
> * API World 的**閱讀順序**
> * API World 的**責任邊界**
> * API World 的**完成條件**

---

## 1. API World 的世界定位（World Position）

API World 是一個**世界延伸層（Development World）**，存在於 `_VibeCore/` 之下，其角色為：

* 為「世界與外部系統之間的語意邊界」提供**一致、可治理的描述**
* 為工程層提供**可被正確解讀的世界語意規範**
* 為 Container / Router / Lifecycle 所主導的世界流程**提供對外表達介面，但不具裁決權**

API World **不是**：

* 世界核心（不屬於 `_VibeCore/world/`）
* 世界裁決者
* 能力（Capability）
* 工程實作層

API World **永遠服從既有世界核心規則**，僅能引用，不得改寫。

---

## 2. 治理前提（Governance Premises）

本 API World 明確建立於以下既定事實之上：

* `_VibeCore/world/` 已完成並通過 World Readiness Verification
* 世界裁決權已明確存在，且 **不屬於 API**
* Container、Router、Lifecycle 為既定世界機制，不可被繞過、替代或弱化

因此：

* API 不得成為世界流程的起點或終點
* API 不得直接驅動模組載入、世界切換或狀態裁決
* API 只能在「被允許的世界階段」中被呼叫

---

## 3. API World 的責任邊界（World Boundary）

API World **只負責定義語意，不負責行為**。

### API World 可以定義：

* API 的世界角色與語意定位
* API 類型（例如：Query / Command）的世界意義
* API 與世界裁決權之間的關係
* API 在世界生命週期中的合法出現位置
* API 錯誤的世界語意模型

### API World 明確不做：

* 不定義任何 endpoint
* 不描述任何 route / controller / transport
* 不涉及實際資料結構或參數格式
* 不新增任何世界規則或裁決機制

---

## 4. 閱讀順序（Reading Order）

API World 的文件具有**語意依賴關係**，必須依序閱讀：

1. **API_WORLD.md**
   → 定義 API 作為一個世界概念的基本角色

2. **API_CATEGORIES.md**
   → 定義 API 類型（Query / Command）的世界層級語意

3. **API_AUTHORITY_RULES.md**
   → 定義 API 與世界裁決權、能力、Container 的嚴格關係

4. **API_LIFECYCLE.md**
   → 定義 API 在世界生命週期中的合法存在區段

5. **API_ERROR_MODEL.md**
   → 定義錯誤在世界中的語意，而非技術格式

任何工程閱讀、AI Agent 推導或文件延伸，**不得違反此閱讀順序**。

---

## 5. 完成條件（Definition of Done）

API World 視為「完成」必須同時滿足以下條件：

* 所有文件只描述「語意」而非「實作」
* 文件內容可被工程層引用，但**不造成工程推論歧義**
* API 被清楚界定為「世界對外表達界面」，而非世界主體
* 不存在任何 API 具備世界裁決、能力注入或流程主導的描述

一旦完成：

* API World 即成為穩定延伸層
* 未來僅能透過 Change Protocol 進行版本化演進

---

## 6. 治理聲明（Governance Statement）

本 INDEX 僅負責 **界定 API World 的存在方式**，
不授權任何文件或實作者：

* 擴張 API 世界權限
* 重定義世界核心規則
* 將工程捷徑合理化為世界規則

若在實作或設計中出現歧義，應：

👉 回到世界核心裁決，而非在 API World 自行補洞。

---

**本文件至此為止，不延伸、不推論、不實作。**
