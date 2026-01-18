# PlatformConfig — World Context Declaration

本文件定義世界中「Platform」此一存在體，
在被辨識、選擇或承載多個 Project 之前，
其 **最低限度必須能被如何宣告與理解**。

PlatformConfig 並非 ProjectConfig 的擴充，
而是描述一種 **高於單一 Project 的世界上下文存在**。

---

## 1. Position in the World

在世界主鏈中（參見 ai/world/01_WORLD_MODEL.md），  
Platform 被理解為一個可承載、約束或影響
多個 Project 的世界情境層。

本文件位於 model 層，
其責任在於補充說明：

- 世界如何辨認一個 Platform 的存在
- Platform 與 Project 在存在層級上的根本差異
- 世界何時視某些設定為「平台語意」而非專案語意

本文件 **不描述 Platform 的實作或執行方式**，
僅定義其作為世界上下文的宣告條件。

---

## 2. Distinction from ProjectConfig

Platform 與 Project 的差異並非規模大小，
而是 **存在角色不同**。

世界對兩者的基本理解如下：

- Project：
  - 為一個可被生成、組裝與執行的具體單位
  - 其存在通常指向單一目標與輸出

- Platform：
  - 為多個 Project 提供共同假設的世界脈絡
  - 其存在不以單一輸出為目的

因此，PlatformConfig **不描述「做什麼」**，
而描述 **「在哪個世界條件下做」**。

---

## 3. Scope and Explicit Exclusions

PlatformConfig 的責任範圍僅限於：

- 宣告一個世界級上下文的存在
- 表達其對多個 Project 的共同約束或前提
- 成為 ProjectConfig 被解讀時的背景條件

本文件**明確不包含**：

- 任何 Project 的具體組成
- Module 的選擇或定義
- lifecycle、執行順序或技術設定
- 部署、環境或基礎設施細節

若某資訊只對單一 Project 有意義，
則不應屬於 PlatformConfig。

---

## 4. Minimal Declaration Principle

世界對 PlatformConfig 同樣採取「最低宣告原則」。

只要缺少此層宣告，
世界便無法判斷：

- 不同 Project 是否處於同一個世界上下文
- 某些規則或限制是否應被共同套用
- Project 間是否共享某些結構性假設

PlatformConfig 必須至少能讓世界回答：

- 這些 Project 是否屬於同一個 Platform
- 該 Platform 是否影響其理解或組裝方式

但不必回答「該如何實作」。

---

## 5. Relationship to Other Model Documents

本文件與 `01_PROJECT_CONFIG.md` 為語意平行關係，
而非繼承或包覆關係。

其角色分工為：

- PlatformConfig：
  - 宣告世界級上下文
  - 設定 Project 解讀時的共同前提

- ProjectConfig：
  - 在給定平台脈絡下
  - 宣告單一 Project 的存在與組成輪廓

任何 model 文件若需假設「多 Project 共享某條件」，
其前提必須能回溯到 PlatformConfig，
而非直接嵌入於 Project 層。

---

## 6. Non-binding Future Considerations

未來 model 文件可能會在不違反本文件前提下，
探討例如：

- Platform 對 Project 類型的限制假設
- Platform 是否形成隱含的 Module 選擇邊界
- 多 Platform 並存時的世界理解方式

上述內容若影響世界存在理解，
應另立文件說明，
不得直接擴寫本文件。

---

## 7. Reading Guidance

- 若你正在理解「Project 與 Platform 的世界差異」  
  → 請從本文件開始

- 若你僅需宣告單一 Project  
  → PlatformConfig 可視為已存在或隱性成立

本文件不要求每個世界必然存在 PlatformConfig，
但一旦存在，
其語意地位高於所有 ProjectConfig。

---

End of PlatformConfig definition.
