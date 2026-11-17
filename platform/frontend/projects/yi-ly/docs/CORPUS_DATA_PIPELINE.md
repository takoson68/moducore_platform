---
status: planned
updated: 2026-11-16
authority: project-data-plan
implemented: false
---

# 易經經文資料整理與發布管線

## 1. 目標

將來源快照以機器解析方式匯入可追溯、可查詢的本機資料庫；原典不經人工校字或改寫。

核心原則：

- 不直接把網頁內容貼進正式資料庫。
- 原始來源、機器解析結果與資料庫分層。
- 每段正式內容都能回到來源、固定 revision／commit／掃描頁及授權紀錄。
- 選定一個主要底本；其他來源作異文或校對見證，不暗中拼成無來源的合成文本。
- 本機 D1 保存來源衍生資料，不代表人工校勘完成或正式發布。
- 本機資料庫可由固定來源快照、staging 與 seed builder 重建。
- 本決策取代本文件其他段落中人工校勘作為入庫 Gate 的描述；機器解析疑點保留為 metadata，不人工裁定。

## 2. 建議資料流

```text
固定來源／公有領域掃描
  → raw 原始快照與權利紀錄
  → extract 文字抽取
  → segment 卦、卦辭、爻辭、傳文切段
  → machine parse（原始文字與顯示文字分欄保存）
  → build deterministic SQL seed
  → local D1（來源版本、定位、parser 狀態與 checksum）
```

## 3. 來源策略

### 3.1 候選來源的用途

| 來源 | 建議用途 | 發布前條件 |
|---|---|---|
| 公有領域古籍掃描 | 主要影像見證或自行轉錄底本 | 保存館藏資訊、版次、卷頁與影像定位；確認掃描檔本身的使用條款 |
| 維基文庫固定 revision | 可機讀轉錄候選 | 保存 revision URL、擷取日期與 attribution；衍生內容按適用的 CC BY-SA 條件處理 |
| Kanripo `KR1a0001` 固定 commit | 分段及異文比對候選 | Repository 頁未見明確 LICENSE 前，不直接打包發布其轉錄文字 |
| 中國哲學書電子化計劃 | 人工交叉核對候選 | 未取得可重製依據前，不批次抓取或包入產品資料 |
| 易學網《焦氏易林［四庫全書版］》 | 已選易林文字底本 | 依據《欽定四庫全書》子部術數類；已擷取 64 頁、4096 首及唯一配對；來源圖示一筆錯標保留供人工複核；全體尚待校勘；完整署名、版本、原網頁連結及本站修改聲明；首版先不納入離線包 |
| 易學網《焦氏易林［陸敕先校宋本］》 | 排除的文字版本 | 頁面明示缺文並以四庫本替代；不與其他版本拼接 |
| 國家哲學社會科學文獻中心藏 1907 年《焦氏易林十六卷》掃描 | 已刪除的影像候選 | 文字語料擷取後刪除暫存 PDF；不作 OCR、轉錄、校對或補字 |
| 維基文庫／Kanripo／CText／易學網其他易林版本 | 替代候選／來源研究 | 不與已選版本拼接；若替代，重新固定底本、核定權利及 attribution |
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

資料工作區固定位於 `platform/frontend/projects/yi-ly/corpus/`，由 `corpus/index.md` 導讀。其下每個具語意的子目錄各有自己的 `index.md`；來源快照與機器解析產物以資料檔形式放在對應目錄。

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

### 5.1 《焦氏易林》條目

《焦氏易林》獨立於 `zhouyi` 經文作品，以本卦序及之卦序定位林辭；覆蓋目標為 64×64＝4096 條。穩定 ID 可採 `jiaoshi-yilin.from.01.to.01`。每筆只保存本卦、之卦、林辭原文、來源篇章定位、文字 checksum、版本、來源署名及本站整理聲明。序跋、注文、校語、翻譯與後人解讀均不進入此語料；不同網站／版本不得拼接補缺。已選易學網《四庫全書版》，全量文字收錄結果為 4096 個非空唯一配對；一筆來源圖示錯標保留於 metadata，所有內容仍待人工校勘。依網站公有領域古籍原文與非商業署名聲明，逐條標示出處與本站修改聲明；易林第一版先不納入離線資料包。只擷取本作品文字，不下載掃描影像或 PDF、不自行 OCR。

作品題署及傳統作者說明寫作「傳統題作漢焦延壽撰」；來源版本和文本年代／作者考證分欄管理，不把傳統署名表述成已無爭議的定論。發布顯示書名、版本、來源連結、適用授權、本站收錄／標點／正規化修改聲明與語料版本；署名不代替權利核定。

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
| `yijing_hexagram_category` | 64 卦的主題傾向摘要；每筆可追溯依據、分類版本與審校狀態 |
| `yijing_reading_rule` | 具名且版本化的閱讀／選文規則，例如朱熹考變占 |
| `yijing_yilin_entry` | 焦氏易林本卦／之卦配對林辭、單一底本定位與 checksum；穩定 ID 對應最多 4096 組合 |

