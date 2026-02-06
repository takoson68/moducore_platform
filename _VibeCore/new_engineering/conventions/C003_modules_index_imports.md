# Convention
本文件不宣告有效行為邊界，
僅作為 Boundary 文件的推導依據與假說來源。


Title: @project/modules/index.js 入口引用邊界
Status: candidate
Scope: platform

## Boundary Statement
目前可知：project 層級在 moduleDiscovery.js 與 modulesRegistry.js 內，將 `@project/modules/index.js` 視為模組入口的引用邊界。

## In-Scope Responsibilities
- moduleDiscovery.js 與 modulesRegistry.js 內的入口引用行為被視為邊界內行為。

## Out-of-Scope / Crossing Signals
- 若 moduleDiscovery.js 或 modulesRegistry.js 不再匯入 `@project/modules/index.js`，可視為開始跨界的訊號。
- 若其他檔案開始匯入 `@project/modules/index.js`，可視為開始跨界的訊號。

## Explicitly Undecided Areas
- `@project/modules/index.js` 在其他範圍的使用情況，目前未裁決。

## Evidence
- notes/003_modules_index_imports.md
