# Raw Source Snapshots

保存經核准來源的原始文字快照及逐頁來源定位。維基文庫頁面以 revision 固定；易學網頁面沒有 revision ID，改保存擷取時間與頁面／段落 checksum。不新增或下載掃描圖片。

- 下載內容以來源回傳格式原樣保存，不人工修正或重新排版。
- 每個快照以來源 ID 與 corpus 擷取批次分層，manifest 記錄頁面 revision ID、固定 URL、時間及 checksum。
- 新版本新增快照，不覆蓋舊版本。
- 目前快照位於 `wikisource-zhouyi/`，由固定入口 revision `7907208` 擷取，共 73 個子頁。
- `wikisource-zhouyi/manifest.json` 登錄 64 卦頁與 9 個傳文頁；每個頁面 JSON 內含原始 wikitext 與 SHA-256。
- 重新執行匯入器時，若頁面 revision 與 checksum 相同則保留現有 manifest；若來源已變更則停止，不覆寫舊快照。
- 《焦氏易林》採易學網《四庫全書版》單一底本。64 個頁面快照位於 `eee-learning-jiaoshi-yilin-siku-v2/`；共 4096 條林辭與唯一配對，每筆保留來源段落 checksum、來源頁 checksum、固定 URL 與圖示標記。只收林辭正文，不保存圖檔或 PDF，也不做 OCR。
- 原始 73 頁中的 5 個傳文入口是轉址；其目標正文另存於 `wikisource-yizhuan-targets/`，維持獨立 manifest 與 immutable snapshots，不回寫原 manifest。
