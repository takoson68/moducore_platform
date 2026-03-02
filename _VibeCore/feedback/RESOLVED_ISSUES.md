## [ISSUE-20260302-001]
狀態：Closed

描述：
`flowCenter` 將模組資料入口集中在 project-level `services/flowCenterApi.js`，各模組 `service.js` 直接依賴該共享 wrapper，而不是在模組內自有 `api/` 邊界中解決資料需求。

影響範圍：
- `platform/frontend/projects/flowCenter/services/flowCenterApi.js`
- `platform/frontend/projects/flowCenter/modules/*/service.js`
- 所有後續 flowCenter 模組的 API 對齊工作

目前決策：
已將 `flowCenter` 的業務模組 API 對接回收至各模組自己的 `api/` 邊界，project-level `flowCenterApi.js` 已移除；認證 session 另以 `flowCenterSessionApi.js` 獨立處理。

是否影響 world：No

備註：
此問題直接違反目前已記錄的工程候選哲學：
- `AB-WC-module-data-ownership.md`
- `AA-WC-project-api-boundary-non-pollution.md`

## [ISSUE-20260302-002]
狀態：Closed

描述：
`flowCenter/project.config.js` 仍宣告「目前階段只建立靜態介面，不實作業務邏輯」，但實際上前後端已存在多個 CRUD 與審核流程實作，專案宣告與工程現況不一致。

影響範圍：
- `platform/frontend/projects/flowCenter/project.config.js`
- `platform/frontend/projects/flowCenter/modules/*`
- `platform/backend/src/Controllers/FlowCenter*.php`

目前決策：
已更新 `flowCenter/project.config.js`，使 scenario 與 constraints 反映目前已進入資料對接、角色隔離與流程整合階段。

是否影響 world：No

備註：
此問題會影響後續 AI / 工程人員對專案階段與可修改範圍的判讀。
