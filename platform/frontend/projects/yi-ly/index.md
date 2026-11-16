# yi-ly/index.md
## 易經解卦

## 0. 本專案的角色

本目錄為 `yi-ly` 的專案實例入口，承載卜法、卜問結構、可追溯文本、結果解讀、選配離線資料與受限制 AI 交接的產品規格及後續實作。

本目錄只負責本專案的導讀、結構、範圍與文件註冊；不取代 `PROJECT_CONTEXT.md`，也不定義上層 World、Engineering 或 API 規則。

## 1. 專案目的

- 提供本卦、動爻、之卦及其可追溯經文。
- 區分卜法、卜問步驟與同一結果的不同解讀，不把不同系統的規則混為一談。
- 讓使用者明確同意後下載版本化經文資料並離線使用。
- 產生結構化結果，第一版供使用者複製給外部 AI。

## 2. 閱讀順序

1. `index.md`
2. `PROJECT_CONTEXT.md`
3. `project.config.js`
4. `docs/index.md`
5. `docs/PROJECT_REQUIREMENT_SPEC.md`
6. `docs/DIVINATION_METHOD_TAXONOMY.md`
7. `docs/CORPUS_DATA_PIPELINE.md`
8. `docs/TECHNICAL_ARCHITECTURE_PLAN.md`
9. `decisions/`
10. `layout/`
11. `modules/`

## 3. 專案結構

- `PROJECT_CONTEXT.md`：專案背景、範圍、限制與假設。
- `project.config.js`：最低執行時身分與模組宣告。
- `docs/`：需求規格、卜法分類及技術架構計畫。
- `decisions/`：已接受或待裁決的專案決策。
- `layout/`：Project 視覺殼層；目前只有合法空殼。
- `modules/`：Module Registry；目前不啟用任何業務模組。
- `styles/`：Project 樣式入口；目前只有最低背景樣式。

## 4. 入口與啟動點

- 啟動入口：平台共用 `src/main.js` 與 `world.start()`。
- 專案選擇方式：`VITE_PROJECT=yi-ly`。
- 主要設定來源：`project.config.js`。
- 目前狀態：企劃與空骨架階段，尚未進入功能實作。

## 5. 模組與頁面範圍

- 核心模組：待 MVP 架構核准後建立。
- 主要頁面：預計涵蓋方法／結構選擇、逐步起卦、結果與解讀、來源、離線管理及選配本機歷史。
- 第一版 AI：只提供複製給外部 AI，不串站內模型。
- 導航原則：以手機優先的單一核心流程為主；未通過資料與規則 Gate 的方法不顯示，已納入的方法則清楚分流。

## 6. 專案限制

- 經文必須可追溯至明確底本、固定版本與授權紀錄。
- 古籍原文、本站簡明導讀及外部 AI 解讀必須分層。
- 使用者未同意前，不主動下載完整離線經文資料包。
- 不需要會員；卜卦歷史只由使用者選擇是否保存於本機。
- AI 不得加入未提供的占術，也不得把推測寫成經典結論。

## 7. 文件 Registry

- `PROJECT_CONTEXT.md`
- `project.config.js`
- `docs/index.md`
- `docs/PROJECT_REQUIREMENT_SPEC.md`
- `docs/DIVINATION_METHOD_TAXONOMY.md`
- `docs/CORPUS_DATA_PIPELINE.md`
- `docs/TECHNICAL_ARCHITECTURE_PLAN.md`
- `decisions/D001_traceable-corpus-and-ai-boundary.md`
- `decisions/D002_reading-frameworks.md`
- `decisions/D003_methods-and-consultation-layouts.md`
- `decisions/D004_corpus-authoring-and-release.md`
- `layout/index.js`
- `layout/LayoutRoot.vue`
- `modules/index.js`
- `styles/sass/main.sass`

## 8. 裁決聲明

- 本檔為本專案目錄唯一入口，只管理本專案閱讀順序與文件註冊。
- 企劃內容只對 `yi-ly` 生效，不構成平台共用規則。
- 若與 `_VibeCore/projects/index.md` 或 World 主鏈衝突，以上層裁決為準。
