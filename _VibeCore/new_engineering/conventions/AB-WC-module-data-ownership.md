# Convention Template

Title: Module Data Ownership
Status: candidate
Scope: platform
Statement:
- 模組本身必須解決自己的資料需求。
- 模組需要的 endpoint、payload、response mapping、錯誤處理、adapter 邏輯，應優先收斂在該模組或該 project 自有 API 層。
- 不得因單一模組的資料需求，回推修改共享層、其他模組，或把 module-specific 契約偽裝成平台共通能力。
- 共享層只能承載真正跨模組、跨 project 都成立的共用能力，不承載單一模組的資料語意。
Evidence:
- 2026-03-02 friction：處理 flowCenter API 對齊時，曾先修改 shared API helper，而不是先把資料需求留在模組 / project 內部，違反模組資料自主管理原則。
When to Promote:
- 同一原則在多個模組、多個 project 中重複被驗證。
- 多次 friction 都指向「module-specific data concern 被錯誤提升到 shared layer」。
When to Demote:
- 若未來平台已建立正式且穩定的 project-local API container 機制，且本規範內容被更高階文件完整吸收。
Exceptions:
- 已有正式核准的 shared transport 能力缺口，且新增內容不承載任何 module-specific 資料語意。
Notes:
- 這條不是偏好，而是專案核心哲學。
- 判斷原則不是「可不可以抽」，而是「這個資料需求是不是模組自己該負責」。
