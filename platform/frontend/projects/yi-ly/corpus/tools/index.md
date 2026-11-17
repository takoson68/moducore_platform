# Corpus Tools

保存可重跑的來源抓取、整理與驗證工具。工具只讀取明確固定的來源入口，輸出不可變的原始快照和 manifest；不在抓取階段改寫經文或產生解讀。

目前工具：

- `fetch-wikisource.mjs`：從固定《周易》目錄 revision 取得全部子頁，保存逐頁 revision 與原始 wikitext。
- `stage-hexagrams.mjs`：從 manifest 所列 64 卦原始快照抽取經、彖、象、文言候選段落；保留原始 wikitext、乾文言來源群組及待人工審查狀態。`{{另|甲|乙}}` 的顯示文字展開為「甲一作『乙』」，raw wikitext 不變。
- `fetch-wikisource-commentary-targets.mjs`：為《序卦》《說卦》《雜卦》《繫辭上》《繫辭下》的轉址另存目標頁固定 revision 快照，不更動原 73 頁 manifest。
- `stage-commentaries.mjs`：將 9 個傳文入口與轉址目標解析為單獨候選段落，保留頁面 revision/checksum、來源 wikitext、轉址關係及未確認的名稱映射；同樣將 `{{另}}` 展開為主讀字與一作異文。
- `build-d1-seed.mjs`：從 staging、來源 manifest 與頁面 metadata 產生可重跑的本機 D1 seed SQL；保存原始 wikitext、機器顯示文字、來源版本與 parser metadata，不做人工校字。

執行方式：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/fetch-wikisource.mjs
```

執行後的資料寫入 `../raw/`，工具本身不得覆寫既有 revision 快照。若來源頁 revision 相同且 checksum 相同，可重用已存在檔案；若 revision 相同但 checksum 不同，應停止並回報。

《焦氏易林》來源與署名資料見 `../sources/jiaoshi-yilin-candidates.json`。`fetch-jiaoshi-yilin.mjs` 逐篇擷取易學網《四庫全書版》的 64 個本卦頁，只處理本書林辭文字，不抓取其他作品或圖檔；完成後驗證 4096 個唯一配對，保留來源 URL 及 checksum。資料保留 parser 狀態，但不經人工校勘。

建置本機 D1 seed（從 repository 根目錄執行）：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/build-d1-seed.mjs /tmp/yi-ly-corpus-seed.sql
cd platform/worker
npx wrangler d1 migrations apply DB --local --config wrangler.yi-ly-local.jsonc
npx wrangler d1 execute DB --local --config wrangler.yi-ly-local.jsonc --file /tmp/yi-ly-corpus-seed.sql
```

Seed 使用 `INSERT OR IGNORE`，不刪除既有資料。Schema 變更新增於 `platform/worker/migrations/yi-ly/`。狀態代表來源衍生、未經人工編修，不表示已人工校勘或遠端發布。

本機 UI 經文查詢需要同時啟動 `yi-ly` 專用 Worker；前端 Vite 會將 `/api` 代理到 `127.0.0.1:8787`。先啟動 Worker：

```sh
cd platform/worker
npx wrangler dev --config wrangler.yi-ly-local.jsonc --port 8787 --ip 127.0.0.1
```

再於另一個終端啟動前端：

```sh
cd platform/frontend
npm run dev -- --host 0.0.0.0
```

只啟動前端時，卦象可計算，但經文查詢會因 Worker 未在 `127.0.0.1:8787` 監聽而回傳錯誤。

```sh
node platform/frontend/projects/yi-ly/corpus/tools/fetch-jiaoshi-yilin.mjs
```

易林第一版不要求離線包；不得下載掃描圖片或 PDF，也不作 OCR。

產生 64 卦 staging：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/stage-hexagrams.mjs
```

輸出為 `../staging/wikisource-zhouyi-hexagrams.json`。Parser 狀態照原樣保留；匯入本機資料庫不要求人工校勘。

取得轉址目標快照並解析傳文：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/fetch-wikisource-commentary-targets.mjs
node platform/frontend/projects/yi-ly/corpus/tools/stage-commentaries.mjs
```

傳文輸出為 `../staging/wikisource-zhouyi-commentaries.json`。工具不覆寫既有 staging；解析規則改版時需先檢視 diff 並提高 parser/staging version。
