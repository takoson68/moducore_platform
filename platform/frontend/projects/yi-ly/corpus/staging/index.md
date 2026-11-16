# Staging Corpus Data

保存匯入器從 `raw/` 解析出的暫存資料。此處資料可由固定來源快照重新產生，不作為正式發布內容。

解析錯誤、未識別段落與待人工確認文字均保留狀態，不可默認丟棄。修正解析規則後，重新產生 staging 資料並保留來源快照不變。

目前的 `wikisource-zhouyi-hexagrams.json` 是 64 卦的 staging 解析結果：每筆保留來源 revision、checksum、原始 wikitext 片段與候選分類，所有內容標記為 `needs-human-review`。乾、坤初審見 `../reviews/2026-11-16-qian-kun-staging-review.md`；全批次結構審查見 `../reviews/2026-11-16-hexagram-staging-batch.md`。小象爻位依原文排列順序推定，文言段落仍需人工核對，不能直接寫入 canonical。
