# Staging Corpus Data

保存匯入器從 `raw/` 解析出的暫存資料。此處資料可由固定來源快照重新產生，不作為正式發布內容。

解析錯誤、未識別段落與待人工確認文字均保留狀態，不可默認丟棄。修正解析規則後，重新產生 staging 資料並保留來源快照不變。

目前的 `wikisource-zhouyi-hexagrams.json` 是 parser v2 的 64 卦 staging：每筆保留來源 revision、checksum、原始 wikitext 片段與候選分類，所有內容標記為 `needs-human-review`。`{{另|甲|乙}}` 以 `甲一作「乙」` 呈現，不覆寫來源原文。乾、坤初審見 `../reviews/2026-11-16-qian-kun-staging-review.md`；批次與 parser 後續註記見 `../reviews/2026-11-16-hexagram-staging-batch.md`。小象爻位依原文排列順序推定，文言段落仍需人工核對，不能直接寫入 canonical。

`wikisource-zhouyi-commentaries.json` 是 9 個傳文項目的 parser v4 staging，共 795 段候選資料。轉址別名與目標頁 revision 均保留；《大象》《小象》《彖》《文言》只建立來源見證關係，不做文字合併。`{{另}}` 會展開為主讀字及「一作」異文；《小象》四筆明示爻位的來源標記獨立存於 `sourceLineLabel`，不混進 `textDisplay`。原始 wikitext 不變。覆蓋與待確認事項見 `../reviews/2026-11-17-commentary-staging-review.md` 和 `../reviews/2026-11-17-parallel-witness-comparison.md`。所有記錄仍標記 `needs-human-review`。

`eee-learning-jiaoshi-yilin-siku-v2.json` 是易學網《四庫全書版》林辭 staging，共 4096 條、4096 個唯一配對。只有本卦 56、之卦 49 的來源小圖示錯標為 4；配對按頁內文字序號與卦名解析，原圖示編號另外保留。所有林辭仍標記 `needs-human-review`，不可視為已校勘或已發布。
