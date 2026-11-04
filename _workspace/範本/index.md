# 範本與人工操作文件索引

## 範圍

本目錄保存可重複使用的專案思考範本、命名參考，以及供人類直接操作的部署手冊。這些文件不取代 `_VibeCore/engineering/` 的正式工程規則；若指令、授權或流程衝突，以 `_VibeCore/RootIndex.md` 與 Engineering 導讀鏈為準。

## 閱讀路由

- 使用者說「我要部署」「部署這版」「發布新版本」：AI 應先依 `_ai-context/index.md` 與 `_VibeCore/engineering/AI_WORKFLOW.md` 判斷自動 Staging Tag 流程；正式細節讀 `_VibeCore/engineering/TAG_DEPLOYMENT_MANUAL.md`。
- 人類要手動建立 Tag、查看 Actions、確認畫面版本或使用版本控制台切版：讀 [`自動部署指令使用步驟手冊.md`](./自動部署指令使用步驟手冊.md)。控制台本機入口、啟動方式及限制均在該手冊。
- 網頁遊戲初步規劃：讀 `ModuCore-網頁遊戲初步架構構思.md`。
- 命名參考：讀 `ModuCore_Naming_Conventions_ZH.md`。
- 專案／元件起始文字範本：依需求讀取相應 `.txt` 文件；均為參考素材，不是正式治理文件。

## 權限與裁決

- 本索引負責本目錄文件的範圍與閱讀路由，不授權外部部署或其他 Git 操作。
- 部署操作授權依當前使用者明確要求與 `_VibeCore/engineering/AI_WORKFLOW.md` 判定。
- 範本內容若與正式 World／Engineering 規則矛盾，以正式規則為準；不得把歷史範例的版本號直接重用。
