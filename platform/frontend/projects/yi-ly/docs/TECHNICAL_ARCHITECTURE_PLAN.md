---
status: planned
updated: 2026-11-16
authority: project-technical-plan
implemented: false
---

# 易經解卦技術架構計畫

## 1. 文件定位

本文件描述 `yi-ly` 的預定技術方向，不代表功能已實作，也不授權修改平台共享 Runtime。若實作需要共享能力，必須回到平台索引與 Engineering Contract 重新裁決。

## 2. World 與責任邊界

- `yi-ly` 是單一 Project，對應唯一 `tenant_id=yi-ly`。
- 經文、起卦、閱讀框架、離線快照、本機歷史及 AI Context 均為本 Project 業務語意。
- 核心功能預期先收斂於單一可拔除 Business Module，不為畫面數量過早拆成互相依賴的 Module。
- Module 經合法 Registry、Store、Routes 與 Container 入口進入 World。
- Layout 只提供視覺殼層，不取得經文、不執行起卦、不裁決權限。
- 公開免登入，因此不建立第二份 auth state。

## 3. 權威資料與資料流

```text
公有領域底本／開放轉錄來源
  → 人工校勘與權利檢查
  → 後端權威 corpus
  → immutable corpus package + manifest
  → Worker Query API
  → 使用者同意後的 IndexedDB 離線快照
  → Module Store 的當次運行投影
```

- 後端 corpus 是經文與正式導讀的 Source of Truth。
- immutable package 是某個已發布版本的完整快照。
- IndexedDB 只保存版本化投影與選配本機歷史，不能回寫權威 corpus。
- 當次起卦狀態由 Module Store 持有。

## 4. Corpus 範圍與來源

### 4.1 MVP 原典層

- 64 卦卦名、卦畫、上下卦及文王卦序。
- 64 則卦辭、384 則爻辭、乾用九與坤用六。
- 《彖傳》《大象》《小象》是否在 MVP：待確認。

### 4.2 來源候選

- 維基文庫《周易》固定 revision。
- Kanripo `KR1a0001` 固定 commit。
- 公有領域古籍掃描本作為影像見證。
- 中國哲學書電子化計劃只作人工比對，未取得授權前不包入產品。

參考：

- https://zh.wikisource.org/zh-hant/%E6%98%93%E7%B6%93
- https://github.com/kanripo/KR1a0001
- https://ctext.org/faq
- https://zenodo.org/records/23298982
- https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=J0070017

### 4.3 權利分層

- 古籍原文：確認適用法域的公有領域狀態。
- 第三方轉錄與編排：保存 attribution、revision 與 license evidence。
- 本站簡明導讀：自行編寫與審校，單獨標示版本。
- 現代翻譯／註解：未取得明確授權不得複製。
- AI 草稿：只進待校區，不直接成為正式 corpus。

## 5. 邏輯資料結構

### 5.1 CorpusManifest

- `corpusVersion`、`schemaVersion`、`language`
- `size`、`checksum`、`publishedAt`、`downloadUrl`
- `sourceEdition`、`licenseSummary`

### 5.2 Hexagram／Passage

- `Hexagram`：文王卦序、名稱、`patternBottomUp[6]`、上下卦及 passage 關聯。
- `Passage`：類型、底本文字、顯示文字、直譯、本站導讀、異文、來源及審校狀態。

### 5.3 CastingSession／SavedReading

- `CastingSession`：問題、起卦方法、原始擲幣、六爻值、本卦、動爻、之卦及 corpus version。
- `SavedReading`：本機唯一 ID、預設名稱 `TAKO`、可編輯名稱、選定框架、Session 與時間。
- 未選擇保存時，Session 不進入歷史資料庫。

### 5.4 ReadingFramework

- `frameworkId`、名稱、欄位順序及說明。
- `sourceBasis`：標示傳統結構或本站編輯框架。
- `aiPromptTemplate`：只重排既有卦象內容，不增加占術資料。

## 6. Query API 計畫

- `GET /api/yijing/corpus/manifest`
- `GET /api/yijing/corpus/{version}/package`
- `GET /api/yijing/hexagrams/{number}`

規則：

- Query 只揭露已發布資料，不因查詢修改狀態。
- package 必須 immutable，相同版本不得換內容。
- manifest 與 package checksum 必須一致。
- 線上單卦 Query 與完整 package 使用相同 corpus version。
- 第一版沒有 AI API、會員 API 或歷史同步 API。

## 7. 離線架構

### 7.1 安裝

