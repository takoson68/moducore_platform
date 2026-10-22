---
status: active
updated: 2026-10-22
scope: release-retention
---

# Release 與成品保存政策

## 保存責任

- GitHub Release 是可回退的不可變正式原件，預設永久保存，不設定自動到期。
- 每個 Release 的 ZIP、manifest、checksum 必須一起保存；不得只刪其中一項造成不完整版本。
- Git Tag 不得刪除、移動或重用。即使依例外流程刪除 Release，也不代表可以重用 Tag。
- GitHub Actions Artifact 只供短期診斷，固定保存 7 天；正式回退不得依賴它。
- current、previous 永遠受保護。每個 Project 至少保存 3 個 `complete + verified` Release；尚未累積到 3 個時全部保存。
- Release 發布後 30 天內為冷卻期，不得刪除。

Release 刪除不是例行清理。只有 Admin 經重新驗證、完整影響清單與逐字確認，且因容量警戒、法務或已確認的錯誤成品需要處理時，才能在上述保護條件之外提出刪除。所有結果均須寫入 append-only Audit。

## 容量與版本警戒線

| 層級 | 單一 Project | Repository 合計 | 行動 |
|---|---|---|---|
| 正常 | `< 20` 版且 `< 1 GiB` | `< 50` 版且 `< 3 GiB` | 永久保存，不清理 |
| Warning | `>= 20` 版或 `>= 1 GiB` | `>= 50` 版或 `>= 3 GiB` | 盤點成長率與可刪候選，不自動刪除 |
| Critical | `>= 40` 版或 `>= 2 GiB` | `>= 100` 版或 `>= 5 GiB` | 提交人工保存方案，才評估 R2 |

R2 不因單次超標自動啟用。只有 Critical 持續 30 天，或依最近 90 天成長率預估 90 天內將達 Critical，才比較 GitHub Release、R2 成本、下載權限、完整性與維運負擔，交由人類決定。

## 目前基準（2026-10-22）

- 正式 Release：4 個；三項資產合計約 4.15 MB。
- Actions Artifact：10 個，約 10.4 MB，均在 2026-10-28 到期。
- game-demo 有 2 個 verified Release；dineCore、project-b 各 1 個，因此目前全部受最低保留規則保護，沒有可刪 Release。
- 容量層級為 Normal；沒有導入 R2 的理由。

## 可執行規則

`platform/release-console/retention-policy.mjs` 是保存數、冷卻期與容量警戒的機器可驗證版本。控制台刪除 Gate 會拒絕：

- 刪除後低於最低 verified 保留數。
- 缺少可驗證 `publishedAt`。
- 尚在 30 天冷卻期。
- 既有的 current／previous 保護仍優先適用。

容量檢查只產生 `normal | warning | critical` 與是否進入 R2 評估，不會自動刪除、搬移或購買儲存服務。
