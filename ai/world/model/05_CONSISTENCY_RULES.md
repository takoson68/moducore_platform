# Consistency Rules — World-Level Arbitration

本文件定義當世界模型中
不同層級、不同文件之間出現
語意衝突或不一致時，
**世界應如何裁決其理解順序與有效性**。

Consistency Rules 不新增結構，
不限制組裝方式，
其存在目的在於：
> 防止世界因多重描述而自我矛盾。

---

## 1. Position in the Model Chain

在 model 主線中：

- `01_PROJECT_CONFIG.md`  
  定義 Project 的存在宣告方式
- `02_MODULE_DEFINITION.md`  
  定義 Module 的存在語意
- `03_PLATFORM_CONFIG.md`  
  定義世界上下文層
- `04_ASSEMBLY_CONSTRAINTS.md`  
  定義不可成立的結構組合

本文件位於 model 主線末端，
作為上述所有文件的 **一致性裁決層**。

當任何兩份或多份文件
同時對某一世界狀態給出解釋時，
其最終理解必須可回溯至本文件。

---

## 2. Nature of Consistency Rules

Consistency Rules 並非校驗規則，
亦不處理個別實例的正確性。

其本質為：

- 世界理解優先順序的宣告
- 語意衝突時的裁決依據
- 解釋權歸屬的最終來源

其目標不是找出「哪個寫得對」，
而是確保世界 **只能形成一種穩定理解**。

---

## 3. Precedence Order

當不同文件對同一問題提出衝突描述時，
世界必須依下列優先順序進行裁決：

1. 世界主鏈（ai/world/00–08）
2. model 層中較高位階的文件
3. model 層中較低位階的文件
4. 推論性或隱含假設

任何低優先度內容，
不得覆寫高優先度之語意。

---

## 4. Layer Integrity Rule

model 層所有文件
必須遵守其語意責任邊界。

當出現以下情況時，
一律視為不一致：

- model 文件試圖改寫世界主鏈中的定義
- 低編號 model 文件被高編號文件否定
- Assembly Constraints 與其他文件描述出現矛盾

在此類情況下，
以 **限制性更高者** 為有效語意。

---

## 5. Constraint Supremacy Principle

任何 Assembly Constraint
一旦成立，
即具有否定權。

即使某組合：
- 符合 ProjectConfig
- 符合 Module 的存在條件
- 未違反 Platform 上下文

只要違反 Assembly Constraints，
該組合即被視為世界不可承認。

Constraints 不需被其他文件重複引用，
其否定權具備全域有效性。

---

## 6. Non-repair Policy

Consistency Rules **不提供修復建議**。

當不一致發生時，
世界只做以下判斷：

- 是否仍能形成單一解釋
- 若不能，則拒絕形成世界理解

任何「替代方案」、「最接近的可行狀態」，
皆不屬於 model 層責任。

---

## 7. Implicit Assumptions Handling

所有未被明確寫入文件的假設，
在發生衝突時，
視為最低優先度。

換言之：

> 沒有被寫下來的世界理解，
> 在裁決時不具備話語權。

此原則用於防止世界被
隱性推論污染。

---

## 8. Extension Discipline

任何新文件若加入 model 主線，
必須能清楚回答：

- 該文件在一致性裁決中的位階
- 是否可能推翻既有語意
- 若發生衝突，其敗給誰

若無法回答上述問題，
該文件不得加入 model 主線。

---

## 9. Reading Guidance

- 若你發現兩份文件同時成立卻導致矛盾  
  → 請依本文件裁決其有效性

- 若你希望「所有情況都能成立」  
  → 本文件並不支援該需求

Consistency Rules 的存在目的，
在於讓世界 **寧可拒絕，也不誤解**。

---

End of Consistency Rules.
