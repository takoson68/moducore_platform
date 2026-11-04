# Tag 發布與版本控制台報告索引

## 範圍

本目錄記錄 `dep_<project>_v<version>` Staging Tag 發布、GitHub Release 成品保存、版本控制台切換／回退與相關里程碑證據。它是工作報告與歷史證據，不取代正式工程規範，也不代表 Production 是目前目標。

## 閱讀順序

1. 恢復當前狀態時，先讀 [`EXECUTION_PLAN.md`](./EXECUTION_PLAN.md) 的「目前停止點／當前已完成基線」；它記錄此里程碑狀態。
2. 執行發布前先讀 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`；此報告不可單獨作為操作授權或現行指令。
3. 只有在核對 Cloudflare Token 權限範圍時才讀 [`M9_2_CLOUDFLARE_TOKEN_SCOPE_FINDING.md`](./M9_2_CLOUDFLARE_TOKEN_SCOPE_FINDING.md)。
4. 只有在研究空白 Production D1 的備份／匯入演練證據時才讀 [`M9_2_D1_BACKUP_RESTORE_DRILL.md`](./M9_2_D1_BACKUP_RESTORE_DRILL.md)；其中 `production-backups/` 僅為 SQL 證據，不是可執行部署腳本。

## 權限與裁決

- 正式操作方式與安全限制由 `_VibeCore/engineering/` 索引及部署手冊裁決；本目錄僅提供里程碑、調查與驗證證據。
- 使用者已說明此專案為興趣用途、不打算營運；Production 工作不在目前範圍，M9 備份紀錄是歷史資料，不可視為待執行清單。
- 若里程碑報告與遠端 GitHub／Cloudflare 現況不同，以新的唯讀檢查證據校正報告，不可由舊紀錄推定現況。
