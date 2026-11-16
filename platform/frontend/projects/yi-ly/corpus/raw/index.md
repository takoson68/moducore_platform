# Raw Source Snapshots

保存來源頁面的原始內容快照及逐頁 revision manifest。

- 下載內容以來源回傳格式原樣保存，不人工修正或重新排版。
- 每個快照以來源 ID 與 corpus 擷取批次分層，manifest 記錄頁面 revision ID、固定 URL、時間及 checksum。
- 新版本新增快照，不覆蓋舊版本。
- 目前快照位於 `wikisource-zhouyi/`，由固定入口 revision `7907208` 擷取，共 73 個子頁。
- `wikisource-zhouyi/manifest.json` 登錄 64 卦頁與 9 個傳文頁；每個頁面 JSON 內含原始 wikitext 與 SHA-256。
- 重新執行匯入器時，若頁面 revision 與 checksum 相同則保留現有 manifest；若來源已變更則停止，不覆寫舊快照。
