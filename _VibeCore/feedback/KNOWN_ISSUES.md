## [ISSUE-YYYYMMDD-001]
狀態：Open | Mitigated | Closed

描述：
影響範圍：
目前決策：
是否影響 world：Yes / No
備註：

## [ISSUE-20261029-001]
狀態：Closed

最新：2026-10-29 使用全新 `dep_platform-chat_v0.1.11` Tag 經正式 Staging Workflow 發布 Chat Worker，GitHub Actions 40824297492 成功；Cloudflare active version `c87c5a13-a8c7-42ad-92ec-65ef2be72307`。game-demo Staging 送出「M0 重驗合成訊息」後重整及另開分頁均能回放，M0 手動 Gate 通過。下方為首次失敗的歷史觀察。

描述：chatCore P2P M0 手動驗證中，game-demo Staging 公開聊天室送出合成訊息後當頁可見，但重整及另開同站分頁後均顯示「尚無訊息」；本機 `chat-poc.test.mjs` 的歷史回放測試通過。唯讀部署資訊顯示 active Chat Worker 版本建立於 2026-10-27 台北 13:40，早於本機 SQLite 歷史回放 commit `e08527f`（台北 15:57），版本落差足以解釋觀察；未取得線上 script 原文，仍待新版實測。
影響範圍：`game-demo-staging.takoson68.workers.dev` 使用的公開聊天室歷史回放；chatCore M0 手動 Gate，M0a 尚未開始。
目前決策：版本落差已以受控 Staging 發布及手動重驗處理；此項關閉。未發布 Production，後續 chatCore M0a 仍須單獨啟動。詳見 `_workspace/_reports/2026-10-29_chatcore_p2p_plan/M0_RESULT.md`。
是否影響 world：No
備註：本次只送出「M0 合成測試訊息」；未使用私人資料或帳號。

## [ISSUE-20261021-001]
狀態：Open

描述：整合 p5 後執行 `npm audit --omit=dev`，現有依賴樹回報 5 項 high severity，涉及 Vue server renderer、nanoid、postcss 與 source-map-js；尚未逐項確認前端實際可利用性。
影響範圍：`platform/frontend/package-lock.json` 的轉移依賴與前端建置工具鏈。
目前決策：本次只做遊戲能力整合，不執行可能擴張版本範圍的自動修復；後續應建立獨立相依升級批次，先比較 `npm audit fix --dry-run`、建置與多 Project 回歸影響。
是否影響 world：No
備註：`game-demo`、`project-a`、`project-b` 建置仍通過；此紀錄不代表弱點可忽略。

## [ISSUE-20261016-002]
狀態：Mitigated

最新：M4 工程已發布，CI 38863036522 與線上 Employee 驗收通過；無預填帳密、員工不開通帳戶的契約已落地。真實管理員仍未建立，不能以合成驗收帳號登入；下方未部署內容為歷史紀錄。

描述：project-b 的實際 PlatformLoginPanel 仍預填示範帳密，提示不同且沒有對應新 D1 帳戶；登入／還原／登出 rejection 缺少完整 try/catch/finally。EmployeeEditor 收密碼卻不收 username，舊 Employee API 只建員工不建帳號；前後端帳戶佈建契約不完整。
影響範圍：platform/frontend/projects/project-b/components/PlatformLoginPanel.vue；modules/employee/components/EmployeeEditor.vue；舊 EmployeeController.php 僅作來源參考。
目前決策：M4-A1 已本機修正面板預填值與例外收尾，10 項邏輯測試、3 項 API 測試與 real build 通過，尚未部署。Employee 佈建契約與完整登入驗收仍未完成，故不關閉問題。見 M4_A1_LOGIN_PANEL_RESULT.md；不建立預設帳密或公開 seed，不修改 PHP。
是否影響 world：No

## [ISSUE-20261016-004]
狀態：Mitigated（本機修正，角色 UI Gate 待補）

最新：86810ff 已發布，CI 38863036522 與線上 Employee 權限／本人 ID 驗證通過。以下未部署為歷史狀態；保守歷史刪除仍另列 ISSUE-20261016-005。

2026-10-16 更新：角色 UI Gate 已完成，包含主管／本人／無關聯／錯誤重試／不同帳號切換，見 M4_D2_ROLE_RESULT.md。仍未部署，維持 Mitigated 直到線上驗收；下方「角色待補」為歷史紀錄。

更新：M4-D 已移除模糊本人／users.id 回退、密碼持久化、notification 私有引用，服務明確拒絕失敗回應；60 項測試與管理員瀏覽器 CRUD 通過。主管／本人完整 UI 尚未驗收，未部署；詳見 M4_D_FRONTEND_RESULT.md。以下為修正前描述。

描述：Employee 本人資料以 email／username 推測，無關聯時回退 auth user，更新可能混用 users.id 與員工 member_id；mock、Store 與 Service 保留 password，且 Service 直接依賴 notification 私有服務。錯誤形狀可轉成空清單，不能據空表判斷 API 正常。
影響範圍：platform/frontend/projects/project-b/modules/employee/pages/list.vue、api/employeeApi.js、store.js、services/employeeService.js。
目前決策：列入 M4-C／D；先確認員工與帳戶關聯契約，後端必須以 Session 授權、精確 user_id 關聯，不沿用前端猜測。未修復、不改 PHP。詳見 M4_B_EMPLOYEE_SPEC.md。
是否影響 world：No

## [ISSUE-20261016-005]
狀態：Mitigated

描述：M4-C Employee 刪除在其他 project_b_* 業務表存在時一律拒絕，比「僅有歷史引用才拒絕」更保守；尚無精確歷史引用判定。
影響範圍：platform/worker/src/employees.js deleteEmployee。
目前決策：避免尚未移植表造成漏刪保護，先 fail-closed；有帳戶關聯永不經此 API 刪除。後續 Task／Vote／Notification 移植須同步補明確外鍵及精確判斷，測試有／無引用，不能直接刪除此保護。見 M4_C_CRUD_RESULT.md。
是否影響 world：No

## [ISSUE-20261015-001]
狀態：Open

描述：舊 PHP Auth 直接比對密碼，session 未以 X-Project 限縮 tenant；EmployeeController 未見後端權限檢查。新 Workers Auth 已採密碼／Token 雜湊與 tenant 隔離，但尚未發布，舊 PHP 不應視為已修復。
影響範圍：platform/backend/src/Controllers/AuthController.php:81、197；EmployeeController.php。
目前決策：保留舊實作作為移植參考，新環境依 M3_AUTH_CONTRACT.md 驗證；員工端點於 M4 補上後端授權。
是否影響 world：No

## [ISSUE-20261015-002]
狀態：Open

描述：DineCoreStaffApiController.php:2699 呼叫 resolveNextGeneratedTableCodeSequenceForMap，但 src 未找到該方法定義。
影響範圍：地圖儲存 helper 關聯，API-019／API-020；實際觸發條件尚待驗證。
目前決策：不為驗證新後端而修補舊 PHP；於 M6 地圖移植批次明確定義並測試桌號編碼行為。
是否影響 world：No
