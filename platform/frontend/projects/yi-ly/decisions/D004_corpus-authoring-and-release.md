# D004_corpus-authoring-and-release.md
## 經文 Authoring、D1 與離線發布分工

## Decision

- 決定經文與解讀如何從外部來源整理成正式資料庫及離線資源。

## Status

- accepted for planning

## Context

- 產品需要來源可追溯、可人工審校及可離線下載的內容。
- 直接在正式 D1 編輯文字會失去可 review 差異、來源快照及可重建能力。
- 原文、異文、本站導讀與不同解讀 Profile 有不同權利及發布狀態。

## Chosen Direction

- 受版控 canonical 內容檔與轉換程式是 corpus authoring 的主來源。
- 原始來源以 immutable snapshot、固定 revision／commit／掃描定位及 checksum 保存。
- D1 是發布後的線上查詢投影，不作唯一編輯來源。
- D1 seed 與 offline package 由同一 corpus build 產生。
- 每個發布版本具 immutable manifest、schema version、content checksum、rights 與 attribution。
- 先以乾、坤建立端到端樣本，審校通過後才批次擴充。

## Impact

- 需建立 corpus source registry、stable passage ID、ETL／validation script 及 review workflow。
- Worker 只提供已發布 release 的 Query 與 package，不在請求時抓取第三方網站。
- 內容修改需經檔案 diff、驗證及 release 流程，不能直接改 production D1。

## Follow-up

- 選定主要底本、第二見證來源與授權策略。
- 工程階段確認 corpus 工作區位置、D1 migration 與 Worker API Contract。
- 建立乾、坤兩卦的最小資料樣本與完整性測試。
