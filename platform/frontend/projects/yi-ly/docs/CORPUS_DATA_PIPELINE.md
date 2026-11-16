---
status: planned
updated: 2026-11-16
authority: project-data-plan
implemented: false
---

# 易經經文資料整理與發布管線

## 1. 目標

將古籍原文、異文、本站簡明導讀及具來源解讀，整理成可校勘、可重建、可查詢及可離線下載的版本化資源。

核心原則：

- 不直接把網頁內容貼進正式資料庫。
- 原始來源、編輯中間檔與正式發布資料分層。
- 每段正式內容都能回到來源、固定 revision／commit／掃描頁及授權紀錄。
- 選定一個主要底本；其他來源作異文或校對見證，不暗中拼成無來源的合成文本。
- D1 是已發布資料的查詢投影，不是唯一校書工作區。
- 每個 corpus release 都能由受版控的內容檔與轉換程式重新產生。

## 2. 建議資料流

```text
固定來源／公有領域掃描
  → raw 原始快照與權利紀錄
  → extract 文字抽取
  → segment 卦、卦辭、爻辭、傳文切段
  → normalize 顯示正規化但保留原字串
  → collate 多來源逐段比對與異文紀錄
  → annotate 本站導讀／具名解讀
  → review 人工審校與授權 Gate
  → build 產生 canonical JSON
  → publish D1 查詢資料 + immutable offline package + manifest
```

## 3. 來源策略

### 3.1 候選來源的用途

| 來源 | 建議用途 | 發布前條件 |
|---|---|---|
| 公有領域古籍掃描 | 主要影像見證或自行轉錄底本 | 保存館藏資訊、版次、卷頁與影像定位；確認掃描檔本身的使用條款 |
| 維基文庫固定 revision | 可機讀轉錄候選 | 保存 revision URL、擷取日期與 attribution；衍生內容按適用的 CC BY-SA 條件處理 |
| Kanripo `KR1a0001` 固定 commit | 分段及異文比對候選 | Repository 頁未見明確 LICENSE 前，不直接打包發布其轉錄文字 |
| 中國哲學書電子化計劃 | 人工交叉核對候選 | 未取得可重製依據前，不批次抓取或包入產品資料 |
| 現代出版翻譯／註解 | 不作預設來源 | 取得明確授權後，才建立獨立 InterpretationProfile |
| 本站自行撰寫導讀 | 正式簡明解釋 | 保存作者／編者、版本、逐段依據及人工審校紀錄 |

### 3.2 權利 Gate

每個來源建立一筆權利紀錄，至少包含：

- `licenseCode` 與完整條款 URL。
- 著作、轉錄、標點、編排、翻譯、註解及掃描影像分別可否使用。
- attribution 文字與來源連結。
- 是否要求相同方式分享衍生內容。
- 可否重製、修改、商用與離線散布。
- 內部核准人、核准時間與證據快照 checksum。
- 使用者介面所需的短版與完整 attribution 文字。

古籍原文本身進入公眾領域，不代表現代標點、校勘、翻譯、版面或資料庫轉錄必然可以自由複製。來源授權不明時狀態必須是 `comparison_only`，不能進入 release。

### 3.3 建議採用路線

本實驗專案的 MVP 決定採最快路線：以中文維基文庫《周易》作主要機讀來源。入口頁先固定為 `oldid=7907208`：

`https://zh.wikisource.org/w/index.php?title=周易&oldid=7907208`

入口頁所連結的 64 卦及相關子頁仍各自有 revision；匯入時需透過 MediaWiki API 建立 snapshot manifest，逐頁保存 `title`、`pageId`、`revisionId`、固定 URL、擷取時間與內容 checksum。只固定入口頁不足以凍結完整 corpus。

MVP 不先進行完整掃描本自行轉錄；Kanripo 與 CText 只在發現結構或文字疑點時人工比對。Corpus 保留維基文庫 attribution、修改聲明及適用的 ShareAlike 條件，並把內容授權與應用程式程式碼分開記錄。

非營利、實驗性及低流量可降低實務風險與作業規模，但不會自動取消來源授權條件；本案採自動產生 attribution 與 source manifest 的方式，把合規成本降到最低。

## 4. Authoring 檔案結構

正式實作時建議在 `yi-ly` Project 內建立獨立 corpus 工作區；實際位置需在工程階段依 Project Scaffold 與 Module Contract 再確認。

