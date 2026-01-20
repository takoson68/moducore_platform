# Module Role — World Semantic Position

> 本文件定義 **Module 作為世界構成單位的角色與語意定位**。
>
> 本文件不描述實作、不描述程式結構，
> 也不定義流程與時序，
> 僅回答一個問題：
>
> 👉 **被世界承認的 Module，在世界中「是什麼角色」。**

---

## 1. 世界前提（World Premise）

以下前提已由既有世界層確立：

* 世界核心已完成並具唯一裁決權
* Model 層已定義 Module 被世界承認的存在條件
* API World v1 已封版且為只讀

因此，本文件僅在以下條件成立時適用：

> **Module 已被世界承認為合法存在單位。**

若 Module 尚未被承認，本文件不適用。

---

## 2. Module 的世界角色定義（World Role）

在世界語意中，Module 的角色定義為：

> **Module 是一個被世界載入、在穩定世界中發揮特定職責的功能單位。**

其關鍵語意包括：

* Module 本身不是世界主體
* Module 不具備世界裁決權
* Module 只在世界允許的上下文中運作

Module 的存在目的，不是改變世界，
而是 **在既有世界結構中提供具體功能表現**。

---

## 3. Module 與世界主體的關係（Relation to the World）

世界主體由世界核心與既定機制構成。

在此結構中：

* 世界決定是否載入 Module
* 世界決定 Module 可見與可用的範圍
* Module 不反向影響世界結構

因此：

> **Module 永遠處於世界主體之內，而不是世界主體本身。**

---

## 4. Module 的職責邊界（Responsibility Boundary）

Module 的世界職責被嚴格限制於：

* 提供特定功能能力的世界表現
* 回應世界已裁決的上下文狀態
* 在既定邊界內與其他構件協作

Module 明確不負責：

* 世界身份裁決
* 世界流程裁決或推進
* 世界結構組裝或重組
* 世界規則的解釋或修改

---

## 5. Module 與能力（Capability）的語意關係

在世界語意層：

* Capability 是世界可組合、可授權的能力構件

Module 與 Capability 的關係為：

> **Module 可以使用既有 Capability，但自身不是 Capability。**

因此：

* Module 不被註冊為 Capability
* Module 不作為能力授權的裁決點
* Module 不定義能力的存在與否

---

## 6. Module 與 API World 的角色區分

在穩定世界中：

* API 作為世界對外的語意表達介面
* Module 作為世界內部的功能執行單位

Module：

* 不負責定義 API
* 不改變 API 語意
* 僅在 API World 規則允許下與 API 互動

Module 永遠是 **API 的使用方，而非裁決方**。

---

## 7. Module 的可替換性與隔離性（Replaceability & Isolation）

世界允許：

* 在不改變世界規則的前提下替換 Module
* 不同 Module 之間保持語意隔離

但前提是：

* Module 的替換不得影響世界裁決
* Module 的存在與否不得改變世界生命週期

---

## 8. 世界治理視角（Governance Perspective）

明確定義 Module 的角色，有助於：

* 防止 Module 被誤用為流程主體
* 防止 Module 承擔不屬於它的權責
* 讓工程與 AI 能在正確邊界內推論

Module 的價值，來自於 **清楚的角色定位**，
而非權力的擴張。

---

## 9. 本文件的邊界（Document Boundary）

本文件：

* 不描述實作方式
* 不定義初始化流程
* 不涉及 API 呼叫時機

上述主題，將分別於後續 Module World 文件中定義。

---

**MODULE_ROLE.md 至此結束，不延伸、不推論、不實作。**
