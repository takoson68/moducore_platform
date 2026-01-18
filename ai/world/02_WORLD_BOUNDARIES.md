# World Boundaries

本文件定義模組開發平台世界中
「永不可被跨越的邊界」。

任何行為一旦跨越本文件所定義的邊界，
即視為破壞世界一致性。

---

## Boundary 1：Single World Instance

- 在任何時間點，只允許存在一個 World 實例
- 不允許同時載入兩個不同 tenant_id 的 World

世界之間：
- 不可並存
- 不可合併
- 不可相互存取任何狀態或能力

此限制屬於世界級限制，不可被覆寫。

---

## Boundary 2：Project Isolation

- 每一個 Project 視為一個獨立國家或平行世界
- Project 之間的資料、設定、狀態必須完全隔離

禁止：
- 共用 store
- 共用世界狀態
- 跨 Project 的直接行為影響

刪除一個 Project：
- 等同關閉一個世界
- 不可影響其他 Project 或 Platform 的存在

---

## Boundary 3：Container as the Only Capability Gateway

- Container 是 World 中取得能力的唯一合法入口
- 未註冊進 Container 的能力，在 World 中視為不存在

禁止：
- 模組之間直接 import 業務能力
- 繞過 Container 取得其他模組能力

Container 僅負責：
- 能力註冊
- 能力提供
- 依賴隔離

---

## Boundary 4：Module Non-Awareness

- Module 不得假設其他 Module 必然存在
- Module 不得依賴其他 Module 的實體存在

世界必須保證：
- 任一 Module 缺席時，其它 Module 仍可安全運作
- Module 的存在與否不得成為世界崩潰的原因

---

## Boundary 5：Registration Defines Existence

- `container.register` 是模組存在於世界中的唯一判準
- 未經註冊的 Module：
  - 不得影響世界
  - 不得影響其他模組
  - 不得產生副作用

模組檔案存在 ≠ 模組存在於世界中。

---

## Boundary 6：Visibility Is Not Existence

- 模組是否可見，與模組是否存在，是兩個不同概念

定義：
- 不可見模組：
  - 不得被註冊進 Container
  - 不得執行 init
  - 不得影響世界行為

可見性判斷失敗的模組：
- 必須在進入 Container 前被攔截

---

## Boundary 7：Low Coupling Is Mandatory

- 低耦合不是最佳實踐，而是世界存活條件

禁止：
- 緊耦合跨模組設計
- 依賴模組載入順序的隱性行為
- 無 Container 的跨模組影響

任何破壞低耦合的行為，
視為結構性錯誤。

---

## Boundary 8：State Authority

- 任何會影響 World 未來行為的資料，必須進入 Store
- 不影響 World 未來行為的資料，不得強制入 Store

允許：
- Ephemeral Data 存於記憶體或瀏覽器
- Ephemeral Data 不得成為世界決策依據

---

## Boundary 9：Router as Final Defense

- Routing System 是使用者進入世界內容的最後防線
- Routing 不得作為模組存在的判準
- Routing 不得創造模組能力

Routing Guard 必須阻止：
- 未授權存取
- 不合規路徑進入
- 世界語意衝突的顯示行為

---

## Boundary 10：PlatformConfig Supremacy

- PlatformConfig 是世界誕生前的藍圖
- World 行為不得違反 PlatformConfig

禁止：
- run-time 動態修改 PlatformConfig 核心語意
- 模組覆寫世界藍圖

---

## Boundary 11：Reset Is World Rewind

- Reset 代表世界倒帶
- Reset 不得改變 PlatformConfig
- Reset 後 World 必須回到未登入狀態

Reset 不是重建世界，
而是清空世界內容。

---

## Boundary Invariant

- 世界不關心模組存在，但必須確保缺席安全
- 世界行為必須可預期
- 世界結構必須可除錯

---

End of World Boundaries