```text
corpus/
  sources/
    source-registry.json
    rights-evidence/
  raw/
    {sourceId}/
      manifest.json
      original/*
  staging/
    {sourceId}.jsonl
  canonical/
    hexagrams.json
    passages.jsonl
    variants.jsonl
  interpretations/
    site-plain-zh-hant.jsonl
    {profileId}.jsonl
  reviews/
    review-events.jsonl
  releases/
    {corpusVersion}/
      manifest.json
      corpus.json
      corpus.json.gz
      attribution.txt
```

規則：

- `raw/` 只新增固定快照，不人工改寫。
- `staging/` 是解析結果，可由 script 重建。
- `canonical/` 與 `interpretations/` 是內容編輯與 code review 的主要介面。
- `releases/` 是產物，不直接修改。
- 原始掃描若體積或授權不適合進 Git，只保存受控位置、固定識別碼與 checksum，不任意複製入 Repository。

## 5. 穩定識別碼與切段

每段內容使用不依賴資料庫自增值的穩定 ID：

```text
zhouyi.kingwen.01.judgment
zhouyi.kingwen.01.line.1
zhouyi.kingwen.01.line.6
zhouyi.kingwen.01.use-nine
zhouyi.kingwen.02.use-six
zhouyi.kingwen.01.tuan
zhouyi.kingwen.01.xiang.great
zhouyi.kingwen.01.xiang.line.1
```

- `01` 是文王卦序，不因顯示名稱改變。
- 爻位固定為 `1` 至 `6`，`1` 代表初爻，資料維持 bottom-up。
- 卦辭、爻辭、用九／用六、《彖》《象》等 passage kind 分開，不塞在同一富文字欄位。
- 繁簡、異體、標點及段落調整不可改變 passage ID。

## 6. Canonical 內容格式

單一 passage 建議格式：

```json
{
  "passageId": "zhouyi.kingwen.01.line.1",
  "hexagramNumber": 1,
  "kind": "line_statement",
  "linePosition": 1,
  "textVerbatim": "初九：潛龍勿用。",
  "textDisplay": "初九：潛龍勿用。",
  "baseWitnessId": "source-edition-a",
  "sourceLocator": "卷一／乾卦／初九",
  "variantIds": ["variant-0001"],
  "reviewStatus": "reviewed",
  "contentChecksum": "sha256:..."
}
```

- `textVerbatim` 保存選定底本原貌。
- `textDisplay` 只做核准的 Unicode、標點或顯示正規化。
- 不以簡繁自動轉換覆蓋原文；若需要轉換，另存 transformation 與人工校對狀態。
- 異文記為 witness 差異，不直接抹除。

## 7. 發布資料模型

### 7.1 D1 建議表

| Table | 用途 |
|---|---|
| `yijing_corpus_release` | corpus 版本、schema、checksum、發布時間與狀態 |
| `yijing_source_edition` | 底本、revision、rights、attribution 與 checksum |
| `yijing_hexagram` | 64 卦、卦序、卦名、上下卦與 bottom-up pattern |
| `yijing_passage` | passage ID、卦、類型、爻位與排序 |
| `yijing_passage_text` | 指定 release 的原文、顯示文字與 review status |
| `yijing_passage_witness` | 每段與各來源的文字、定位及異文關係 |
| `yijing_interpretation_profile` | 解讀流派／本站導讀的版本、作者、權利與完整度 |
| `yijing_interpretation_entry` | profile 對 passage 的逐段解讀 |
| `yijing_review_event` | 編輯、審校、權利核准與狀態變更證據 |

主要關係：

```text
yijing_corpus_release
  ├─ yijing_passage_text ── yijing_passage ── yijing_hexagram
  │                            └─ yijing_passage_witness ── yijing_source_edition
  └─ yijing_interpretation_entry ── yijing_interpretation_profile

yijing_review_event → source / passage / interpretation / release
```

`passage_id` 與 `profile_id` 使用穩定文字 ID；D1 內部可另有數值索引，但不得把自增 ID 暴露為離線資料的唯一識別碼。

### 7.2 不建議的做法

- 不將 64 卦全部塞進一筆 JSON blob 後只靠前端解析。
- 不只存「最終文字」而丟掉來源定位及原始版本。
- 不用卦名作 Primary Key。
- 不把原文、白話、流派解讀及 AI 文字放在同一欄。
- 不讓管理介面直接修改 production D1 且無法產生可 review 的內容差異。

