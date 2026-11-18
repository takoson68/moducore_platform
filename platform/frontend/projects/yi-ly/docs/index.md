# yi-ly Docs Index

## 範圍

本目錄只保存 `yi-ly` 的產品需求、技術規劃與後續里程碑文件，不定義平台共用規則。

## 閱讀順序

1. `PROJECT_REQUIREMENT_SPEC.md`
2. `DIVINATION_METHOD_TAXONOMY.md`
3. `CORPUS_DATA_PIPELINE.md`
4. `TECHNICAL_ARCHITECTURE_PLAN.md`
5. `MEIHUA_METHOD_SPEC.md`（梅花易數後續方法草案）
6. 後續新增且由本索引註冊的里程碑或驗收文件

## Registry

- `PROJECT_REQUIREMENT_SPEC.md`：產品定位、Persona、MVP、流程、功能、卜問結構、規則及驗收標準。
- `DIVINATION_METHOD_TAXONOMY.md`：金錢卦、蓍草、梅花、六爻、龜卜、鳥卦、籤筊與六壬的邊界，以及多步驟卜問模型。
- `CORPUS_DATA_PIPELINE.md`：原始來源、來源追溯、機器解析、本機 D1 schema 及未來版本發布規劃。
- `TECHNICAL_ARCHITECTURE_PLAN.md`：權威資料、API、離線快照、AI 邊界及演進計畫。
- `MEIHUA_METHOD_SPEC.md`：梅花易數第一版年月日時起卦、體用解讀及發布 Gate 草案；前端初版已實作，方法仍未核准完整發布。

## 狀態

- 企劃與規格仍定義完整 MVP；目前僅部分功能已實作，狀態以 `platform/frontend/projects/yi-ly/index.md` 與 `_workspace/CURRENT_WORK.md` 為準。
- `decisions/D002_reading-frameworks.md` 保留為同一結果的不同閱讀視角與具來源解讀，屬未來範圍。
- `decisions/D003_methods-and-consultation-layouts.md` 定義卜法與多步驟卜問；兩者和 D002 並存，均未全部升為 MVP Must。
- `decisions/D004_corpus-authoring-and-release.md` 已接受為資料整理及發布的規劃方向。
- `decisions/D005_visible-source-attribution.md` 要求結果頁、離線與分享內容顯示正確署名及授權公告。
- `decisions/D006_mvp-content-and-display-scope.md` 裁決完整傳文資料、折疊顯示、第一版閱讀視角、本機歷史命名與實驗版自審流程；紀錄名稱規則已更新為首筆使用者輸入、後續沿用最近一筆使用者命名。
- `decisions/D007_source-preserving-corpus-import.md` 已裁決原典不經人工編修；機器解析與來源原文分欄保存，本機匯入不以人工校勘為 Gate。
