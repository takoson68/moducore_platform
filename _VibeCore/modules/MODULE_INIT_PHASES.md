# Module Init Phases — World Semantic Stages

> 本文件定義 **Module 在世界中的初始化語意階段（Init Phases）**。
>
> 本文件不描述工程流程、不描述程式生命週期，
> 也不規範實作順序，
> 僅回答一個問題：
>
> 👉 **被世界承認的 Module，是在世界中「如何逐步進入可運作狀態」。**

---

## 1. 世界前提（World Premise）

以下世界狀態已成立：

* 世界核心已完成裁決並進入穩定狀態
* 世界生命週期已允許對外交互
* API World v1 已封版且為只讀
* Module 已被世界承認為合法存在單位

因此：

> **Module Init Phases 僅發生於「世界已穩定」之後。**

在世界未穩定之前，Module 不存在初始化語意。

---

## 2. Init Phases 的世界語意原則（Core Principles）

Module 的初始化階段遵循以下世界語意原則：

* Init Phases 屬於 Module 的內部語意演進
* Init Phases 不影響世界生命週期
* Module 不得藉由初始化推動世界狀態轉換

因此：

> **Module 初始化，是在穩定世界中進行的局部語意變化，而非世界事件。**

---

## 3. Phase 0：Unloaded（未載入）

**世界語意描述：**

> Module 尚未被世界載入。

此階段代表：

* Module 未佔用任何世界資源
* Module 不可被使用
* Module 不影響任何世界狀態

Unloaded 並非異常狀態，
而是 Module 的初始背景狀態。

---

## 4. Phase 1：Loaded（已載入）

### 治理註記：Loaded 由世界裁決進入

Loaded 階段**不是**由 Module 自行觸發，而是來自於世界層的明確裁決。

此裁決通常已在世界既定機制中完成，例如：

* 世界於 boot 階段判定該 Module 屬於當前世界
* 路由守衛已完成模組可用性的判斷
* 世界已決定將該 Module 納入當前世界結構

因此，進入 Loaded 階段在世界語意上代表：

> **世界已允許此 Module 存在於當前世界中，但尚未要求其開始運作。**

Module 本身不得宣告或跳過此階段，
亦不得假設 Loaded 必然發生。

**世界語意描述：**

> 世界已決定載入該 Module，但尚未啟動其功能職責。

此階段代表：

* Module 已被識別為可用單位
* Module 的角色已確定（參照 MODULE_ROLE.md）
* Module 尚未對外提供任何功能表現

Loaded 階段僅表示存在，
不表示可運作。

---

## 5. Phase 2：Initializing（初始化中）

**世界語意描述：**

> Module 正在完成進入可運作狀態前所需的內部準備。

世界語意重點：

* 初始化過程不得影響世界裁決
* 初始化不得要求世界進入其他生命週期階段
* 初始化不得假設 API 必然成功

此階段允許：

* 建立模組內部狀態
* 與世界既有構件建立必要關聯

但：

> **尚不得對外承諾任何功能可用性。**

---

## 6. Phase 3：Ready（可運作）

**世界語意描述：**

> Module 已完成其初始化責任，並可在其角色邊界內運作。

此階段代表：

* Module 可回應世界上下文
* Module 可使用既有能力與 API（依既定規則）
* Module 可被世界或其他模組使用

Ready 階段：

* 不代表世界狀態已完成
* 不保證資料完整性
* 僅表示 Module 已達可運作的最低條件

---

## 7. Init Phases 與世界生命週期的隔離

再次強調：

* Module Phase 變化 ≠ 世界生命週期變化
* 多個 Module 可處於不同 Init Phases
* 世界不因單一 Module 的狀態而轉換階段

> **Init Phases 不具備世界層級影響力。**

---

## 8. 世界治理視角（Governance Perspective）

明確定義 Init Phases 的價值在於：

* 防止將 Module Loading 誤解為世界初始化
* 防止工程邏輯干擾世界裁決
* 讓 AI 與工程可正確推論 Module 狀態而不越權

Init Phases 是 Module 的責任，
不是世界的負擔。

---

## 9. 本文件的邊界（Document Boundary）

本文件：

* 不描述實作順序
* 不定義技術生命週期 hooks
* 不規範 API 呼叫時機

模組與 API 的互動邊界，
將於 **MODULE_API_INTERACTION.md** 中定義。

---

**MODULE_INIT_PHASES.md 至此結束，不延伸、不推論、不實作。**
