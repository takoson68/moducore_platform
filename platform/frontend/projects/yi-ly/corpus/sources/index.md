# Sources

保存 corpus 外部來源登記與權利、版本、署名資訊。

每個來源記錄應包含穩定來源 ID、標題、來源平台、頁面清單、revision 定位、固定網址、擷取時間、checksum、授權與 attribution。MVP 主來源為中文維基文庫《周易》，入口 revision `7907208`，逐頁清單見 `../raw/wikisource-zhouyi/manifest.json`。

《焦氏易林》獨立於《周易》語料，採單一文字版本，不混用不同來源。已選易學網《焦氏易林［四庫全書版］》（https://www.eee-learning.com/book/giauii），依據版本為《欽定四庫全書》子部術數類；來源列出 64 卦入口，網站聲明古籍原文屬公共領域，非商業合理轉載與引用需完整標註出處及原網頁連結。僅收本卦／之卦配對下的林辭原文，不收序跋、注文、校語、翻譯或後人解讀。每筆資料保留版本、固定篇章連結、署名與來源連結，以及本專案收錄和文字整理聲明。

已完成全頁文字擷取：64 個本卦頁、4096 條非空林辭、4096 個唯一配對，缺漏為零，並已匯入本機 D1。第 56 卦篇第 49 條來源圖示指向第 4 卦；資料庫保留圖示與解析配對 metadata，不人工改字。來源網頁可能有待校對標記，但本專案不安排人工校勘；資料品質狀態由來源快照與 checksum 呈現。易林第一版先採線上閱讀，不要求納入離線資料包；不下載或辨識掃描圖片，不混入其他版本。使用時完整標註書名、版本、易學網來源連結及本專案整理／修改聲明。`/article/2162` 是有缺頁注本，排除。完整來源狀態見 `jiaoshi-yilin-candidates.json` 及 `../reviews/2026-11-17-jiaoshi-yilin-complete-capture.md`。

來源 Registry 是原始快照與發布資料之間的對照依據；此處不放匯入後經文正文。9 個傳文入口頁中有 5 項轉址至 `易傳/序卦`、`易傳/說卦`、`易傳/雜卦`、`易傳/繫辭上`、`易傳/繫辭下`；入口與目標的 revision/checksum 分別登記於 `../raw/wikisource-zhouyi/manifest.json` 與 `../raw/wikisource-yizhuan-targets/manifest.json`。
