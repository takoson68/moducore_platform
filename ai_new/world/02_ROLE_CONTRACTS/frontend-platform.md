# Role Contract: Frontend Platform

Derived From: INV-01, INV-03, INV-06, INV-10, INV-11, INV-12, INV-13

本文件整理 Frontend Platform 在世界中的責任邊界，
內容來源為 `ai_new/world/01_WORLD_MODEL.md` 與 `ai_new/world/frontend-platform.md`。

## 角色定義
- Frontend Platform 是世界生命流程的協調層（Orchestration Layer）。
- Platform 在任何模組載入之前即已存在，且永遠存在於 World 中。

## 主要責任
- 啟動世界生命流程（boot）。
- 組裝世界所需的能力與模組，並協調啟動順序。
- 裁決模組是否可進入當前世界狀態（配合可見性與權限判斷）。
- 確保世界以 PlatformConfig 為藍圖運作。

## 不承擔的責任
- 不實作任何業務邏輯或領域功能。
- 不定義 Module 的內部行為、Store 的狀態結構、Routing 的具體路由。
- 不參與世界進入運行後的業務執行。

## 互動方式
- Platform 只能透過 Container 取得或協調能力。
- 不得繞過 Container 直接存取 Module、Store 或 Routing。

---

End of Frontend Platform Role Contract
