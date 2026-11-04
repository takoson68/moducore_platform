# 前後端共用契約 Repository

## Decision

- 評估以前後端獨立 Repository 加上一個共用契約 Repository，管理雙方共同維護的文件。

## Status

- proposed

## Context

- `eatGoMap` 前端建立於 ModuCore Repository，合作方後端預計維持自己的 Repository。
- 雙方需要共同維護 API 與資料交換文件，但目前尚未與後端開發者討論 Git Repository 的實際組織方式。
- 若前後端各自複製同一份契約文件，容易產生版本漂移與正式來源不明的問題。

## Options Considered

- 選項 A：共用文件直接放在 ModuCore Repository，由後端開發者取得此 Repository 權限。
- 選項 B：建立獨立的共用契約 Repository，前後端各自以 Git Submodule 或其他受控方式引用。
- 選項 C：前後端 Repository 各保存一份文件，依人工方式同步。

## Chosen Direction

- 目前偏向選項 B，但尚未定案。
- 暫定概念名稱可使用 `eatGoMap-contracts`；正式名稱、擁有者、權限、引用方式與工作流程須先與後端開發者共同確認。
- 未確認前，不建立遠端 Repository、不加入 Submodule，也不將此提案視為正式協作規則。

## Impact

- 對架構的影響：前端與後端保持獨立，跨系統共用內容集中在第三個契約來源。
- 對實作的影響：若採 Submodule，兩邊 Repository 只記錄共用契約的特定 Commit 指標；更新契約後仍須各自更新引用版本。
- 對後續文件的影響：Project 內部 UI、Module 與 ModuCore 文件不進入共用 Repository；後端內部 PHP 與資料庫實作文件也不進入共用 Repository。

## Follow-up

- 與後端開發者確認是否接受獨立共用 Repository。
- 共同確認 Repository 擁有者、存取權限、Branch／Pull Request 流程及正式文件語言。
- 確認採 Git Submodule、Git Subtree 或只以外部連結引用；若要求文件實體出現在兩邊工作樹，優先評估 Submodule。
- 確認第一批共用文件：API 契約、資料字典、環境契約、待討論事項及契約變更紀錄。
