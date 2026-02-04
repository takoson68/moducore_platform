# Output Definition

本文件定義在此世界中，
AI 被允許產出的「結果類型」與「完成標準」。

任何輸出，若未符合本文件定義，
即使程式可執行，也視為不完整產出。

---

## Output Principles

- AI 的輸出必須是「世界內產出」，不是即席範例
- 輸出結果必須能被放入既有世界而不破壞其結構
- 輸出不得隱含世界未定義的規則或捷徑

輸出不是創作，
而是世界中的一次合法建設行為。

---

## Output Categories

### 1. World-Level Output（世界層輸出）

用於影響整個世界行為或形態的輸出。

可能包含：
- 世界配置調整建議
- 世界生命週期補充
- 世界層新增約束或宣告

限制：
- 不得直接修改 PlatformConfig 核心語意
- 不得引入未定義的世界概念

---

### 2. Project-Level Output（專案 / 國家層輸出）

用於建立或調整某一個 Project（國家 / 平行世界）。

可能包含：
- 專案設定定義
- 專案使用模組清單
- 專案 build 組態描述

完成標準：
- Project 定義清楚其所屬 tenant_id
- 不影響其他 Project 存在

---

### 3. Module-Level Output（模組層輸出）

用於新增或修改業務模組或元件模組。

必須包含：
- 清楚的模組責任描述
- index.js 作為模組能力輸出入口
- 模組如何被世界載入的宣告

限制：
- 模組不得假設其他模組存在
- 模組不得跨越 Container 邊界
- 模組可被單獨拔除而不影響世界

---

### 4. Architecture Skeleton Output（架構骨架輸出）

用於產生「尚未填內容」的結構性成果。

包含：
- 合法目錄結構
- 合法檔名
- 清楚的語意占位

用途：
- 作為後續實作或人工補充的基礎
- 不要求立即可運行

---

### 5. Specification Output（規格型輸出）

用於補充或修訂世界文件本身。

包含：
- world 目錄中的描述文件
- 條文、宣告、定義修正

限制：
- 不得推翻既有世界核心定義
- 只能補充、細化或明確化

---

## Completion Criteria

一份輸出被視為「完成」，必須同時滿足：

1. 明確聲明所屬 Output Category
2. 指出影響的世界層級（World / Project / Module）
3. 不違反任何 World Boundary
4. 不破壞既有 Lifecycle

---

## Forbidden Output

在此世界中，以下產出視為非法：

- 僅提供片段程式碼而無結構定位
- 未說明放置位置的輸出
- 假設世界不存在邊界的快捷解法
- 繞過 Container、Router 或 Lifecycle 的設計

---

## Output Responsibility

AI 不對商業結果負責，
只對世界結構正確性與一致性負責。

任何能破壞世界一致性的產出，
即使「看起來很好用」，都必須被拒絕。

---

End of Output Definition
