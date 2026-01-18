# Assembly Constraints — Structural Prohibitions

本文件定義世界在進行 Project 組裝、Module 納入、
或跨層級關係推論時，
**明確不被允許的結構性組合**。

Assembly Constraints 並不描述「如何組裝」，
而是界定：
> 哪些存在同時出現，將使世界失去一致性。

---

## 1. Position in the Model Layer

在 model 主線中：

- `01_PROJECT_CONFIG.md`  
  定義 Project 如何被宣告存在
- `02_MODULE_DEFINITION.md`  
  定義 Module 作為可被選擇單位的存在語意
- `03_PLATFORM_CONFIG.md`  
  定義多 Project 所共享的世界上下文

本文件承接上述三者，
用以補充說明：

- 當這些存在被同時使用時
- 世界在哪些情況下 **拒絕承認該組合**

本文件 **不提出正確組裝方式**，
僅描述不可成立的組合條件。

---

## 2. Nature of Constraints

Assembly Constraints 為世界層級的結構否定規則，
具有以下特性：

- 為絕對限制，而非建議
- 不依賴實作方式或技術選擇
- 一旦違反，世界即無法形成穩定理解

Constraints 的存在意義在於：

> 阻止世界被矛盾的存在宣告撕裂。

---

## 3. Classes of Invalid Assemblies

本文件僅定義「限制的類型」，
而非具體實例。

### 3.1 Contextual Contradictions

當某個 Module 或 Project 的存在假設
與 PlatformConfig 所宣告的世界上下文相衝突時，
該組合不被允許。

此類衝突不因實作補救而成立，
其否定基礎來自世界層級的不一致。

---

### 3.2 Incompatible Module Coexistence

世界可能承認某些 Module 各自獨立存在，
但 **不承認其同時被納入同一 Project**。

此類限制源於：

- 角色重疊
- 語意互斥
- 結構性假設衝突

本文件不列舉具體模組名稱，
僅確立「互斥存在」為合法限制形式。

---

### 3.3 Invalid Multiplicity

並非所有 Module 都被世界視為
可被重複納入的存在。

當 Module 的存在語意
與多重實例化行為相衝突時，
該組裝行為不被允許。

此限制與技術是否支援多例無關，
僅取決於世界對該存在的理解。

---

### 3.4 Cross-level Contamination

當低層存在試圖改寫
高層存在的語意前提時，
該組合不被允許。

例如：

- Module 試圖定義 Platform 級假設
- Project 層宣告影響世界上下文的條件

此類行為將破壞 model 層的語意階層，
因此必須被禁止。

---

## 4. Constraint Interpretation Rules

Assembly Constraints 的判定遵循以下原則：

- 若某組合需「解釋才能合理化」，
  則該組合視為不合法
- 若不同文件對同一組合給出矛盾結論，
  則以本文件之否定條件優先
- Constraints 僅用於判斷「不可成立」，
  不推論替代方案

世界在此層級 **只回答是否可被承認**，
不提供修正方向。

---

## 5. Relationship to Validation

Assembly Constraints 與驗證（validation）不同：

- Constraints：
  - 定義世界層級的結構禁區
  - 不依賴具體輸入

- Validation（若存在）：
  - 將 Constraints 套用於具體宣告
  - 判斷某一實例是否違反限制

本文件本身不執行驗證，
僅提供不可跨越的界線。

---

## 6. Extension Discipline

未來若需新增限制條件，
必須符合以下原則：

- 該限制若不存在，世界將出現理解矛盾
- 該限制不依賴任何實作細節
- 該限制可被視為「世界事實」，而非策略選擇

否則，不得納入本文件。

---

## 7. Reading Guidance

- 若你正在嘗試組裝 Project 或 Module，
  並需判斷某組合是否「不成立」  
  → 請參考本文件

- 若你希望了解世界中「允許什麼」  
  → 本文件不提供該資訊

本文件的存在目的，
在於讓世界 **拒絕錯誤，而非指導正確**。

---

End of Assembly Constraints.
