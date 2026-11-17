# yi-ly Corpus Workspace

## 0. 目錄角色

本目錄是 `yi-ly` 易經來源快照與機器解析工作區，保存不可變來源、解析資料、來源定位與可重建本機資料庫 seed。

本目錄只屬於 `yi-ly` Project，不是平台共用資料區，也不是 production D1 的直接編輯介面。

## 1. 資料流程

```text
sources/ → raw/ → staging/ → machine seed → local D1
```

- `sources/` 登記來源、固定頁面與授權／署名資料。
- `tools/` 保存可重跑的來源清單與快照匯入工具。
- `raw/` 保存未修改的維基文庫固定 revision 原始快照。
- `staging/` 保存可由匯入程式重建的解析結果。
- `canonical/`、`interpretations/`、`reviews/` 與 `releases/` 目前保留作後續用途；經文資料流程不做人工校字。
- D1 migration 位於 `platform/worker/migrations/yi-ly/`；本機設定為 `platform/worker/wrangler.yi-ly-local.jsonc`。

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
- 已完成 64 卦 staging 解析，共 1005 段；每筆保留來源片段及 revision/checksum。卦畫由來源爻標籤機器推導。
- 已解析 9 個傳文項目為獨立 staging，共 795 段候選資料；其中《大象》《小象》《彖》《文言》作為卦頁的平行來源見證保留，不合併正文。《序卦》《說卦》《雜卦》《繫辭上》《繫辭下》保留為獨立傳文；5 個入口頁是轉址，另保存其目標頁 revision。解析狀況及待確認項目見 `reviews/2026-11-17-commentary-staging-review.md`。
- 已初步比對四個平行來源與卦頁文字，差異清單見 `reviews/2026-11-17-parallel-witness-comparison.md`；繁簡、段落與校詁版本尚未正規化，結果不能視為校勘定論。
- 小象未標示爻位時依來源順序暫定映射；乾文言保留四個來源群組。初審與待確認事項見 `reviews/2026-11-16-qian-kun-staging-review.md` 及 `reviews/2026-11-16-hexagram-staging-batch.md`。
- 不改寫正文；解析器輸出的顯示文字與來源 wikitext 在資料庫分欄保存。
- 語料規模草案採基礎語料、卦級分類、版本化規則、執行期組合四層；分類與執行期不為 4096 個易林配對逐一複製解釋。第一版仍只複製內容交外部 AI，未實作或承諾站內 LLM。詳見 `../docs/CORPUS_DATA_PIPELINE.md` §7.3。
- 《焦氏易林》獨立收錄易學網《四庫全書版》，只保存本卦／之卦林辭原文。資料庫已收 4096 首、4096 個唯一配對；第 56 卦篇第 49 條來源圖示誤標資訊保存在 metadata，沒有人工修改正文。使用時須標示書名、版本、來源連結及本站整理／修改聲明；易林第一版不納入離線包。全文收錄資料見 `reviews/2026-11-17-jiaoshi-yilin-complete-capture.md`。
- 2026-11-17 納入後續選配規劃：《焦氏易林》獨立語料及朱熹《易學啟蒙・考變占》選讀 profile。考變占二變、四變規則保留推例來源限定。詳見 `../docs/DIVINATION_METHOD_TAXONOMY.md`、`../docs/CORPUS_DATA_PIPELINE.md` 與 `sources/index.md`。
