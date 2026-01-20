# Frontend Platform Responsibility Boundary

本文件用於補充定義 World 層中「Frontend Platform」之責任邊界，  
以解除工程層在對齊前端目錄結構時的裁決缺口。

本定義屬於 **世界層行為邊界說明**，  
不涉及任何工程實作細節、檔名、框架或技術選型。

---

## 定義目的

- 明確說明 Frontend Platform 在世界中的角色
- 防止工程層過早或錯誤地設計前端目錄結構
- 提供最小但足夠的裁決依據，使工程得以合法前進

---

## 核心原則（World-level Invariants）

### 1️⃣ Platform 為世界生命流程的協調層（Orchestration Layer）

Frontend Platform 的唯一職責為：

- 啟動世界生命流程（boot）
- 組裝世界所需的能力與模組
- 裁決模組能否進入當前世界狀態
- 協調各世界角色之間的啟動順序

Platform **不直接承載具體業務行為或領域邏輯**。

---

### 2️⃣ Platform 不實作下列概念

Frontend Platform **不得直接實作或內嵌** 下列概念的具體內容：

- Module 的業務邏輯
- Store 的狀態結構或資料來源
- Routing 的實際路由定義
- 領域層 UI 或功能元件

Platform 僅能透過 **Container** 與這些概念進行互動。

---

### 3️⃣ Container 為 Platform 與世界其他角色的唯一介面

在 Frontend 世界中：

- Platform **只允許** 透過 Container 存取：
  - Module
  - Store
  - Routing
  - 其他可註冊能力

任何繞過 Container 的直接存取，  
在世界層皆視為 **不合法行為**。

---

### 4️⃣ Platform 關注「流程存在性」，不關注「內容細節」

Frontend Platform 僅需確認：

- 某能力是否存在
- 某模組是否可被組裝
- 某流程是否能被啟動或中止

Platform **不應也不需要** 理解：

- 該模組內部如何運作
- 該狀態資料的具體結構
- 該路由如何呈現 UI

---

### 5️⃣ Frontend Platform 的責任邊界止於「可啟動世界」

當滿足以下條件時，即視為 Platform 職責完成：

- 世界生命流程已被合法啟動
- 必要能力已完成協調與組裝
- 後續行為交由 Module / Store / Routing 各自負責

Platform **不參與** 後續世界行為的執行。

---

## 對工程層的影響（Informative）

本文件僅提供裁決依據，不強制指定工程結構。

但工程層在設計 Frontend 目錄或檔案時，**必須符合以下約束**：

- Platform 相關實作不得包含業務邏輯
- Platform 不得成為 Module 或 Store 的實作容器
- 所有跨角色互動必須顯性經由 Container

---

## 裁決結果

在本文件存在後：

- 工程層 **可以** 合法推論 Frontend Platform 的最小實作骨架
- 對齊分析不再因「責任邊界不明」而被阻擋
- 後續結構問題可進入 Engineering 或 DISCUSSIONS 流程處理

---

## Change Type

- 類型：Clarification（澄清）
- 性質：World 補充定義
- 不改變既有世界行為，僅限制工程自由度

---

End of Frontend Platform Responsibility Boundary
