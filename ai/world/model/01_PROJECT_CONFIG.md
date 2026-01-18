# ProjectConfig — Project Existence Declaration

本文件定義世界中「Project」此一存在體，
在被實際選擇、生成或組裝之前，
**最低限度必須能被如何宣告與辨識**。

ProjectConfig 並非實作設定，
而是 Project 作為一個可被生成對象，
其存在所需滿足的結構性條件。

---

## 1. Position in the World

在世界主鏈中（參見 ai/world/01_WORLD_MODEL.md），  
Project 被視為一種「可被建構的世界實體」。

本文件位於 model 層，
用於補充說明：

- 當一個 Project 從「概念」走向「可生成對象」時
- 世界如何辨認它
- AI 如何知道「這是一個合法的 Project 宣告」

本文件 **不重新定義 Project 是什麼**，
僅定義 Project **如何被宣告存在**。

---

## 2. Scope and Limitations

ProjectConfig 的責任範圍僅限於：

- 宣告一個 Project 的存在
- 描述其可被選擇的結構輪廓
- 成為模組組裝與生成判斷的前置基礎

本文件**明確不涵蓋**：

- Project 的執行流程
- boot 或 lifecycle 行為
- runtime 狀態
- 任何技術實作細節

這些內容若存在，
必須位於世界主鏈或未來更低階的實作層。

---

## 3. Minimal Declaration Principle

世界對 ProjectConfig 採取「最低宣告原則」：

> 只要缺少此結構，
> 世界即無法確認一個 Project 是否存在。

因此，ProjectConfig 必須至少能回答：

- 世界如何命名這個 Project
- 世界是否承認其為一個可生成單位
- 世界是否能基於此宣告進行後續組裝判斷

任何不影響上述判斷的細節，
均不應出現在本文件中。

---

## 4. Canonical Structure (Conceptual)

在 model 層中，
ProjectConfig 被視為一種「結構描述，而非資料格式」。

其概念性結構應具備以下語意角色：

- 一個可識別的 Project Identity
- 一組宣告其組成來源的模組指引
- 一個可供世界判斷其合法性的最小資訊集

上述結構的具體表現方式
（JSON、YAML、JS 物件等）
並不屬於本文件討論範圍。

---

## 5. Relationship to Other Model Documents

本文件為 model 主線的起點。

後續 model 文件若存在，僅能在此基礎上延伸，例如：

- 模組如何被定義與引用
- Project 與 Platform 宣告的差異
- 組裝時的相容性與限制判斷

任何後續文件不得推翻本文件所界定的
ProjectConfig 存在語意。

---

## 6. Reading Guidance

- 若你正在理解「Project 是什麼」  
  → 請回到 ai/world/01_WORLD_MODEL.md

- 若你需要判斷「一個 Project 是否被合法宣告」  
  → 請從本文件開始

本文件不要求閱讀順序上的唯一性，
但其語意地位為所有 Project 相關 model 文件之前提。

---

End of ProjectConfig definition.
