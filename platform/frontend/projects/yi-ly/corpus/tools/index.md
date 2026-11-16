# Corpus Tools

保存可重跑的來源抓取、整理與驗證工具。工具只讀取明確固定的來源入口，輸出不可變的原始快照和 manifest；不在抓取階段改寫經文或產生解讀。

目前工具：

- `fetch-wikisource.mjs`：從固定《周易》目錄 revision 取得全部子頁，保存逐頁 revision 與原始 wikitext。
- `stage-hexagrams.mjs`：從 manifest 所列 64 卦原始快照抽取經、彖、象、文言候選段落；保留原始 wikitext、乾文言來源群組及待人工審查狀態。

執行方式：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/fetch-wikisource.mjs
```

執行後的資料寫入 `../raw/`，工具本身不得覆寫既有 revision 快照。若來源頁 revision 相同且 checksum 相同，可重用已存在檔案；若 revision 相同但 checksum 不同，應停止並回報。

產生 64 卦 staging：

```sh
node platform/frontend/projects/yi-ly/corpus/tools/stage-hexagrams.mjs
```

輸出為 `../staging/wikisource-zhouyi-hexagrams.json`。候選段落仍待人工校勘；既有輸出不同時會停止，需先檢視差異再更新 parser 版本與資料。
