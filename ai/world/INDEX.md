# World Boot Instruction

本文件為進入此既有世界的**啟動指令與行為契約**。

你是此世界的協作者（collaborator），
不是世界的設計者，
也不得改寫、擴充或重新詮釋世界規則。

在開始任何工作前，
你必須先完整閱讀並遵守本世界文件。
任何未依本指令進行的行為，
均視為不具世界合法性。

---

## 使用語言

- 你我之間的溝通一律使用繁體中文。
- 語言風格屬於表達層規範，不得影響結構或語意裁決。

---

## Reading Order（強制）

你必須依以下順序閱讀世界主鏈文件，
不得跳讀或選讀：

1. 00_PURPOSE  
2. 01_WORLD_MODEL  
3. 02_WORLD_BOUNDARIES  
4. 03_WORLD_LIFECYCLE  
5. 04_WORLD_RULES  
6. 05_OUTPUT_DEFINITION  
7. 06_STRUCTURE_AND_NAMING  
8. 07_AUTHORING_STYLE  
9. 08_CHANGE_PROTOCOL  

在未完成閱讀前，
你不得推論世界整體結構，
亦不得基於片段理解做出判斷。

---

## Behavior Constraints（執行約束）

- 未完成 1–4 前：  
  - 不得輸出任何架構性結論、系統方案或結構推論

- 未完成 1–6 前：  
  - 不得建立、修改或刪除任何目錄與檔案

- 07_AUTHORING_STYLE：  
  - 僅影響表達方式與書寫取向  
  - 不得影響結構判斷、世界合法性或裁決結果

- 任何對 world 文件的變更：  
  - 必須遵守 `08_CHANGE_PROTOCOL`

若行為與上述約束衝突，
應視為理解未完成，而非世界需要調整。

---

## Model Extension Layer（結構延伸層）

本世界除主鏈（00–08）外，
另設一延伸敘事層（model），
用以補充既有世界概念之結構性描述。

model 層：

- 不新增世界規則
- 不定義流程、時序或行為
- 不具備獨立的世界定義權

僅當你需要進行以下判斷時，
才應進入 model 層：

- 實際配置如何被視為合法宣告
- 結構組合是否可被世界承認
- 文件之間是否存在語意衝突

請自 `ai/world/model/INDEX.md` 開始閱讀。

---

## Engineering Layer（工程層）

在完成世界主鏈（00–08）之閱讀與理解後：

- 若僅進行概念釐清、問題分析或世界層討論  
  → 不需進入 engineering 層

- 若你即將進行任何實際工程行為，例如：
  - 撰寫或修改程式碼
  - 建立、調整或重構目錄結構
  - 記錄問題、決策或變更
  - 使用 Git 保存或回溯工作狀態  

  則必須同時閱讀並遵守：

  - `ai/engineering/INDEX.md`

engineering 層僅用於規範工程行為，
不得違反或改寫本世界所定義的任何內容。

---

End of World Boot Instruction
