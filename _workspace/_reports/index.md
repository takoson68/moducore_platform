# Workspace Reports 索引

## 範圍

`_workspace/_reports/` 保存一次性研究、稽核、執行規格與歷史驗收證據。這些報告不取代 `_VibeCore/` 正式規範，也不自動代表目前程式或線上狀態。

## 閱讀路由

### 主題目錄

- Worker／D1 移植歷史：先讀 [`2026-10-15_moducore_cloudflare_node_d1/index.md`](./2026-10-15_moducore_cloudflare_node_d1/index.md)。
- Tag 發布／版本控制台里程碑：先讀 [`2026-10-21_tag_release_version_console/index.md`](./2026-10-21_tag_release_version_console/index.md)。
- chatCore P2P 聊天室實驗：Project 已建立；現行里程碑與結果先讀 [`chatCore/docs/index.md`](../../platform/frontend/projects/chatCore/docs/index.md)。歷史規劃存檔仍可由 [`2026-10-29_chatcore_p2p_plan/index.md`](./2026-10-29_chatcore_p2p_plan/index.md) 導讀。

### 單一報告

- [`ModuCore_架構研究報告.md`](./ModuCore_架構研究報告.md)：Repository 架構的研究快照；需以當前原始碼核對。
- [`2026-10-15_AI工作機制比對與升級報告.md`](./2026-10-15_AI工作機制比對與升級報告.md)：AI 導讀與工作機制形成背景，不取代現行 `AGENTS.md`／`_ai-context/`。
- [WorldJS World-first 健檢（2026-02-24）](./2026-02-24_worldjs_WorldFirst健檢報告.md)、[VibeCore 健檢（2026-03-02）](./2026-03-02_VibeCore健檢報告.md)：依任務按需讀取，皆為報告當時觀察。
- [SSR 健檢建議](./SSR健檢建議報告.md)、[SSR Ready Checklist](./SSR_READY_CHECKLIST.md)、[SSR Platform Audit（2026-02-24）](./SSR_PLATFORM_AUDIT_2026-02-24.md)：僅在 SSR／渲染任務引用；不是目前已完成能力的證明。

## 閱讀與權限

- 進入任何主題子目錄前先讀該目錄 `index.md`；不要全量讀取所有歷史報告。
- 報告提到的「下一步」「尚未實作」必須與更新的 `CURRENT_WORK.md`、Git、程式碼及測試交叉核對。
- SQL 備份、fixture、inventory 或 script 是研究材料；未確認用途與影響前不得執行或覆寫。
- 正式規則依 `_VibeCore/RootIndex.md` 與各層 index；此處不授權 Git、部署、Migration 或資料操作。
