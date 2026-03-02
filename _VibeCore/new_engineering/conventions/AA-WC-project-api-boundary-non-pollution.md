# Convention Template

Title: Project API Boundary Non-Pollution
Status: candidate
Scope: platform
Statement:
- 專案層或模組層的 API 對齊需求，必須優先在該 project 自有的 API adapter、service 或 module 內處理。
- 模組本身必須先承擔自己的資料需求，不得把 module-specific 契約上推到 shared layer。
- 不得因單一 project 的 endpoint、method、payload 或 response 調整，直接修改 `platform/frontend/src/` 內的共享 API helper。
- 只有當需求已被證明為跨 project 共通能力，且完成明確提案後，才可升級到共享層。
Evidence:
- 2026-03-02 friction：為了對齊 `flowCenter` 後端 `PATCH` 更新 API，錯誤修改 `platform/frontend/src/app/api/http.js` 與 `platform/frontend/src/app/api/client.js`，造成 project requirement 反向污染 shared layer。
When to Promote:
- 至少兩個不同 project 出現同型 API 能力需求。
- 連續多次實作都需要相同 shared helper，且不存在 project-specific 變形。
When to Demote:
- 發現不同 project 的 API 契約差異仍大，shared helper 反而持續造成耦合與邊界污染。
Exceptions:
- 平台層已存在正式核准的共用 transport 能力缺口，且已有明確 promotion proposal。
Notes:
- 本規範用於阻止 project implementation 壓回 platform shared layer。
- 目標不是禁止共享，而是禁止未經升級流程的提早共享。
- 若需要判斷資料責任歸屬，應優先參考 `AB-WC-module-data-ownership.md`。
