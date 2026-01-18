# Module — Declarative World Unit

本文件定義世界中「Module」此一存在體，
於進入實作或執行之前，
其 **最低限度必須被如何辨識與宣告**。

Module 並非功能集合，
亦非程式碼單位，
而是 Project 與世界之間
可被選擇、組裝與引用的基本結構單元。

---

## 1. Position in the World

在世界主鏈中（參見 ai/world/01_WORLD_MODEL.md），  
Module 被視為構成 Project 的核心存在之一。

本文件位於 model 層，
其責任在於補充說明：

- 世界如何辨認一個 Module 的存在
- AI 如何區分「一個 Module」與「一段實作」
- Module 進入 Project 組裝之前，世界所要求的最低語意條件

本文件 **不定義 Module 的能力或行為**，
僅定義 Module 作為一個可被納入 Project 的
**宣告單位**。

---

## 2. Scope and Explicit Exclusions

本文件僅涵蓋以下範圍：

- Module 的存在條件
- Module 作為結構單位的語意責任
- Module 被世界承認的最低描述要求

本文件**明確不處理**：

- 功能列表或功能說明
- UI、API 或技術細節
- Module 的載入時機或生命週期
- Module 之間的互動流程

上述內容若存在，
其語意位階必須高於或低於本文件，
但不得與本文件混寫。

---

## 3. Minimal Existence Criteria

世界對 Module 採取「最低存在條件」原則：

> 只要缺少這些語意資訊，
> 世界便無法確認一個 Module 是否存在。

因此，一個 Module 的宣告，
至少必須使世界能回答以下問題：

- 世界如何稱呼此 Module
- 世界是否承認此 Module 為可被引用的單位
- 此 Module 是否被允許納入某個 Project

任何無法影響上述判斷的資訊，
均不應出現在本層。

---

## 4. Conceptual Responsibilities

在 model 層中，
Module 僅承擔以下概念性責任：

- 作為 Project 組成的一個可選單位
- 作為世界中可被指名的存在體
- 作為後續能力、行為或實作的承載容器

Module 本身 **不等同於其內含能力**，
亦不因其實作方式而改變其存在語意。

---

## 5. Relationship to ProjectConfig

Module 並非獨立存在。

其存在必須透過某個 ProjectConfig
被世界顯性或隱性地引用。

換言之：

- ProjectConfig 宣告「世界要組裝什麼」
- Module 定義「世界允許被組裝的單位是什麼」

本文件不描述 Module 如何被選擇，
僅定義一旦被選擇時，
世界所承認的 Module 形態。

---

## 6. Future Extensions (Non-binding)

後續 model 文件若存在，
可能會在不違反本文件前提下，
進一步描述：

- Module 是否具有公開／受限屬性
- Module 是否可被多次實例化
- Module 與其他 Module 的相容性假設

上述內容一旦影響世界理解，
其語意責任必須明確區分，
不得回滲修改本文件之存在定義。

---

## 7. Reading Guidance

- 若你正在理解「Module 是什麼」  
  → 請回到 ai/world/01_WORLD_MODEL.md

- 若你需要判斷「某單位是否構成一個 Module」  
  → 請從本文件判斷其是否滿足最低存在條件

本文件為所有 Module 相關結構討論的
語意錨點。

---

End of Module definition.
