# D001_traceable-corpus-and-ai-boundary.md
## 經文可追溯與外部 AI 邊界

## Decision

- 決定經文、離線資料、本站導讀與外部 AI 之間的責任邊界。

## Status

- accepted

## Context

- 專案核心要求是本卦、動爻、之卦及可追溯經文。
- 使用者要求不混入星座、塔羅或任意生成式斷語。
- 經文先存在後端，使用者同意後才下載離線資料。
- 第一版只讓使用者複製結果給外部 AI。

## Options Considered

- 選項 A：經文、簡明解釋與 AI 文字合併成單一答案。
- 選項 B：經文、固定導讀與外部 AI 情境解讀分層，並保存每段來源。
- 選項 C：只提供 AI 結果，不展示完整經文。

## Chosen Direction

- 採用選項 B。
- 後端已發布 corpus 是經文與正式導讀的權威來源。
- 離線資料是使用者同意後取得的版本化快照。
- 原文、易傳、本站固定導讀及外部 AI 解讀必須分離。
- 第一版不串模型；AI 只透過使用者主動複製的 Context 接收資料。

## Impact

- passage 需保存 kind、source reference、corpus version 與 review status。
- 離線下載需包含 manifest、checksum 與來源／授權資料。
- 結果頁不能用單一富文字欄位混合所有內容。
- 外部 AI 不參與演算，也不寫回 corpus 或歷史。

## Follow-up

- 選定正式底本與授權策略。
- 定義內容審校流程。
- 建立 Corpus schema、離線驗證及 AI Context 契約。