## 8. D1、API 與離線 package 分工

- D1：線上依卦、passage、版本或解讀 profile 查詢；保存發布後的結構化投影。
- API：只讀取 `published` release，回傳來源與版本，不在 Query 時臨時改寫內容。
- Offline package：由同一 canonical build 產生完整 JSON／壓縮檔，供使用者同意後下載。
- Manifest：公布 `corpusVersion`、`schemaVersion`、大小、checksum、來源摘要、授權及下載 URL。
- Attribution：由 source registry、實際使用 passages 與 InterpretationProfile 自動組裝；頁面、離線包、分享及匯出使用同一產生器。

不需要為離線版另維護第二套文字；D1 seed 與 package 必須由同一份 build output 產生。

## 9. 編輯與審校狀態

```text
imported → segmented → collated → drafted → reviewed → rights_approved → published
```

- `imported`：已保存來源快照。
- `segmented`：已切成穩定 passage。
- `collated`：已和至少一個見證來源比對，或明確標示尚未比對。
- `drafted`：本站導讀或解讀已有草稿。
- `reviewed`：文字與段落映射已人工審校。
- `rights_approved`：來源、授權與 attribution 已核准。
- `published`：已進入不可變 corpus release。

任何一段未達 release 所要求的狀態，都不能被包成「完整正式解讀」。允許發布部分涵蓋的 profile，但 UI 必須顯示覆蓋率與缺漏，不能假裝完整。

## 10. 自動驗證 Gate

MVP release 至少驗證：

- 恰有 64 個唯一卦序與 64 個唯一六爻 pattern。
- 每卦恰有六個爻位，總計 384 則爻辭。
- 乾用九、坤用六各一，位置及卦別正確。
- 64 卦各有《彖傳》與《大象》；每個爻辭及用九／用六均能對應自己的《小象》。
- 《文言》只掛在乾、坤並保持內部分段，不錯配到其他卦。
- 每個正式 passage 都有 base witness、source locator、rights status 及 checksum。
- 每個可發布來源都有固定版本連結、授權連結、短版／完整署名及修改聲明。
- 每個 InterpretationProfile 宣告預期涵蓋數、實際涵蓋數與缺漏清單。
- 所有外鍵、stable ID、bottom-up 順序與 Unicode encoding 合法。
- D1 seed、API fixture 與 offline package 的 corpus checksum 一致。
- 線上、離線與分享輸出的 attribution snapshot 一致。
- 同一 `corpusVersion` 的產物不可在發布後被替換。

《彖傳》《象傳》《文言》以各自 passage kind 與預期覆蓋規則驗證，不把它們混入 64 卦辭或 384 爻辭計數。

預計提供可重現的內容命令，但名稱需在工程階段依 Repository scripts 慣例確認：

```text
corpus:extract   原始快照轉 staging
corpus:diff      逐段比較見證來源
corpus:validate  執行結構、權利與完整度 Gate
corpus:build     產生 D1 seed、API fixture、package 與 manifest
corpus:release   只發布已核准且 checksum 固定的版本
```

## 11. 第一批實作順序

1. 以維基文庫《周易》入口 `oldid=7907208` 建立 source registry。
2. 透過 MediaWiki API 列出 64 卦與相關子頁的固定 revision，建立 snapshot manifest。
3. 先完成乾、坤兩卦的端到端樣本。
4. 驗證 stable ID、來源定位、簡明導讀、D1 seed、API 與離線 package。
5. 樣本審校通過後再批次擴到 64 卦，避免先大量匯入後返工。
6. 發現文字疑點時以 Kanripo／CText 人工比對並留下 review note，不直接替換主來源文字。
7. 64 卦原文發布完成後，再逐一加入不同 InterpretationProfile。

## 12. 來源與法律參考

- Wikimedia 使用條款：https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use
- CC BY-SA 4.0 條款：https://creativecommons.org/licenses/by-sa/4.0/legalcode
- Kanripo《周易》Repository：https://github.com/kanripo/KR1a0001
- 中國哲學書電子化計劃 FAQ：https://ctext.org/faq
- 全國法規資料庫《著作權法》：https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=J0070017

本文件只定義產品與工程 Gate，不取代正式法律意見。來源條款在實際匯入當日仍需重新核對並保存證據。