1. 啟動後取得 manifest。
2. 沒有 active offline corpus 時非阻斷詢問。
3. 使用者確認後下載 package。
4. 驗證 checksum、schema、64 卦與 passage invariants。
5. 寫入新的 version namespace。
6. 驗證完成後原子切換 active version。
7. 確認 app shell 可由 Service Worker 離線啟動。
8. 成功後才清理舊版。

### 7.2 更新與移除

- 重新連線只比較 manifest，發現新版後由使用者決定更新。
- 更新失敗維持舊 active version。
- 設定頁顯示版本與容量。
- 刪除只處理 `yi-ly` 自己的 corpus/cache namespace。
- 清除離線 corpus 與清除本機歷史必須分開。

## 8. 起卦與閱讀框架

- 6、8 為陰；7、9 為陽；6、9 為動爻。
- 六次結果 bottom-up 保存。
- 6 轉陽、9 轉陰；全部動爻同時反轉得到之卦。
- AI 與 ReadingFramework 都不參與卦象演算。
- 標準框架直接映射本卦／動爻／之卦。
- 其他框架只提供視角與欄位順序，必須附上本站編輯聲明。
- 若未來提供三次獨立起卦，資料模型需保存三個獨立 Session，不能偽裝成同一卦的三層。

固定測試：乾、坤、既濟、未濟；零至六個動爻；用九／用六；bottom-up；雙重反轉；所有框架不改變 Session 結果。

## 9. 前端責任草案

預期單一核心 Module 內分工：

- `store`：當次起卦、載入狀態、active corpus version 與本機偏好投影。
- `api`：manifest、package 與線上單卦 Query。
- `service`：package 驗證、卦象演算、框架投影與 AI Context 組裝。
- `repository`：IndexedDB corpus 與選配歷史存取。
- `pages`：起卦、結果、來源、離線設定與歷史。

實際目錄與 Module 名稱在實作前依 Module Contract 確認；不得把業務狀態提升到 Project service。

## 10. 外部 AI 邊界

- 前端決定性產生純文字／JSON Context。
- 使用者自行複製或分享，第一版不呼叫模型 API。
- Context 只含使用者選擇分享的問題、卦象、框架、經文及來源。
- 外部 AI 回應不寫回正式 corpus，也不自動匯入本機歷史。
- 每種框架可提供不同的問題模板，但不得增添未提供的占術資料。

## 11. 隱私與安全

- 問題文字可能含敏感資訊，預設只留在當次記憶體。
- 歷史預設不保存；使用者主動保存後提供單筆與全部清除。
- 離線資料同意、歷史保存及外部 AI 複製是三個獨立決定。
- package 只承載資料，不允許可執行程式或動態模板。
- manifest、package 與文件不得包含 Secret。

## 12. 錯誤狀態

需區分：尚未下載、下載中、驗證失敗、容量不足、後端不可用但有離線版、後端不可用且無資料、有新版未更新、歷史未保存及分享未完成。

傳輸失敗不得描述成卦象不存在；外部 AI 不可用也不能影響核心結果。

## 13. 階段計畫

### Phase 0：需求裁決

- 決定《彖傳》《象傳》範圍。
- 決定 B、C、D 閱讀框架是否進入 MVP。
- 確認 `TAKO` 的產品語意。

### Phase 1：Corpus 與授權

- 選定底本、比對來源與授權策略。
- 建立 schema 與完整性驗證。

### Phase 2：離線資料管線

- 建立 Worker Query、immutable package 與 IndexedDB 原子更新。

### Phase 3：核心起卦與結果

- 實作三錢／手動輸入、演算、手機優先結果與來源查閱。

### Phase 4：簡明導讀

- 逐條撰寫、審校並標記 review status。

### Phase 5：閱讀框架與外部 AI

- 實作已核准框架投影及純文字／JSON Context。

## 14. Gate

每階段核對：

- 是否維持單一 Project 與 Module 責任。
- 經文 Source of Truth 是否仍在後端權威 corpus。
- Store／IndexedDB 是否只保存投影或版本化快照。
- API Query／Command 是否沒有混用。
- 離線、歷史與分享是否由使用者控制。
- 閱讀框架是否未改變卦象演算或偽裝成古法。
- 是否新增未核准的占術、AI 或共享平台能力。

## 15. 未解風險

- 正式底本與 CC BY-SA／自行轉錄路線尚未裁決。
- 簡明導讀的審校人力與責任人尚未確認。
- Service Worker 與跨版本離線策略尚未實測。
- B、C、D 框架的傳統依據及文字界線仍需內容審校。
