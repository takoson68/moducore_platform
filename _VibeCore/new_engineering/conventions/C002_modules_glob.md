# Convention

Title: modules/index.js 掃描邊界
Status: candidate
Scope: platform

## Boundary Statement
目前可知：project 層級在 projects/*/modules/index.js 內，以 `import.meta.glob('./*/index.js')` 作為同層模組目錄的掃描邊界。

## In-Scope Responsibilities
- project 層級的 modules/index.js 內，負責掃描同層模組目錄的行為被視為邊界內行為。

## Out-of-Scope / Crossing Signals
- 若 projects/*/modules/index.js 出現非 `import.meta.glob('./*/index.js')` 的掃描方式，可視為開始跨界的訊號。
- 若 projects/*/modules/index.js 不再進行同層模組目錄掃描，可視為開始跨界的訊號。

## Explicitly Undecided Areas
- modules/index.js 之外的模組掃描方式是否屬於同一邊界，目前未裁決。

## Evidence
- notes/002_modules_glob.md
