# Workspace Index

`_workspace/` 保存工作狀態、分析報告、需求草稿與人類參考資料，不具有覆蓋 `_VibeCore/` 正式治理文件的權限。

## AI 可主動讀取

1. 本檔「未完成事項」：先確認目前待辦、狀態及各項詳情連結。
2. `CURRENT_WORK.md`：只讀最上方最新停止點，恢復當前工作細節；不讀下方歷史停止點。
3. `_reports/`：只有任務明確相關時才讀取對應報告，並先讀 `_reports/index.md`。
4. `AI實作專案流程/`：需求訪談或規格書任務時，先讀該目錄 `index.md`。
5. `範本/`：先讀 `範本/index.md`，再依任務讀取人工操作手冊或範本。

## 未完成事項

此清單是工作區的快速狀態入口，只列仍需處理或決策的事項；每項提供詳情連結，不在此複製完整報告。開始工作時先讀本清單，之後只讀與選定事項直接相關的詳情文件。

- [ChatCore M4a：聊天室與會員管理](../platform/frontend/projects/chatCore/docs/P2P_CHAT_MILESTONES.md) — M4 Gate 已通過；先檢視 M4 結果，再由使用者決定是否開始 M4a。詳情：[M4 結果](../platform/frontend/projects/chatCore/docs/M4_RESULT.md)、[最新停止點](./CURRENT_WORK.md)。
- [ChatCore M1b：跨網路與 TURN 驗證](../platform/frontend/projects/chatCore/docs/M1B_RESULT.md) — 跨實體網路連線成功率與 TURN relay 成本尚待驗證；此項不阻擋已通過的 M4 Gate。詳情：[里程碑計畫](../platform/frontend/projects/chatCore/docs/P2P_CHAT_MILESTONES.md)。

## 預設不主動讀取

- `舊的存檔/`
- 個人隨手筆記
- 與當前任務無關的歷史報告
- 沒有被索引或當前工作引用的草稿

## 索引維護方式

- 新增未完成工作時，在本節新增一行摘要及詳情連結；不要把工作全文塞進索引。
- 工作完成、取消或不再追蹤時，從本清單移除；歷史證據保留在原文件。
- 每次更新工作狀態時同步更新本清單與 `CURRENT_WORK.md` 最上方停止點。
- 不因清單項目增加而全量載入文件；依使用者選定的事項逐項讀詳情。

## 分類原則

- 當前工作狀態：`CURRENT_WORK.md`
- 一次性研究與分析：先讀 [`_reports/index.md`](./_reports/index.md)，再依主題索引或報告狀態閱讀。
- Repository 架構研究快照：[`_reports/ModuCore_架構研究報告.md`](./_reports/ModuCore_架構研究報告.md)；參考資料，實際現況仍以程式／測試核對。
- 可重複使用的需求訪談方法：先讀 [`AI實作專案流程/index.md`](./AI實作專案流程/index.md)。
- 人工部署操作參考：先讀 [`範本/index.md`](./範本/index.md)，再進入自動部署步驟手冊。
- Tag 發布與版本控制台里程碑：先讀 [`_reports/2026-10-21_tag_release_version_console/index.md`](./_reports/2026-10-21_tag_release_version_console/index.md)。
- Platform Chat 效能／快取／DOM 承載里程碑：先讀 [`_reports/2026-10-27_platform_chat_scale_hardening/index.md`](./_reports/2026-10-27_platform_chat_scale_hardening/index.md)。
- Cloudflare／Worker 移植歷史規格：先讀 [`_reports/2026-10-15_moducore_cloudflare_node_d1/index.md`](./_reports/2026-10-15_moducore_cloudflare_node_d1/index.md)；此為歷史研究，不覆蓋當前程式與新里程碑證據。
- 舊紀錄：先讀 [`舊的存檔/index.md`](./舊的存檔/index.md)；一般任務不讀取。
- 未定案架構想法：先讀 [`容器架構多框架適應想法/index.md`](./容器架構多框架適應想法/index.md)；不作正式依據。
- 正式治理、工程規則及長期問題：移至 `_VibeCore/` 對應層，不留在 workspace 取代正式規格。

## 敏感資料

禁止在工作狀態、報告與歷史紀錄中保存密碼、Token、Cookie、Authorization Header、API Key、正式憑證或可直接使用的測試帳號。
