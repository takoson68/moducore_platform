# Boundary
本文件為目前世界承認之行為邊界，
用於判定 friction 與後續規範演化。


## Boundary Summary
本文件宣告 project 層級在 platform/frontend/projects 的子目錄結構邊界。

## Derived From
- C001_projects_structure.md

## Currently Accepted Boundary
目前被承認的責任分界為：project 層級在 platform/frontend/projects 下的 project-a、project-b、_proTemp 範圍內，子目錄結構呈現 components、layout、modules、styles 四個子目錄。

## Known Non-Decisions
- platform/frontend/projects 之外的目錄結構是否屬於同一邊界，目前未裁決。

## Violation Signals
- platform/frontend/projects 下的子目錄結構不含 components、layout、modules、styles 其一。
- platform/frontend/projects 下出現不同於四個子目錄的結構。

## Evolution Note
此邊界可能擴張、拆分或廢棄，但方向目前未具體化。
