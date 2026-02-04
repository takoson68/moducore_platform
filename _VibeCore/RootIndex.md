# RootIndex.md
## ModuCore Platform — World Entry & Reading Guide

---

## 0. 本文件的地位（請務必先讀）
本文件是 **ModuCore Platform 的唯一入口與最高層導讀文件**。

任何人類或 AI：
- 在閱讀、修改、產生任何內容之前
- **必須先完整閱讀並理解本文件**

**未遵守本文件所定義之閱讀順序與邊界，即視為無效操作。**


---
## 1. 這個平台是什麼
ModuCore Platform 是一個：

> **以「世界觀治理」為核心、  
> 以「工程能力可插拔」為目標的專案生成與組裝平台。**

它的目的不是生成單一專案，而是：

- 封裝長期有效的工程決策
- 提供可攜、可重用、可演化的架構能力
- 讓新專案在「一開始」就站在正確結構上

---

## 2. 強制閱讀順序（不可跳過）
所有閱讀與理解，必須依照以下順序進行：

1. **RootIndex.md**（本文件）
2. `/world/index.md`
3. `/engineering/index.md`
4. `/core/index.md`
5. `/skills/index.md`
6. `/projects/index.md`

⚠️  
- 未依此順序閱讀者，不得進行任何實作、重構或生成行為  
- AI 不得自行選擇閱讀順序

---

## 2.1 World 主鏈閱讀順序（由 RootIndex 控制）
進入 `/world/index.md` 後，世界主鏈文件的閱讀順序由本節統一裁決：

1. `world/00_PURPOSE.md`
2. `world/01_WORLD_MODEL.md`
3. `world/02_WORLD_BOUNDARIES.md`
4. `world/03_WORLD_API_RULES.md`
5. `world/04_WORLD_LIFECYCLE.md`
6. `world/09_WORLD_RULES.md`
7. `world/05_OUTPUT_DEFINITION.md`
8. `world/06_STRUCTURE_AND_NAMING.md`
9. `world/07_AUTHORING_STYLE.md`
10. `world/08_CHANGE_PROTOCOL.md`

⚠️  
- 不得依檔名前綴或自訂順序閱讀  
- 若與任何世界內文件敘述衝突，以本節為唯一最高權威

---

## 3. 世界裁決權階層（極重要）
本平台所有文件與程式碼，皆遵守以下裁決權結構：

### 裁決權由高至低如下：
1. **world/**
   - 世界觀、治理規則、不可被覆寫
   - 等同憲法層級

2. **engineering/**
   - 工程規範與實務裁決
   - 可演化，但不得違反 world

3. **core/**
   - 核心能力與容器
   - 僅提供能力，不含專案邏輯

4. **skills/**
   - 可抽換的工程策略與功能模組
   - 僅能透過 core 能力運作，不得越界

5. **projects/**
   - 專案實例與商務邏輯
   - 不得反向影響上層

📌 **低層文件不得推翻高層裁決。**
📌 **RootIndex.md 僅定義裁決層級，不得改寫 world 內容。**

---

## 4. 行為邊界定義
### 允許的行為
- 新增或擴充 `/skills`
- 在 `/projects` 建立新專案實例
- 擴寫 `/engineering` 中的實務文件
- 在不違反 world 的前提下演化 core 實作

### 禁止的行為
- 修改或繞過 `/world` 定義
- 跳過 RootIndex.md 直接產出內容
- skill 直接操作檔案系統或硬編碼目錄結構
- 專案層影響世界或工程裁決

---

## 5. 給 AI / Agent 的特別指示
本平台為 **既有世界**，非空白專案。

AI 在此平台中必須遵守：
- 不得自行假設架構
- 不得臆測裁決權
- 不確定時必須提出詢問
- 嚴禁跨層級修改

AI 的角色是：
> **協助執行已定義的世界與工程規則，  
> 而非重新定義世界本身。**

---

## 6. 最後聲明
ModuCore Platform 的價值不在於技術選型，  
而在於 **可被長期攜帶與重複使用的工程決策結構**。

請以此文件作為一切行動的起點。

---

## 使用語言

- 你我之間的溝通一律使用繁體中文。
- 工程實作註解一律使用繁體中文。
- 語言風格屬於表達層規範，不得影響結構或語意裁決。

---


---

## Index-based Reading Protocol（閱讀協定 v1）

為確保本平台可被正確理解、維護、擴充與由 AI 協助產出，  
本系統採用 **Index-based Reading Protocol（索引導讀協定）**。

本協定適用於：
- 人類閱讀者
- AI / Agent
- 任何自動化生成或分析行為

---

### 一、唯一入口原則（Single Entry Point）

在本平台中：

> **任何具有語意、規則或裁決意義的目錄，  
> 必須以該目錄中的 `index.md` 作為唯一合法入口。**

未透過 `index.md` 進行閱讀與理解的文件內容：
- 不具裁決效力
- 不可作為修改或產出的依據

---

### 二、目錄責任原則（Directory Responsibility）

每一個 `index.md` 必須明確定義以下三項內容：

1. **目錄範圍（Scope）**
   - 本目錄負責的事項
   - 明確不負責的事項
   - 在整體平台中的層級位置

2. **閱讀順序（Reading Order）**
   - 必讀文件
   - 次要文件
   - 可選文件
   - 嚴禁未經說明即跳讀其他檔案

3. **裁決聲明（Authority）**
   - 本目錄內容是否可被修改
   - 是否可被擴充
   - 是否會受到上層或下層影響

---

### 三、裁決優先原則（Authority Precedence）

當多個文件出現語意衝突時，裁決權依下列順序判定：

1. `RootIndex.md`
2. 上層目錄的 `index.md`
3. 當前目錄的 `index.md`
4. 目錄內個別文件

**任何低層文件，不得推翻高層 index.md 的裁決。**

---

### 四、強制遵守原則（Mandatory Compliance）

以下行為在本平台中 **明確禁止**：

- 跳過任一層 `index.md` 直接閱讀或生成內容
- AI 自行推測目錄語意而未閱讀該層 index.md
- 將非 index.md 文件視為該目錄的裁決來源
- 在缺少 index.md 的目錄中進行實作或產出

---

### 五、適用範圍宣告

本閱讀協定適用於但不限於以下結構：

- 平台根目錄
- world / engineering / core / skills / projects
- 專案內模組（module）
- 未來新增之任何具備語意層級的子目錄

---

### 六、AI / Agent 行為附加規範

AI 或 Agent 在本平台中行為準則如下：

- 在執行任何生成、修改、推論之前  
  **必須先讀取對應層級之 `index.md`**
- 若 `index.md` 內容不足以推導行為  
  **必須提出詢問，而非自行假設**
- 不得跨越目錄層級邊界行動

---

本協定之目的，在於確保：

> **世界可被正確閱讀，  
> 架構可被長期攜帶，  
> 工程決策不因人或 AI 而漂移。**

---
