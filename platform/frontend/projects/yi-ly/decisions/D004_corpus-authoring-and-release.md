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

- MVP 主要機讀來源採中文維基文庫《周易》，入口固定為 `oldid=7907208`。
- 64 卦及相關子頁各自保存 revision ID 與 checksum，不能只保存入口頁目前 URL。
- MVP 接受維基文庫內容適用的 attribution、修改聲明及 ShareAlike 條件；由 manifest 與 attribution 產物自動處理。
- Kanripo 與 CText 暫作人工比對來源，不包入正式 corpus。
- 後續增加《焦氏易林》為獨立語料；維基文庫索引 revision `447583` 雖列 64 卦篇但僅 4 篇有正文，不納入本專案文字處理。
- 依使用者最新方向，《焦氏易林》採獨立語料，只收本卦／之卦對應的原始林辭，不收序跋、注文、校語、翻譯或後人解讀；與《周易》分開建置、標示和發布。原評估的易學網《陸敕先校宋本》（`https://www.eee-learning.com/book/giau`）有明示缺文並以四庫本代文，因此排除。改選易學網《焦氏易林［四庫全書版］》（`https://www.eee-learning.com/book/giauii`），依據《欽定四庫全書》子部術數類；已擷取 64 頁、4096 首及唯一配對。網站聲明古籍原文屬公有領域，並歡迎非商業合理轉載／引用，要求完整署名和原網頁連結；本專案依此明列出處、版本、連結及本站整理聲明。來源中一筆圖示卦序不一致已保留並標為待人工複核；全體文字仍待校勘。
- 易林來源只處理該書必要原文，不從單一網站蒐集其他作品，不下載或自行 OCR 掃描圖片。每筆記錄版本、固定頁面、來源連結、來源署名及本站整理／修改聲明。易林第一版先以線上閱讀為主，不要求納入離線資料包。
- 使用者提供易學網 `/article/2162` 為《易林註》注本，頁面明示缺兩頁；依原文限定政策排除該注本及其注文，不作《焦氏易林》底本。
- 先前下載的國家哲學社會科學文獻中心藏 1907 年掃描本在文字語料完整收錄後，依使用者指示刪除兩冊本機暫存 PDF；不作 OCR、校對或補字。
- 《焦氏易林》傳統題作漢焦延壽撰，但作者歸屬及文本傳承有目錄學討論；產品 metadata 分開保存傳統題署與所採轉錄版本，不將作者問題寫成已定論。
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

- 建立維基文庫頁面清單、revision snapshot 與 attribution 產物。
- 工程階段確認 corpus 工作區位置、D1 migration 與 Worker API Contract。
- 建立乾、坤兩卦的最小資料樣本與完整性測試。

## 後續決策

`D007_source-preserving-corpus-import.md` 已取代本決策中「人工校勘後才匯入」及「先乾坤樣本再擴充」的流程要求。現階段直接以來源快照和機器解析建置本機 D1，不進行人工編修；署名、權利與來源追溯要求仍有效。
