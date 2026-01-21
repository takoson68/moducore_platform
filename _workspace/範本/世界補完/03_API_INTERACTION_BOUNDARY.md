# API Interaction Boundary — World Semantic Addendum

本文件補完「API 互動邊界（API Interaction Boundary）」在**世界層（World Layer）**中的語意定位。  
本文件**不描述實作方式、不定義端點、不推導流程設計**，僅界定世界語意中 API 所允許與禁止的互動位置。

---

## 1. API 作為 Zero Authority Layer

API 在世界語意中屬於**零裁決層（Zero Authority Layer）**。

其語意責任僅包含：

- 世界語意的對外表達
- 世界狀態或意圖的傳遞介面

並受到以下嚴格限制：

- ❌ API 不具裁決權
- ❌ API 不得產生世界規則
- ❌ API 呼叫不得成為世界流程或世界裁決的起點
- ❌ API 成功與否不得被視為世界狀態已成立的依據

API 是**傳遞層**，而非**決策層**。

---

## 2. API 互動時機的語意限制

API 的存在與互動，必須符合世界狀態的語意前提。

在世界語意上：

- API **僅能在世界已完成裁決並進入穩定狀態後**被允許互動
- 世界尚未穩定時的 API 行為：
  - 不屬於錯誤（Error）
  - 而屬於**非法互動（Illegal Interaction）**

API 不負責判斷世界是否已穩定，  
API 只服從世界是否允許其存在。

---

## 3. API 回應的語意責任

API 回應在世界語意中僅代表：

- 已成立的世界狀態之反映，或
- 已被世界接受的意圖之回應

其語意限制如下：

- API 回應**不保證結果成立**
- API 回應**不得被視為裁決結果**
- 模組不得以 API 回應取代世界裁決
- ❌ 不得以工程補救或補償邏輯改寫世界語意

換言之：

> **API 回應的是「被允許說出口的事實或意圖」，  
> 而不是「世界的最終結論」。**

---

End of API Interaction Boundary — World Semantic Addendum  
(Semantics Only, No Execution or Endpoint Definition)
