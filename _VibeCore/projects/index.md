# projects/index.md
## VibeCore — Project Instance Layer Definition

---

## 0. 本目錄的角色（必讀）
`projects/` 為 VibeCore 的 **專案實例層（Project Instance Layer）**。

本層存在的唯一目的，是：

> **使用既有世界與工程能力，  
> 產生一次性的、具體可運行的專案實例。**

`projects/` 不定義世界、不建構能力、不裁決工程規則，  
僅作為「世界被使用一次」的具體結果承載層。

補充說明：

- 本層所定義的文件格式與模板，主要用途是 **未來新 project 的生成標準**
- 新 project 預設生成的是 **工程骨架**
- 新 project **預設不生成** `<project>/index.md`、`<project>/PROJECT_CONTEXT.md`、`<project>/decisions/`
- 本層不要求對既有舊專案進行補寫、補齊或回填說明文件
- 既有專案可作為觀察樣本，但不應因為缺少新格式文件，就被強制視為必須立即補件

---

## 1. 專案的本質定位
在 VibeCore 中：

- 一個 project 是：
  - 世界能力的組合應用
  - 模組與技能的使用情境
  - 商務與情境資料的聚合點

- 一個 project 不是：
  - 可重複使用的構件
  - 世界或工程的延伸定義
  - 架構規則的來源

---

## 2. Project 層的責任範圍（Scope）
### Project 層只負責：
- 宣告專案的基本資訊與目標
- 選擇欲使用的 modules 與 skills
- 提供商務邏輯與情境資料
- 組織並承載專案所需的設定內容

### Project 層 **不負責**：
- 定義或修改世界規則
- 建立或改寫核心能力
- 重新解釋模組或技能語意
- 擴張任何上層權限

---

## 3. Project 與其他層的關係
### 與 `world/`
- projects 完全服從 world 層裁決
- 不得推翻或模糊任何世界定義

### 與 `core/`
- projects 不得直接依賴 core 實作
- 所有能力必須透過 skills 使用

### 與 `skills/`
- projects 可以呼叫或配置 skills
- 不得改寫 skill 的行為定義

### 與 `_VibeCore/modules/`
- projects 可以使用 module 實體
- 不得定義新的 module 類型或語意
- 不得要求 module 具備裁決權

---

## 4. 專案建立的最低宣告需求
每一個專案目錄，至少必須明確宣告：

1. **專案目的**
   - 專案要解決的問題或場景

2. **模組選擇**
   - 使用哪些 module 實體
   - 各模組所扮演的角色

3. **技能使用**
   - 專案需要哪些 skill
   - 技能的調用順序或配置

4. **商務與情境資料**
   - 與該專案相關的 domain data
   - 環境、限制或假設條件

若新 project 預設不生成 Markdown 專案文件，
則上述最低宣告必須至少收斂到 `project.config.js` 或等價的專案設定檔中。

最低可落地欄位如下：

- `name`
- `title`
- `tenant_id`
- `modules`
- `description`
- `scenario`
- `skills` 或 `capabilities`
- `constraints` 或 `assumptions`

---

## 5. Project 文件管理方式（正式）

`projects/` 採用 **index.md 導讀管理**。

這代表：

- `projects/index.md` 是本層唯一合法入口
- `projects/` 下若新增具語意責任的子目錄，必須設置自己的 `index.md`
- 若任務明確要求生成 project 文件，該 project 實例目錄才需要以自己的 `index.md` 作為入口
- 若 project 未生成 `index.md`，則應以 `project.config.js` 與實際工程骨架作為該實例的最低理解入口
- 不得在已生成 `index.md` 的情況下跳過 `index.md` 直接將個別文件視為該層定義來源

本層正式工程文件如下：

1. `PROJECT_AUTHORING_STANDARD.md`
   - 定義所有 project 文件的固定寫法、章節與欄位
2. `PROJECT_SCAFFOLD_PROTOCOL.md`
   - 定義新 project 建立時的最低結構、檔案與建立流程
3. `PROJECT_CONFIG_SCHEMA.md`
   - 定義 `project.config.js` 的最低合法欄位與格式
4. `PROJECT_GENERATION_PROMPT.md`
   - 提供可直接交給 AI / Agent 使用的新 project 生成指令模板
