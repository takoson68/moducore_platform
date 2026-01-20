# World Lifecycle

本文件定義模組開發平台世界的「真實運行生命週期」。
世界在 build-time 被決定，其結果在 run-time 被執行。
此生命週期用來確保世界可預期、可攔截、可除錯。

---

## Lifecycle Overview

世界的運行被切分為一組**有序且可標記的階段**。
錯誤不是因為非法行為，而是因為世界停留在某一階段。

世界並不要求所有階段可重跑，
但每個階段必須可被識別、記錄與中斷。

---

## Phase 0：World Blueprint Resolution（建世界藍圖）

**發生時機**
- build-time
- 在任何實際程式碼執行之前

**行為**
- 讀取目標專案的 project 定義
- 決定本次要生成哪一個世界出口
- 若存在 platformConfig，則載入作為世界藍圖；否則世界以單一 Project 脈絡成立


**語意**
- 此階段決定「世界長什麼樣」
- 尚未產生世界實例

---

## Phase 1：Core World Boot（平台核心啟動）

**發生時機**
- run-time 開始

**行為**
- 建立平台核心（container、platform store、base services）
- world 尚未載入任何業務模組
- 僅存在平台本身

**語意**
- 世界開始存在
- 世界尚未有內容

---

## Phase 2：Guest World Establishment（未登入世界建立）

**發生時機**
- Core boot 完成後

**行為**
- 若存在 platformConfig，則套用其世界上下文設定
- 建立未登入（guest）世界狀態
- 設定基礎樣式（CSS root / theme）
- 尚未評估業務模組顯示條件

**語意**
- 世界已可被看見
- 但尚未被「組裝」

---

## Phase 3：Module Discovery（模組發現）

**發生時機**
- Guest world 成立後

**行為**
- 依照專案定義，掃描目標模組入口（modules/index.js）
- 收集各模組 index.js 所宣告的能力描述
- 尚未載入模組實體
- 尚未註冊進 container

**語意**
- 世界知道「有哪些模組可能存在」
- 但尚未承認其進入世界

---

## Phase 4：Access & Visibility Evaluation（可見性與權限裁決）

**發生時機**
- 模組被發現後

**行為**
- 根據模組宣告與 platformConfig 判斷：
  - 是否允許未登入顯示
  - 是否僅能登入後顯示
- 執行路由與權限相關判斷
- 不合格模組在此階段被攔截

**語意**
- 這是模組進入世界前的第一道防線
- 不可見 ≠ 不存在
- 不可見 = 不被承認為世界一部分

---

## Phase 5：Container Registration（模組註冊）

**發生時機**
- 模組通過可見性與權限裁決後

**行為**
- 合法模組被註冊進 container
- 模組能力正式成為世界能力的一部分
- 模組正式存在於世界中

**語意**
- `container.register` 是世界承認模組存在的臨界點
- 未註冊模組在世界中等同不存在

---

## Phase 6：Module Initialization（模組初始化）

**發生時機**
- 註冊完成後

**行為**
- 呼叫模組 init lifecycle
- 初始化模組內部 store、service、side-effect
- 模組不得直接影響其他模組

**語意**
- 世界被內容填充
- 低耦合必須在此階段被維持

---

## Phase 7：Runtime Execution（世界運行）

**發生時機**
- 世界初始化完成後

**行為**
- 使用者互動
- API 呼叫
- 狀態變化
- 畫面更新

**語意**
- 世界正常運作狀態

---

## Phase 8：World Reset（世界倒帶）

**發生時機**
- 登出
- 專案切換
- 強制重置

**行為**
- 卸載業務模組
- 清空 container 中的業務能力
- 若存在 platformConfig，則保留其世界上下文
- 回到 Guest World Establishment 狀態


**語意**
- 世界倒帶，不是世界重生
- 藍圖不變，內容清空

---

## Lifecycle Invariants

- 世界在 build-time 被定義，在 run-time 被執行
- 模組的存在以 container.register 為準
- 任何未通過裁決的模組不得影響世界
- 除錯以「卡在哪一個 phase」為最高優先級

---

End of Lifecycle Definition
