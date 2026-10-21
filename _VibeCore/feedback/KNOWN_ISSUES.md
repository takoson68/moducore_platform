## [ISSUE-YYYYMMDD-001]
狀態：Open | Mitigated | Closed

描述：
影響範圍：
目前決策：
是否影響 world：Yes / No
備註：

## [ISSUE-20261021-001]
狀態：Open

描述：整合 p5 後執行 `npm audit --omit=dev`，現有依賴樹回報 5 項 high severity，涉及 Vue server renderer、nanoid、postcss 與 source-map-js；尚未逐項確認前端實際可利用性。
影響範圍：`platform/frontend/package-lock.json` 的轉移依賴與前端建置工具鏈。
目前決策：本次只做遊戲能力整合，不執行可能擴張版本範圍的自動修復；後續應建立獨立相依升級批次，先比較 `npm audit fix --dry-run`、建置與多 Project 回歸影響。
是否影響 world：No
備註：`game-demo`、`project-a`、`project-b` 建置仍通過；此紀錄不代表弱點可忽略。