5. `templates/index.md`
   - 管理本層所有可直接複用的 project 文件模板

這些文件的用途是：

- 定義之後建立新專案時應如何生成工程骨架
- 提供 AI 與人類建立新專案時的共用結構思路
- 降低新專案產出時的格式漂移

這些文件的用途 **不是**：

- 對既有專案全面回填文件
- 強制要求所有歷史專案補齊同一批說明檔
- 將 project 文件工程反向灌回已穩定運作的舊專案

---

## 6. 建議閱讀順序（本層）

在進入任何 project 實例前，請依以下順序閱讀：

1. `projects/index.md`
2. `PROJECT_AUTHORING_STANDARD.md`
3. `PROJECT_SCAFFOLD_PROTOCOL.md`
4. `PROJECT_CONFIG_SCHEMA.md`
5. `PROJECT_GENERATION_PROMPT.md`
6. `templates/index.md`
7. 目標 project 的工程骨架與 `project.config.js`

若任務只是理解某現有專案，可在完成 1 至 4 後進入該專案。
若任務是建立新專案，1 至 4 為必讀。
若任務明確要求產生專案文件，才進一步套用模板。
若未生成專案文件，則以 `project.config.js` 作為該 project 的最低宣告入口。

---

## 7. Project 與產出的關係
Project 層本身：

- 可以產生：
  - 專案設定檔
  - 專案專屬程式碼
  - 專案說明文件

- 不應產生：
  - 通用模組
  - 可被重複使用的技能
  - 世界層或工程層文件

---

## 8. 裁決聲明
- 本目錄 **不具任何裁決權**
- 專案內容僅對自身專案有效
- 專案結構與內容不得反向影響上層設計
- 本目錄可定義 project 文件格式與實例層最低結構
- 上述格式與結構僅限於 project instance layer，不得外推為 world 或 core 規則

---

## 9. 當前狀態宣告
目前 `projects/` 處於：

> **實例定義期（Instance Definition Phase）**

在此階段：
- 可自由新增專案實例
- 可反覆調整專案內部結構
- 不得升級專案層權限或角色

---

## 10. 專案實例最低結構（固定）

每個 **新建** project 至少應具備：

- `<project>/project.config.js`
- `<project>/layout/`
- `<project>/modules/`
- `<project>/styles/`
- `<project>/docs/`

其中：

- `docs/` 保留作為新 project 自身的 AI 文件放置目錄
- 本目錄屬於 project instance 內部文件空間，不取代 `_VibeCore/` 的世界與工程治理文件
- `docs/` 不得承載平台共用規格
- 平台級、世界級、工程級規格一律只能存在於 `_VibeCore/`
- `docs/` 僅可放置該 project 自身的 AI 文件、任務上下文與專案內部補充資料

如需額外目錄，可新增，例如 `components/`、`services/`、`composables/`。

只有在任務明確要求時，才另外生成：

- `<project>/index.md`
- `<project>/PROJECT_CONTEXT.md`
- `<project>/decisions/`

上述規則適用於：

- 新建立的 project instance
- 明確指定要依新規格重建的 project

上述規則預設 **不適用於**：

- 歷史既有專案
- 單純作為參考樣本的舊專案
- 未被明確要求進行文件重構的現存 project

---

## 11. 專案文件固定原則

為確保新專案具備一貫書寫方式：

- 若有生成 project 文件，同類型文件必須沿用相同章節骨架
- 若有生成專案入口文件，一律由 `index.md` 管理閱讀順序
- 若有生成背景文件，專案背景、限制、目標一律集中於 `<project>/PROJECT_CONTEXT.md`
- 若有生成決策文件，架構判斷與取捨一律記錄於 `decisions/`
- 若模板與實際專案不一致，應先更新模板，再擴散到新專案
- 若觀察到舊專案與模板不一致，應先視為「歷史現況」，不是立即補寫指令

---

## 12. Registry

- `PROJECT_AUTHORING_STANDARD.md`
- `PROJECT_SCAFFOLD_PROTOCOL.md`
- `PROJECT_CONFIG_SCHEMA.md`
- `PROJECT_GENERATION_PROMPT.md`
- `templates/index.md`

---

本文件為 `projects/` 目錄之唯一合法入口。  
任何未依本文件所述之專案行為，皆視為不合法 project。

---
