# yi-ly Corpus Workspace

## 0. 目錄角色

本目錄是 `yi-ly` 易經資料整理工作區，保存來源快照、匯入後的整理資料、人工編修內容、審校紀錄與可重建發布產物。

本目錄只屬於 `yi-ly` Project，不是平台共用資料區，也不是 production D1 的直接編輯介面。

## 1. 資料流程

```text
sources/ → raw/ → staging/ → canonical/ + interpretations/ + reviews/ → releases/
```

- `sources/` 登記來源、固定頁面與授權／署名資料。
- `tools/` 保存可重跑的來源清單與快照匯入工具。
- `raw/` 保存未修改的維基文庫固定 revision 原始快照。
- `staging/` 保存可由匯入程式重建的解析結果。
- `canonical/` 保存整理後的卦、爻及經文段落資料。
- `interpretations/` 保存本站導讀與各具名解讀 Profile。
- `reviews/` 保存逐段檢查與發布審核紀錄。
- `releases/` 保存由同一份 canonical build 產生的版本資料、manifest 與 attribution。

## 2. 閱讀順序

1. 本檔
2. `../docs/CORPUS_DATA_PIPELINE.md`
3. 依任務進入相關子目錄 `index.md`

## 3. 子目錄 Registry

- `sources/index.md`
- `tools/index.md`
- `raw/index.md`
- `staging/index.md`
- `canonical/index.md`
- `interpretations/index.md`
- `reviews/index.md`
- `releases/index.md`

## 4. 資料保護規則

- `raw/` 內容是來源快照，只能新增新的 revision 快照，不覆寫既有快照。
- 整理與正規化寫入 `staging/` 或 `canonical/`，不可回頭修改 `raw/`。
- 所有段落使用穩定 `passageId`，來源 revision 與 checksum 必須可追溯。
- 未完成來源、署名及版本資訊的資料不得進入 `releases/`。
- 發布目錄按 corpus version 建立，不原地替換已發布版本。
- 不在此存放 Secret、登入憑證或無必要的第三方大型掃描影像。

## 5. 目前狀態

- 已保存維基文庫入口 `oldid=7907208` 所列 73 個子頁的固定 revision 原始快照：64 卦頁與 9 個傳文篇目。
- 每頁快照均保存 revision、固定 URL、原始 wikitext、SHA-256 checksum；73 筆 checksum 已逐一核對。
- 已完成 64 卦 staging 解析，共 1005 個候選段落；64 個卦序完整且唯一，各卦均含卦辭、六爻、彖傳與大象候選。每筆保留來源片段及 revision/checksum，尚待人工校勘。
- 小象未標示爻位時依來源順序暫定映射；乾文言保留四個來源群組。初審與待確認事項見 `reviews/2026-11-16-qian-kun-staging-review.md` 及 `reviews/2026-11-16-hexagram-staging-batch.md`。
- 尚未改寫正文，canonical 經文與解讀資料仍未建立。
