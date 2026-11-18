# Assumptions

來源：`ai_new/feedback/目錄推論.md`

# 目錄推論（依既有結構與世界文件）

輸出類型：Specification Output（推論文件）  
影響層級：World（工程層結構）  
範圍限定：僅依既有平台目錄與 `ai_new/world/*`、`ai_new/engineering/INDEX.md` 推論必然存在的目錄／檔案層級。

---

## 推論前提（已存在結構）

- `ai_new/world/` 與 `ai_new/engineering/` 已存在
- 平台實作在 `platform/` 下，分為 `frontend/` 與 `backend/`

---

## 必然需要、但目前尚未出現的目錄／檔案層級

### 1) `ai_new/projects/`
角色（對應生命流程 Phase 0）：  
- Phase 0 需讀取目標專案的 Project 定義與 build-time 設定。  
- 世界結構明確定義 Project 結構位於 `ai_new/projects/{project-name}/`。  
- 因此在世界可合法生成前，`ai_new/projects/` 必須存在以承載 Project 定義。

### 2) `ai_new/projects/modules/`（含 `ai_new/projects/modules/index.js`）
角色（對應生命流程 Phase 3）：  
- Phase 3 需依「專案定義」掃描模組入口（`modules/index.js`）。  
- 世界結構明確要求模組註冊入口位於 `ai_new/projects/modules/`。  
- 因此此目錄與入口檔案為模組發現的必要條件。

### 3) `ai_new/outputs/`
角色（對應 Output Definition 的合法產出位置）：  
- 世界結構規定 AI 產出結果需放在 `ai_new/outputs/`，且不得直接寫入 `ai_new/world/`。  
- 若沒有此目錄，AI 產出無合法安置位置，違反 Output Definition。

### 4) `ai_new/prompts/`
角色（對應「任務描述」的世界外部層）：  
- 結構文件定義任務描述放在 `ai_new/prompts/`。  
- 此層用於輸入任務，不具世界裁決力，但為合法任務記錄位置。  
- 因此在完整工作流程中，此目錄為必然需要。

### 5) `ai_new/tools/`
角色（對應工程輔助層）：  
- 結構文件定義工具腳本放在 `ai_new/tools/`。  
- 雖不影響世界裁決，但屬工程層合法落點，避免工具散落破壞結構。

---

## 不在本次推論範圍的項目

- 任何新功能、GUI、未定義模組或未在世界文件中出現之概念
- Platform 前後端的內部目錄設計（世界文件未定義其必要層級）

---

## yi-ly 梅花易數年月日時換算慣例（2026-11-18）

易學網五卷整理本的年月日時起例列年支、農曆月日及時辰數，但未明定時區、閏月、子時換日與夏令時間處理。為使首版計算可重現，暫採以下 Project 層產品慣例，不能表述為原典唯一規則：

- 使用者裝置目前的 IANA 時區，按當地民用時間取年月日時；原始時間與時區一併保存。
- 年支以農曆正月初一換年；不使用立春換年。
- 閏月沿用同序月數，例如閏二月取 2。
- 子時為 23:00–00:59 並取數 1；日期依當地民用日期轉換，23 點不額外推到次日。
- 農曆轉換函式庫只作日期／年支／時支換算；其其他命理功能不參與梅花易數結果。

此假設須在結果介面明示，並以跨年、閏月、子時邊界與 IANA 時區案例驗證。若後續依底本或產品決策修訂，更新 Yi-Ly 專屬方法規格與規則版本，不修改平台 World。
