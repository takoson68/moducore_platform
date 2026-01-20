# Module ↔ API Interaction — World Boundary Definition

> 本文件定義 **Module 在世界中與 API World 互動的語意邊界**。
>
> 本文件不描述任何請求流程、不描述呼叫時機的工程實作，
> 也不賦予 Module 任何 API 裁決權，
> 僅回答一個問題：
>
> 👉 **在世界語意上，Module 何時「被允許」與 API 互動，以及何時被明確禁止。**

---

## 1. 世界前提（World Premise）

以下世界條件已成立：

* 世界核心已完成裁決並進入穩定狀態
* API World v1 已封版且為只讀
* Module 已被世界承認並完成載入裁決（Loaded）

因此，本文件僅描述：

> **已存在於穩定世界中的 Module，與 API World 之間的互動語意。**

任何發生於世界未穩定階段的 API 行為，皆屬非法呼叫，不在本文件討論範圍內。

---

## 2. 互動的世界語意原則（Core Principles）

Module 與 API 的互動，必須同時遵守以下原則：

* API 為 Zero Authority Layer，不提供任何裁決
* Module 為世界內部執行單位，不得轉嫁責任
* API 僅表達世界已裁決或接受意圖，不保證結果

因此：

> **Module 使用 API，不能用來完成世界裁決，也不能補足世界缺口。**

---

## 3. Init Phases 與 API 互動允許性矩陣

Module 是否被允許使用 API，取決於其 Init Phase。

### Phase 0：Unloaded

* ❌ 不存在於世界中
* ❌ 不得與 API 互動

---

### Phase 1：Loaded

**世界語意：** Module 已被世界納入，但尚未開始運作。

* ❌ 不得與 API 互動
* ❌ 不得假設任何 API 可用性

Loaded 階段僅代表存在，
不存在任何對外互動語意。

---

### Phase 2：Initializing

**世界語意：** Module 正在進入可運作狀態。

* ⚠️ 僅允許「非阻斷性」的 Query 語意
* ❌ 禁止任何 Command 意圖提交

世界治理重點：

* Initializing 不得依賴 API 成功來成立
* API 回應失敗不得阻斷 Module 前進至 Ready

因此：

> **API 在此階段僅能作為輔助資訊來源，而非狀態成立條件。**

---

### Phase 3：Ready

**世界語意：** Module 已達最低可運作條件。

* ✅ 允許 Query 與 Command 互動
* ❌ 不保證任何 API 呼叫結果

即使在 Ready 階段：

* Module 仍不得將 API 回應視為世界裁決
* Module 不得因 API 成功或失敗改寫世界假設

---

## 4. API 錯誤的世界語意承接

當 Module 與 API 互動時，所有錯誤必須依照：

* **API_ERROR_MODEL.md** 的世界語意定義解讀

因此：

* API 拒絕（Rejection）是世界裁決結果
* API 不可見（Invisibility）不代表系統錯誤
* API 尚未成立（Absence）不構成失敗

Module 不得嘗試在本地重構或補完世界語意。

---

## 5. 禁止的互動誤用（Prohibited Misuses）

以下行為在世界語意中被明確禁止：

* 在 Loaded 階段進行任何 API 呼叫
* 在 Initializing 階段使用 Command 作為成立條件
* 依賴 API 回應決定 Module 是否存在
* 將 API 當成世界狀態同步機制

這些行為將導致世界語意破裂。

---

## 6. 世界治理視角（Governance Perspective）

嚴格限制 Module 與 API 的互動時機，能夠：

* 防止 API World 被誤用為世界核心
* 防止 Module 將責任轉嫁給外部系統
* 讓世界在 API 不可用時仍能成立

API 的存在是選擇性的，
世界與 Module 的成立不是。

---

## 7. 本文件的邊界（Document Boundary）

本文件：

* 不描述 API 呼叫流程
* 不定義失敗補救策略
* 不規範工程層重試或同步機制

所有實作選擇，
必須在不違反本文件語意的前提下進行。

---

**MODULE_API_INTERACTION.md 至此結束，不延伸、不推論、不實作。**
