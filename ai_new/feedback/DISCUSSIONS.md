任務：
請以「平行新世界遷移」方式，建立 `ai_new/` 資料夾，
將現有 `ai_new/` 內的世界與工程文件，依新的歸納方法重寫並整理到 `ai_new/`。

【輸入來源】
- 只允許讀取現有 `ai_new/` 目錄（含 ai_new/world、ai_new/engineering、ai_new/交流 或 ai_new/feedback 等）
- 不得依賴對話內容推論缺失內容
- 不得引入任何未出現在 ai_new/ 內的概念或規則

【目標輸出結構（必須完全一致）】
ai_new/
- world/
  - 01_INVARIANTS.md
  - 02_ROLE_CONTRACTS/
    - frontend-platform.md
    - module.md
    - container.md
    - store.md
  - 03_LIFECYCLE.md
  - 99_CLARIFICATIONS.md
  - INDEX.md
- engineering/
  - INDEX.md
  - CONVENTIONS.md
  - CHANGELOG.md
  - GIT_AUTOMATION.md
- feedback/
  - DISCUSSIONS.md
  - KNOWN_ISSUES.md
  - ASSUMPTIONS.md

【遷移規則（最重要）】
1) 任何內容只能從 ai_new/ 搬運、重寫、歸納，不得新增新規則
2) 01_INVARIANTS.md：
   - 必須包含「世界不變量」清單
   - 內容來源應以原本的 World Boundaries / World Invariants 為主
3) 02_ROLE_CONTRACTS/：
   - 每份 Role Contract 必須在檔首加入 Derived From，列出對應的不變量編號
   - 不得自創新的不變量；若缺資料只能寫「缺口」並指出來源文件不存在
4) 99_CLARIFICATIONS.md：
   - 收納「曾在工程/討論中出現，但未被世界正式定義」的裁決或缺口
   - 若找不到來源，就不要寫
5) feedback/：
   - 將 ai_new/ 中屬於「交流、待釐清、討論、假設、已知問題」的內容歸類放入
   - 不得把 feedback 當成 world 規則
6) 禁止改動現有 ai_new/，只允許建立/寫入 ai_new/

【一致性檢查（你必須做）】
完成 ai_new/ 後，請自行檢查並輸出一份報告，寫入：
- ai_new/world/INDEX.md 末尾的 "Consistency Report" 區塊

檢查項目至少包含：
- 不變量是否只存在於 01_INVARIANTS.md（不得散落）
- Role Contract 是否都引用 Derived From（若無就列為缺口）
- feedback 內容是否沒有被寫成世界規則（若有就列出位置）
- 是否存在內容重複、矛盾或來源不明（列出檔名與段落標題）

【輸出回報】
最後請回報：
- ai_new/ 是否建立完成
- Consistency Report 是否已寫入
- 若存在阻塞缺口，請列成清單（不要自行補完）

**********************

議題：模組放置位置的世界層裁決需求
背景：目前工程實作已將模組放入 `platform/frontend/projects/{project}/modules/`，但世界結構定義（`ai_new/world/06_STRUCTURE_AND_NAMING.md`）仍採全域 `/modules/{module-name}/`。這造成世界語意與工程落地衝突，後續易重演。
需求：希望世界層明確裁決「模組是否必須位於專案目錄下」，並界定其合法結構與語意角色。
影響：若裁決為專案內模組，需調整世界結構定義；若維持全域模組，則應回退工程實作並恢復一致性。
建議變更類型：Refinement 或 Behavioral Change（待世界設計者判定）。
