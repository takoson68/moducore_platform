# Convention
本文件不宣告有效行為邊界，
僅作為 Boundary 文件的推導依據與假說來源。


Title: Projects 子目錄結構邊界
Status: candidate
Scope: platform

## Boundary Statement
目前可知：project 層級在 platform/frontend/projects 下的 project-a、project-b、_proTemp 呈現 components、layout、modules、styles 四個子目錄的結構邊界。

## In-Scope Responsibilities
- project 層級下的子目錄結構，在 project-a、project-b、_proTemp 內可被視為同一邊界範圍。

## Out-of-Scope / Crossing Signals
- 若 platform/frontend/projects 下的子目錄結構出現不含 components、layout、modules、styles 其一的情況，可視為開始跨界的訊號。
- 若 platform/frontend/projects 下出現不同於四個子目錄的結構，可視為開始跨界的訊號。

## Explicitly Undecided Areas
- platform/frontend/projects 之外的目錄結構是否屬於同一邊界，目前未裁決。

## Evidence
- notes/001_projects_structure.md
