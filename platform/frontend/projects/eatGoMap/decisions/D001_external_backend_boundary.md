# 外部合作後端邊界

## Decision

- 定義 `eatGoMap` 前端與合作方後端的責任及資料交換邊界。

## Status

- accepted

## Context

- 前端建立於 ModuCore，合作開發者負責 PHP 後端、資料庫與獨立伺服器。
- 若前端依賴後端內部實作或直接存取資料庫，會破壞前後端分離與 World API 邊界。

## Options Considered

- 選項 A：前後端部署於各自伺服器，透過正式 API 契約交換資料。
- 選項 B：前端直接依賴合作方資料庫或 PHP 內部結構。
- 選項 C：在本 Repository 另行複製或擴寫合作方 PHP 後端。

## Chosen Direction

- 採用選項 A。
- 前端只感知 API base URL、請求／回應契約與公開錯誤語意，不感知後端資料庫或 PHP 內部架構。

## Impact

- 對架構的影響：Project 必須保留集中式 API transport 邊界，模組不得直接拼接散落的遠端端點。
- 對實作的影響：正式串接前須先確認 HTTPS、CORS、環境分流、錯誤格式與版本相容性。
- 對後續文件的影響：API 契約須放在 Project 自身規格中，不能反向修改平台 World 規則。

## Follow-up

- 與後端開發者共同建立 API 契約文件。
- 確認開發、測試與正式環境的 URL 及部署方式。
