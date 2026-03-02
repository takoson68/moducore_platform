# PROJECT_AUTHORING_STANDARD.md
## VibeCore Project Authoring Standard

---

## 0. 本文件的用途
本文件定義 `projects/` 層所有工程文件的固定書寫方式。

其目的不是定義 project 的內容本身，
而是確保：

- 不同專案使用一致的文件骨架
- 新專案可沿用同一脈絡被建立
- AI 與人類在建立新專案時，不重新發明文件格式

補充界線：

- 本文件描述的是「若要生成 project 文件，應如何書寫」
- 本文件 **不代表** 每個新 project 都必須預設生成這些 Markdown 文件

---

## 1. 適用範圍
本文件適用於：

- `projects/<project-name>/index.md`
- `projects/<project-name>/PROJECT_CONTEXT.md`
- `projects/<project-name>/decisions/*.md`
- `projects/<project-name>/modules/` 內的專案級說明文件
- 未來新增之任何 project instance 文件

本文件不適用於：

- `world/`
- `core/`
- `skills/`
- `new_engineering/`

---

## 2. 核心原則

### 2.1 單一入口原則
- 若 project 有生成文件，該實例目錄必須由 `index.md` 作為唯一入口
- 若 project 未生成文件，則由 `project.config.js` 承載最低宣告資訊
- 不得在已生成 `index.md` 的情況下跳過 `index.md` 直接引用其餘文件作為專案定義來源

### 2.2 單一背景原則
- 專案背景、目標、限制、假設，統一收斂於 `PROJECT_CONTEXT.md`
- 其他文件不得各自擴寫一份背景版本

### 2.3 單一決策記錄原則
- 架構取捨、特殊例外、重大調整，必須集中記錄於 `decisions/`
- 不得把決策內容散落在 changelog、註解或臨時文件中

### 2.4 同類型同骨架原則
- 同類型文件必須沿用同一組固定章節
- 可補充，不可任意改名或省略核心章節

---

## 3. 必備文件
若任務明確要求生成 project 文件，至少必須包含：

1. `index.md`
2. `PROJECT_CONTEXT.md`
3. `decisions/`

若缺少上述任一項，視為文件結構不完整。

若任務未要求生成 project 文件，
則本章不適用。

---

## 4. `index.md` 固定章節
每個 project 的 `index.md` 必須至少包含以下章節：

1. `0. 本專案的角色`
2. `1. 專案目的`
3. `2. 閱讀順序`
4. `3. 專案結構`
5. `4. 入口與啟動點`
6. `5. 模組與頁面範圍`
7. `6. 專案限制`
8. `7. 文件 Registry`
9. `8. 裁決聲明`

用途要求：

- `index.md` 只負責入口、導讀、結構、範圍與文件註冊
- `index.md` 不應承載過多背景敘述
- `index.md` 不應取代 `PROJECT_CONTEXT.md`

---

## 5. `PROJECT_CONTEXT.md` 固定章節
每個 project 的 `PROJECT_CONTEXT.md` 必須至少包含以下章節：

1. `0. 文件用途`
2. `1. 專案目標`
3. `2. 成功條件`
4. `3. 使用者與場景`
5. `4. 商務範圍`
6. `5. 功能範圍`
7. `6. 非目標`
8. `7. 已知限制`
9. `8. 外部依賴`
10. `9. 假設`

用途要求：

- 這是專案背景與範圍的唯一主文件
- 所有需求理解應以此為基準
- 若專案方向改變，優先更新本檔

---

## 6. `decisions/*.md` 固定章節
每一份決策文件至少應包含：

1. `Decision`
2. `Status`
3. `Context`
4. `Options Considered`
5. `Chosen Direction`
6. `Impact`
7. `Follow-up`

命名建議：

- `D001_<short-name>.md`
- `D002_<short-name>.md`

---

## 7. 書寫語氣與格式

- 使用繁體中文
- 優先使用陳述句，不使用口語化備忘錄格式
- 標題固定使用 Markdown 標題結構
- 清單優先使用短句，不寫成零散片語
- 相同概念應使用相同命名，不任意替換詞彙

---

## 8. 內容分工

`index.md` 負責：
- 導讀
- 範圍
- 結構
- 文件註冊

`PROJECT_CONTEXT.md` 負責：
- 目標
- 場景
- 限制
- 假設

`decisions/` 負責：
- 取捨
- 理由
- 影響

`project.config.js` 負責：
- 執行時設定
- 模組選擇
- 專案啟用面

---

## 9. 禁止事項

- 用 `README.md` 取代 project `index.md`
- 在多個文件重複定義專案目標
- 把決策寫進 `PROJECT_CONTEXT.md`
- 把背景寫進 `index.md` 使其過度膨脹
- 跳過模板，直接以自由格式建立新專案文件

---

## 10. 模板使用規則

建立新 project 且明確要求生成文件時：

1. 先閱讀 `projects/index.md`
2. 再閱讀 `PROJECT_AUTHORING_STANDARD.md`
3. 依 `PROJECT_SCAFFOLD_PROTOCOL.md` 建立骨架
4. 依 `templates/index.md` 選用對應模板

未依此順序建立者，視為非標準 project 文件流程。

---
