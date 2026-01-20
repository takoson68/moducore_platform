# World Index (ai_new)

本文件為 ai_new 世界文件的入口與閱讀順序。

World Version: v2
Status: Governance Complete

## Reading Order（治理主鏈）

1. 00_PURPOSE.md
2. 01_WORLD_MODEL.md
3. 02_WORLD_BOUNDARIES.md
4. 03_WORLD_API_RULES.md
5. 04_WORLD_LIFECYCLE.md
6. 09_WORLD_RULES.md
7. 05_OUTPUT_DEFINITION.md
8. 06_STRUCTURE_AND_NAMING.md
9. 07_AUTHORING_STYLE.md
10. 08_CHANGE_PROTOCOL.md

---

## Boot Instruction

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



---

## World 主鏈（會裁決世界）

以下文件構成 World 的**主鏈定義**，  
其內容具備裁決力，違反即視為破壞世界一致性。

```text
00_PURPOSE.md                  這套世界文件為何存在、給誰用、如何被閱讀
01_WORLD_MODEL.md              世界裡有誰
02_WORLD_BOUNDARIES.md         哪些事永不可做
03_WORLD_API_RULES.md          世界如何合法接觸真實
04_WORLD_LIFECYCLE.md          世界如何生成、啟動、重置與消亡
05_OUTPUT_DEFINITION.md        世界對外會產出什麼
06_STRUCTURE_AND_NAMING.md     世界的結構與命名如何被約束
07_AUTHORING_STYLE.md          世界文件本身應如何被撰寫
08_CHANGE_PROTOCOL.md          世界規則應如何被修改與演進
09_WORLD_RULES.md              世界運作時必須遵守的一般規則

```

## Reading Order vs File Prefix

世界主鏈文件的**閱讀與理解順序**，
一律以本文件（INDEX.md）所定義之 Reading Order 為準。

檔名前綴數字僅作為：
- 結構分類識別
- 歷史命名與穩定引用用途

**不代表閱讀順序，
亦不得作為推論世界理解流程的依據。**

若閱讀順序與檔名前綴出現不一致，
必須以 INDEX.md 為最高權威。


## Reading Order（強制）

你必須依以下順序閱讀世界主鏈文件，
不得跳讀或選讀：

1. 00_PURPOSE.md
2. 01_WORLD_MODEL.md
3. 02_WORLD_BOUNDARIES.md
4. 03_WORLD_API_RULES.md
5. 04_WORLD_LIFECYCLE.md
6. 09_WORLD_RULES.md
7. 05_OUTPUT_DEFINITION.md
8. 06_STRUCTURE_AND_NAMING.md
9. 07_AUTHORING_STYLE.md
10. 08_CHANGE_PROTOCOL.md

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

- 09_WORLD_RULES 為世界運行階段的一般裁決規則，其層級低於 World Boundaries，但仍具備世界裁決力，並受 Change Protocol 管轄。

---

---
## Operational Worlds Entry（運行語意層入口）

本新世界已完成世界裁決層（World Core），  
並正式開放運行語意層（Operational Worlds）以供測試與使用。

### 可進入之運行語意層

在完成世界主鏈（00–09）閱讀後，  
讀者 **被允許** 進入以下世界延伸層：

- **API World**：`ai_new/api/`
  - 作為世界對外語意表達介面
  - 不具世界裁決權
  - 不得回寫或改寫世界規則

- **Module World**：`ai_new/modules/`
  - 作為世界內部功能與 UI 單位
  - 不影響世界生命週期
  - 僅能依附於既有世界裁決存在

### 導讀約束

- 運行語意層僅用於理解與驗證世界如何被使用
- 不得將其內容反向推論為世界裁決或結構定義
- 若發現與世界主鏈語意不一致，以世界主鏈為最終依據

---


---
## Model Extension Layer（結構延伸層）

本世界除主鏈（具備世界裁決力的文件）外，
另設一延伸敘事層（model），
用以補充既有世界概念之結構性描述。
請自 ai_new/world/model/INDEX.md 開始閱讀。

model 層：

- 不新增世界規則
- 不定義流程、時序或行為
- 不具備獨立的世界定義權

僅當你需要進行以下判斷時，
才應進入 model 層：

- 實際配置如何被視為合法宣告
- 結構組合是否可被世界承認
- 文件之間是否存在語意衝突

---

## Engineering Layer（工程層）

在完成世界主鏈（00–09）之閱讀與理解後：

- 若僅進行概念釐清、問題分析或世界層討論  
  → 不需進入 engineering 層

- 若你即將進行任何實際工程行為，例如：
  - 撰寫或修改程式碼
  - 建立、調整或重構目錄結構
  - 記錄問題、決策或變更
  - 使用 Git 保存或回溯工作狀態  

  則必須同時閱讀並遵守工程層入口文件。

engineering 層僅用於規範工程行為，
不得違反或改寫本世界所定義的任何內容。

---

## Consistency Report

- 不變量僅定義於 `ai_new/world/01_INVARIANTS.md`；其他文件僅引用 INV 編號。
- Role Contracts 皆含 Derived From；無缺口。
- feedback 內容未被寫成世界規則；未發現違規位置。
- 未發現內容重複、矛盾或來源不明的段落。

---

End of World Index
