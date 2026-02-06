# World Session Protocol

本文件定義 AI 在專案中的「世界上下文狀態切換」規則。

## 狀態定義

### State A — IN_WORLD（已進入世界）
- AI 必須遵守世界治理文件
- 禁止修改世界治理文件（世界主鏈、裁決文件、變更協議）
- 允許：依世界規則產出工程內容（code / notes / conventions / rules 的提議）

### State B — OUT_OF_WORLD（已登出世界）
- AI 不再以世界治理文件作為裁決來源
- 允許討論、草擬、重寫世界文件
- 禁止：在此狀態下宣告任何內容具有裁決權

### State C — MAINTENANCE（世界維護模式）
- 目的：修補世界文件本身（治理層的修正）
- 允許：修改世界文件，但必須遵守 Change Protocol
- 必須：先登出（OUT_OF_WORLD），再進入 MAINTENANCE
- 完成後：必須回到 IN_WORLD

## 切換指令（唯一合法語句）

### 進入世界
指令：ENTER_WORLD
效果：狀態切換為 IN_WORLD

### 登出世界
指令：EXIT_WORLD
效果：狀態切換為 OUT_OF_WORLD

### 進入維護模式
指令：ENTER_MAINTENANCE
前置：必須先 EXIT_WORLD
效果：狀態切換為 MAINTENANCE

### 結束維護並回到世界
指令：EXIT_MAINTENANCE
效果：狀態切換為 IN_WORLD

## 附加約束

- 在完成 STARTUP_DECLARATION 與 RootIndex.md 之導引後，
  閱讀者即視為已進入世界（IN_WORLD）
- 登出世界需使用者明確下達 EXIT_WORLD

- 若 AI 遇到「需要修改世界文件才能繼續」的阻塞點，必須中止並要求使用者下達：
  - EXIT_WORLD（允許討論/草擬）
  - 或 ENTER_MAINTENANCE（允許正式修改）
