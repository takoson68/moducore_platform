# World Rules

本文件定義模組開發平台世界中
所有參與者（AI、人、模組、工具）必須遵守的行為規則。

本文件不描述流程、不描述結構，
只判斷「行為是否合法」。

---

## Rule 1：World Authority

- World 的定義來源只允許來自 `_VibeCore/world/`
- 任何輸出不得即席創造世界規則

MUST NOT：
- 在專案、模組、輸出中隱含新增世界法則
- 以實作便利為理由繞過世界定義

---

## Rule 2：Single Active World

- 任一時間點，只允許存在一個 active World
- active World 只對應一個 `tenant_id`

MUST NOT：
- 同時操作兩個不同 tenant 的世界
- 在同一執行上下文中混用 tenant 身分

---

## Rule 3：Build-Time World Resolution

- World 的組成必須在 build-time 被完全決定
- run-time 不得新增或變更世界結構

MAY：
- 於 build-time 掃描合法的 index.js 入口
- 根據 Project 與 PlatformConfig 生成世界藍圖

MUST NOT：
- run-time 動態決定模組集合
- run-time 改寫世界組成語意

---

## Rule 4：Container Capability Law

- Container 是能力存在的唯一合法來源
- `container.register` 是能力進入世界的唯一方式

MUST NOT：
- 直接跨模組 import 業務能力
- 以技巧手段繞過 Container 存取能力

---

## Rule 5：Existence vs Visibility

- 模組存在與模組可見是兩個獨立概念
- 不可見模組在世界中視為不存在

MUST：
- 在註冊進 Container 前完成可見性與權限裁決

MUST NOT：
- 初始化不可見模組
- 讓不可見模組影響世界行為

---

## Rule 6：Low Coupling Enforcement

- 任一模組必須可在其他模組缺席下安全運作

MUST：
- 假設其他模組可能不存在
- 保證缺席不造成世界錯誤

MUST NOT：
- 依賴模組存在順序
- 依賴未宣告的跨模組行為

---

## Rule 7：State Authority Rule

- 任何會影響 World 未來行為的資料，必須進入 Store
- 不影響 World 未來行為的資料不得成為決策依據

MAY：
- 使用 Ephemeral Data 處理暫時事件
- 將非關鍵歷史資訊存於瀏覽器

MUST NOT：
- 使用暫時資料改變世界走向

---

## Rule 8：Project Sovereignty

- Project 視為國家或平行世界
- Project 之間不可共享世界狀態

MUST NOT：
- 跨 Project 存取 store
- 對其他 Project 造成直接或間接影響

---

## Rule 9：Routing as Final Defense

- Routing Guard 是使用者進入世界內容的最後防線

MUST：
- 阻止未授權的畫面進入
- 阻止違反世界語意的路徑

MUST NOT：
- 作為能力註冊或模組存在判準
- 創造未經世界承認的行為

---

## Rule 10：World Reset Semantics

- Reset 代表世界倒帶
- Reset 必須保留 Platform 與 PlatformConfig

MUST：
- 清空業務模組能力
- 回到未登入世界狀態

MUST NOT：
- 改寫世界藍圖
- 變更 tenant_id

---

## Rule 11：Output Legitimacy

- 任一 AI 產出必須聲明其層級與影響範圍
- 任一產出必須符合 Output Definition

MUST NOT：
- 輸出無法放置於世界結構中的內容
- 產出隱含越界行為的解法

---

## Rule Invariant

- 世界的一致性高於所有單點便利
- 能「暫時跑起來」但破壞世界的行為一律非法
- 不確定是否合法時，必須回到 world 層重新定義

---

End of World Rules