主要關係：

```text
yijing_corpus_release
  ├─ yijing_passage_text ── yijing_passage ── yijing_hexagram
  │                            └─ yijing_passage_witness ── yijing_source_edition
  └─ yijing_interpretation_entry ── yijing_interpretation_profile

yijing_review_event → source / passage / interpretation / release
yijing_yilin_entry → yijing_hexagram (from / to)
yijing_hexagram_category → yijing_hexagram
yijing_reading_rule → versioned rule definition
```

`passage_id` 與 `profile_id` 使用穩定文字 ID；D1 內部可另有數值索引，但不得把自增 ID 暴露為離線資料的唯一識別碼。

### 7.3 四層內容與執行資料

| 層 | 保存內容 | 人工工作量／責任 |
|---|---|---|
| 基礎語料 | 64 卦卦辭、核准納入的傳文、384 爻辭、用九／用六、最多 4096 條焦氏易林 | 逐段來源追溯、版本與異文管理；易林需 4096 組合完整度核對 |
| 卦級分類 | 64 卦 × 已核准主題分類的中性傾向摘要 | 附經文依據、分類 taxonomy 版本與人工審校；不得寫成保證結果 |
| 規則 | 考變占選讀、卦象計算等可重現邏輯 | 規則 ID、版本、來源、適用卜法、輸入／輸出定義、例外及依據；用神等只放在明確適用的流派／卜法 profile |
| 執行期組合 | 依問題分類、卦象、動爻及選定閱讀方式，挑選已發布原文與分類資料 | 記錄所引用 passage ID、rule version、分類版本及 prompt/template 版本；不回寫為古籍資料 |

概念性的執行輸入：

```json
{
  "questionCategoryId": "relationship",
  "divinationMethodId": "three-coin",
  "result": {
    "baseHexagramId": "zhouyi.kingwen.01",
    "movingLines": [1, 4],
    "changedHexagramId": "zhouyi.kingwen.28"
  },
  "readingProfileIds": ["zhu-xi-kao-bian-zhan", "jiaoshi-yilin"]
}
```

執行層只依規則選出原文與已審校分類摘要。第一版只產生可複製的外部 AI Context，不在本站呼叫 LLM；未來若加站內 LLM，需另行決策，並把問題、引用原文、分類摘要與生成內容分層標示，不可將模型輸出標為古籍或傳統流派原文。本節是 schema 草案，不表示 D1、Worker 或 LLM 已實作。

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
- 《焦氏易林》第一版先採線上呈現，不要求納入離線 package；其餘 corpus 的既有離線需求維持各自規格。
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
- 若發布《焦氏易林》完整資料，需有 4096 個唯一本卦／之卦 pair，64 個來源卦篇均完成映射檢視；不足時公開標示實際覆蓋率，不宣稱完整。
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

1. 已以維基文庫《周易》入口 `oldid=7907208` 建立完整來源快照。
2. 已透過 MediaWiki API 保存 64 卦與 9 個傳文頁 revision，建立 snapshot manifest。
3. 已完成 64 卦 staging 批次，抽取 1005 個候選段落並保留逐段原始 wikitext、頁面 revision/checksum 與暫定來源定位；結構初審見 `corpus/reviews/2026-11-16-hexagram-staging-batch.md`。
4. 專案方確認小象爻位順序映射、乾坤文言分段及顯示模板處理，再決定穩定 passage ID 與 canonical 建置規則。
5. 已將 9 個傳文入口解析為 795 段 staging 候選；5 個轉址入口的目標頁另存固定 revision。四個與卦頁重疊的傳文按平行來源見證保留，並已完成字串層級初步比對；尚未合併或定稿。檢查紀錄見 `../corpus/reviews/2026-11-17-commentary-staging-review.md` 與 `../corpus/reviews/2026-11-17-parallel-witness-comparison.md`。
6. 逐字校閱原文、模板異文與標點，疑點以 Kanripo／CText 人工比對並留下 review note，不直接替換主來源文字。
7. 建立穩定 passage ID、本站簡明導讀、D1 seed、API 與離線 package。
8. 64 卦原文發布完成後，再逐一加入不同 InterpretationProfile。

## 12. 來源與法律參考

- Wikimedia 使用條款：https://foundation.wikimedia.org/wiki/Policy:Terms_of_Use
- CC BY-SA 4.0 條款：https://creativecommons.org/licenses/by-sa/4.0/legalcode
- Kanripo《周易》Repository：https://github.com/kanripo/KR1a0001
- 中國哲學書電子化計劃 FAQ：https://ctext.org/faq
- 全國法規資料庫《著作權法》：https://law.moj.gov.tw/LawClass/LawAll.aspx?PCode=J0070017

本文件只定義產品與工程 Gate，不取代正式法律意見。來源條款在實際匯入當日仍需重新核對並保存證據。
