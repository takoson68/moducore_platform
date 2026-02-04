# Module World — Governance Index

> 本文件為 **Module World 的治理入口（Governance Entry）**。
>
> 本文件不是模組清單，也不是工程指引，而是用來界定：
>
> * Module World 在整體世界體系中的角色
> * Module World 與世界核心、API World 之間的邊界
> * 模組文件的閱讀順序與完成條件

---

## 1. Module World 的世界定位（World Position）

Module World 是一個 **世界延伸層（Development World）**，存在於 `_VibeCore/modules/` 之下，其角色為：

* 定義「模組（Module）」作為世界構成單位的語意角色
* 描述模組如何被世界建立、初始化與運行
* 規範模組在不具裁決權前提下，與其他世界構件互動的方式

Module World **不是**：

* 世界核心（不屬於 `_VibeCore/world/`）
* 世界裁決者
* 世界流程主控者
* 工程實作規範

Module World 永遠服從既有世界核心與已封版的 API World 規則，只能引用，不得改寫。

---

## 2. 治理前提（Governance Premises）

Module World 建立於以下既定事實之上：

* 世界核心已完成並通過 World Readiness Verification
* API World v1 已封版並進入只讀狀態
* 世界裁決權、生命週期與狀態承載機制均已確立

因此：

* 模組不得擁有世界裁決權
* 模組不得決定世界生命週期走向
* 模組不得繞過 Container、Router、Lifecycle 或 API World

---

## 3. Module World 的責任邊界（World Boundary）

Module World **只定義語意角色與出現時機，不定義實作細節**。

### Module World 可以定義：

* 模組在世界中的角色（Role）
* 模組初始化與進入運行狀態的語意階段
* 模組在穩定世界中與 API 互動的世界級限制

### Module World 明確不做：

* 不定義任何模組程式碼結構
* 不描述資料請求的實作流程
* 不指定 UI 行為或畫面呈現方式
* 不新增任何世界裁決規則

---

## 4. 閱讀順序（Reading Order）

Module World 文件具有嚴格語意依賴，必須依序閱讀：

1. **MODULE_ROLE.md**
   → 定義模組在世界中的角色與存在意義

2. **MODULE_INIT_PHASES.md**
   → 定義模組從被載入到可運作的世界語意階段

3. **MODULE_API_INTERACTION.md**
   → 定義模組在穩定世界中與 API World 的互動邊界

任何工程實作或 AI 推論，**不得違反此閱讀順序**。

---

## 5. 完成條件（Definition of Done）

Module World 視為完成，必須同時滿足：

* 所有文件僅描述世界語意，不描述工程實作
* 模組被界定為世界構成單位，而非世界主體
* 模組與 API World 的關係完全服從既有 Authority 與 Lifecycle 規則
* 不存在任何模組具備隱含裁決權的描述

完成後：

* Module World 成為穩定延伸層
* 未來僅能透過 Change Protocol 進行版本化調整

---

## 6. 治理聲明（Governance Statement）

本 index 只負責 **界定 Module World 的存在方式與閱讀秩序**，
不授權任何文件或實作者：

* 擴張模組權限
* 重新定義世界或 API World 規則
* 將工程便利轉化為世界裁決

若模組設計出現歧義，應：

👉 回到世界核心或 API World 裁決，而非在 Module World 補洞。

---

**Module World 治理入口至此結束，不延伸、不推論、不實作。**
