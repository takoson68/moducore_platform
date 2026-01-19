# World API Rules

本文件定義模組開發平台世界中  
**World 與 Backend 之間唯一合法的事實交換規則**。

此文件描述 API 在世界中的語意角色與不可跨越的邊界，
不描述 API 實作、不描述請求流程、不描述具體格式。

---

## API 的世界定位（工作方針）

API 是 World 與 Backend 之間  
**唯一合法的事實交換邊界**。

此定義是一項明確的**工作方針（Way of Working）**，
用以落實前後端分離，並防止世界語意遭到破壞。

World 中 **不允許存在任何繞過 API 取得 Backend 資料或事實的方式**，
即使在技術上可行，也視為違規。

---

## Backend Authority

- Backend 是世界的事實權威（Source of Truth）
- Backend 負責：
  - 資料正確性
  - 資料一致性
  - 權限與合法性驗證

World 內部（包含 Platform、Container、Module、Store、Routing）：

- 不得創造 Backend 事實
- 不得推翻 Backend 已回傳的事實
- 僅能使用 Backend 經 API 回傳的結果作為依據

---

## Hard Boundary：禁止繞過 API

World 中禁止任何形式繞過 API 與 Backend 進行事實交換的行為，
包括但不限於：

- 直接存取後端資料庫
- 直接存取後端私有服務或內部端點
- 透過非 API 管道取得後端回應（例如共享記憶體、隱藏通道）
- 在前端推測、硬編碼或模擬後端事實並當作真實資料使用
- 使用任何非 API 機制同步後端狀態至前端世界

任何繞過 API 的行為，
即使不影響當下功能運作，
仍視為破壞前後端分離與世界一致性的**結構性錯誤**。

---

## API Response as World-Effective Input

僅 API 回應具備「進入 World 並產生效力」的資格。

API 回應可作為：

- Store 狀態寫入來源
- 世界行為的前端依據
- Routing Guard 的判斷材料
- 模組可見性與可用狀態的來源

任何未經 API 回應的資料：

- 不得影響 World 行為
- 不得作為世界裁決依據
- 不得成為模組存在、可見性或權限的判準

---

## API 與 Store 的關係

- API 提供後端事實
- Store 保存已被 World 接受的狀態投影

規定：

- Store 不得作為 API 的替代品
- Store 狀態必須可由 API 回應更新、修正或推翻
- 若 Store 狀態與 API 回應不一致，必須以 API 回應為準

Store 的存在目的，是支撐 World 在前端的運行，
而不是定義事實本身。

---

## API 與 Module 的關係

- Module 不得直接依賴後端實作細節
- Module 僅能透過 World 提供的 API 能力存取 Backend

Module 可以：

- 呼叫 API
- 處理 API 回應
- 將結果交由 Store 或自身狀態使用

Module 不得：

- 定義世界級 API 行為
- 攔截或改寫世界層級的 API 規則
- 假設 API 一定成功或資料永遠有效

---

## API Failure Awareness

World 必須假設：

- API 可能失敗
- API 可能延遲
- API 可能回傳錯誤或不完整資料

因此：

- Module 不得以 API 成功作為運作前提
- World 必須能在 API 失敗時保持結構一致性
- API 失敗不得導致世界進入不一致或不可回復狀態

---

## World Invariant

- API 是 World 與 Backend 之間唯一的事實交換邊界
- World 不得跳過 API 偽造或推論事實
- 前後端分離是世界的結構前提，而非可選實作

任何違反本文件規定的行為，
即視為破壞世界一致性。

---

End of World API Rules
