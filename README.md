# ModuCore Platform

ModuCore Platform 是一套 **工作平台導向（Work Platform Oriented）** 的全端架構實驗專案。

它的目標不是建立單一網站，而是打造一個 **可承載多個專案世界（Project / World）** 的平台，
並透過明確的世界規則，使系統在任一時間只存在於一個確定、可裁決的世界狀態中。

---

## 🎯 專案定位（一句話）

**這是一個工作平台；Project 是世界實例；Module 是世界的構成實體；Container 是能力入口。**

---

## 🧠 世界模型（以 ai/world 為準）

ModuCore 的所有設計均以 `ai/world/` 所定義的世界模型為主鏈，README 僅負責說明與對齊，不具規則裁決權。

---

## 🌍 世界（World）與專案（Project）

- 每一個 Project 對應一個世界實例（World Instance）
- 世界以 `tenant_id` 作為唯一識別
- **任一時間系統中只允許存在單一世界**
- Project 不可並存，世界切換等同於世界重置或替換

世界負責定義：

- 本世界允許啟用的模組集合
- 世界層級設定（config）
- 進入世界後的可用行為邊界

世界不是資料夾，而是平台在啟動後形成的**唯一有效工作狀態**。

---

## 🔥 Container：世界能力的唯一入口

在 ModuCore Platform 中，**Container 是世界能力的唯一入口**。

Container 的職責是：

- 作為能力的註冊與存取中心
- 隔離模組之間的直接依賴
- 提供世界中所有可被使用的能力實體

Container **不負責**：

- 世界流程裁決
- 權限判斷
- 生命週期決策

世界的生命週期、流程與進入條件，  
**由 Platform 與 lifecycle 規則主導，而非 Container 本身**。

---

## 🧱 模組（Module）：世界的構成實體

模組是構成世界的功能實體，但**並非一開始就視為存在**。

一個模組可以包含：

- UI（頁面 / 元件）
- Routes
- Store
- API 介面
- 權限語意（public / auth）
- Lifecycle（init / dispose）

### 模組存在的唯一判準

> **模組是否存在，以 `container.register` 為唯一判準。**

- 未被註冊的模組，視為不存在
- 模組的可見性與權限裁決 **必須在註冊前完成**
- 不可見模組不得進入 Container

---

## 🧱 Store：狀態的唯一權威

Store 的角色是 **狀態管理**，且是影響世界行為的唯一權威來源。

### 狀態權威規則（World Boundary）

- **任何會影響世界未來行為的資料，必須進入 Store**
- 不影響未來行為的資料，不得作為世界決策依據

### Store 分類

#### 平台級 Store（Platform Stores）

- 世界層級狀態
- 由平台在 boot 階段註冊
- 例如：
  - auth / token
  - platformConfig
  - lifecycle / session

#### 模組私有 Store（Module Stores）

- 僅服務模組內部狀態
- 隨模組註冊 / 移除建立或清理
- 不得被其他模組直接依賴

---

## 🚧 Routing：世界的最後防線

Routing Guard 是使用者進入世界內容的最後防線：

- 驗證使用者是否可進入當前世界狀態
- 阻擋未授權或不合法的世界存取

⚠️ Routing **不得** 作為：

- 模組存在判準
- 能力註冊依據
- 世界裁決核心

Routing 僅負責進出邊界，不負責世界定義。

---

## 🔁 前端與後端關係

- 前端：承擔世界模型實現、平台規則、能力組裝
- 後端：維持為薄後端，僅提供必要 API（登入、Session、基本資料）

後端不參與世界裁決，只負責支援世界運作所需的最小事實來源。

---

## 🧩 世界語意分層

```text
┌──────────────────────────────┐
│           Platform           │ 世界規則 / lifecycle / guard
├──────────────────────────────┤
│        World (Project)       │ tenant_id / config
├──────────────────────────────┤
│           Container          │ 能力註冊與存取入口
├──────────────────────────────┤
│           Modules            │ UI / store / api
├──────────────────────────────┤
│        Backend (Thin)        │ auth / session / data
└──────────────────────────────┘
```