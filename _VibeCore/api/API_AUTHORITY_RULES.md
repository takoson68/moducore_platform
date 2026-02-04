# API Authority — World Authority Boundary Definition

> 本文件定義 **API 在世界中的權限邊界（Authority Boundary）**。
>
> 目的不是描述誰能呼叫 API，
> 而是界定一件更根本的事情：
>
> 👉 **API 在世界中「沒有什麼權力」。**

---

## 1. 世界裁決權的既定歸屬（Given Authority Ownership）

根據已完成並通過驗證的世界核心：

* 世界狀態的成立與否，僅能由世界內部裁決
* 世界流程的推進與中斷，僅能由既定機制裁決
* 世界規則的解釋權，不對外開放

因此，世界裁決權 **已明確存在，且不屬於 API World**。

本文件不重新定義裁決權，只做邊界說明。

---

## 2. API 的權限定位（Authority Positioning）

在世界權限階層中，API 的位置被明確限定為：

> **零裁決權（Zero Authority Layer）**

這代表：

* API 不具備判斷合法與否的權力
* API 不具備批准或否決世界行為的權力
* API 不具備修改世界規則的權力

API 的所有輸出內容：

* 必須是世界裁決「已完成後的轉述」
* 或是世界裁決「尚未發生前的意圖傳遞」

---

## 3. API 與 Container 的關係（Relation to Container）

世界核心已定義：

* Container 是世界狀態的唯一承載者
* Container 管理狀態生命、可用性與一致性

因此：

* API 不得直接建立、銷毀或操作 Container 內部狀態
* API 不得繞過 Container 取得或注入狀態

若 API 描述中出現：

* 直接「寫入狀態」的語意
* 視為可跳過 Container 的捷徑

> 則該 API 描述被視為世界違規。

---

## 4. API 與 Capability 的關係（Not a Capability）

在世界語意中：

* Capability 是可被註冊、授權、組合的世界能力

API **不具備 Capability 所需的任何特徵**：

* 不被註冊
* 不被注入
* 不被組合
* 不參與能力依賴圖

因此：

> API 永遠不是能力，也不得被描述為能力入口。

任何將 API 視為「能力啟動點」的設計：

> 都是對世界權限邏輯的誤讀。

---

## 5. API 與 Router 的關係（Relation to Router）

世界核心已界定：

* Router 限制世界可達路徑
* Router 決定世界行為發生的上下文

API 在此關係中：

* 不定義路徑
* 不修改路徑
* 不選擇路徑

API 僅能在：

* Router 已裁決出的合法世界路徑中
* 作為語意表達的邊界存在

---

## 6. API 與 Lifecycle 的關係（Relation to Lifecycle）

世界流程的開始、過渡與結束：

* 完全由 Lifecycle 裁決

因此：

* API 不得推動生命周期前進
* API 不得回溯或重置生命周期
* API 不得作為世界流程的觸發器

API 只能：

* 在特定世界階段被允許出現
* 其合法性來自 Lifecycle，而非自身

---

## 7. 禁止的權限幻覺（Prohibited Authority Illusions）

以下敘述在世界中被明確禁止：

* 「呼叫此 API 即可完成某世界行為」
* 「API 會確保狀態一致」
* 「API 負責驗證世界規則」
* 「API 控制流程結果」

這些敘述將 API 偽裝成世界主體。

---

## 8. 世界治理視角（Governance Implication）

API Authority 的嚴格限制，目的在於：

* 防止工程層將 API 當成世界捷徑
* 防止外部系統誤以為 API 是裁決者
* 防止 AI Agent 對世界權限產生錯誤推論

API 的價值，來自其**被限制的位置**，
而不是被賦予的權力。

---

## 9. 本文件的邊界（Document Boundary）

本文件：

* 不涉及任何實作細節
* 不描述任何安全或認證機制
* 不定義誰可以呼叫 API

本文件只完成一件事：

> **宣告 API 在世界中「沒有裁決權」。**

---

**API_AUTHORITY_RULES.md 至此結束，不延伸、不推論、不實作。**
