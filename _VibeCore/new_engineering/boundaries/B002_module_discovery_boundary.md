# Boundary

## Boundary Summary
本文件宣告 project 層級在 modules 入口引用與掃描行為的邊界。

## Derived From
- C002_modules_glob.md
- C003_modules_index_imports.md

## Currently Accepted Boundary
目前被承認的責任分界為：project 層級在 projects/*/modules/index.js 內進行同層模組目錄掃描，且 moduleDiscovery.js 與 modulesRegistry.js 以 `@project/modules/index.js` 作為模組入口引用。

## Known Non-Decisions
- modules/index.js 之外的模組掃描方式是否屬於同一邊界，目前未裁決。
- `@project/modules/index.js` 在其他範圍的使用情況，目前未裁決。

## Violation Signals
- projects/*/modules/index.js 不再使用 `import.meta.glob('./*/index.js')` 掃描同層模組目錄。
- moduleDiscovery.js 或 modulesRegistry.js 不再匯入 `@project/modules/index.js`。
- 其他檔案開始匯入 `@project/modules/index.js`。

## Evolution Note
此邊界可能擴張、拆分或廢棄，但方向目前未具體化。
