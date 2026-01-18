# World Model

本文件定義模組開發平台世界中「存在哪些事物」，
以及它們在世界中的基本身份與語意角色。

此文件不描述流程、不描述規則，
只描述「世界裡有誰」。

---

## Core Concepts

### World

- World 是一次可被執行的系統實例
- World 在 build-time 被定義
- World 在 run-time 被實體化
- 同一時間 **只允許存在一個 World 實例**

World 不關心模組是否存在，
World 只負責依照藍圖運行。

---

### Platform

- Platform 是 World 的核心基礎結構
- Platform 在任何模組載入之前即已存在
- Platform 永遠存在於 World 中

Platform 提供：
- container
- base services
- platform-level stores
- platform-level UI components
- platform-level API utilities

---

### Container

- Container 是 World 的能力容器
- Container 是能力的唯一取得來源
- 未註冊進 Container 的能力，在 World 中視為不存在

Container 負責：
- 註冊能力
- 提供能力
- 隔離模組之間的直接依賴

Container 不負責：
- 判斷顯示
- 決定權限
- 控制流程

---

### Project

- Project 是 World 中的一個「國家」或「平行世界」
- 每一個 Project 都代表一個獨立的世界實例
- Project 決定：
  - 使用哪一組模組
  - 使用哪一份 PlatformConfig
  - 對應哪一個 tenant_id（世界身份）

Project 與 Project 之間：
- 資料必須隔離
- 設定不可共享
- 世界狀態不可互相干涉

刪除一個 Project：
- 等同於一個國家滅亡或一個平行世界關閉
- 不會影響平台本身（Platform）存在

---

### PlatformConfig

- PlatformConfig 是 World 誕生前的藍圖
- PlatformConfig 決定 World 的基礎樣貌
- 不同 PlatformConfig 可生成不同風格的 World

PlatformConfig 影響：
- 初始顯示狀態
- 可見模組條件
- 主題（CSS root）
- 基礎世界設定

---

## Modules

### Business Module

- Business Module 是構成世界畫面的主要來源
- Business Module 以資料夾為單位存在
- 每個 Business Module 必須提供一個 index.js 作為介接口

Business Module 可以包含：
- pages
- stores
- routes
- api
- components
- assets

Business Module：
- 只能透過 Container 與世界溝通
- 不得直接依賴其他模組
- 可被單獨拔除與替換

---

### Component Module

- Component Module 是一種具備業務能力的模組
- Component Module 不輸出頁面
- Component Module 不是平台元件

Component Module：
- 不附屬於其他模組
- 可被多個模組使用
- 必須透過 Container 註冊能力

---

## Routing System

- Routing System 負責描述世界可被導覽的方式
- Routing System 根據模組輸出決定可進入的畫面
- Routing System 包含 route guard 作為最後防線

Routing System：
- 不決定模組是否存在
- 不決定模組是否註冊
- 僅裁決使用者可前往的路徑

---

## Identity

### User

- User 是 World 中的訪客
- User 可能為未登入（guest）或已登入狀態
- User 的狀態影響模組可見性

---

### Tenant Identity (tenant_id)

- tenant_id 是 World 所屬的身份識別
- 每一個 World 僅對應一個 tenant_id
- tenant_id 不可在同一時間並存

tenant_id 用於：
- 後端資料隔離
- 世界級資料邊界劃分

---

## State & Memory

### Store

- Store 用於保存會影響世界行為的狀態
- 若狀態會改變 World 的未來行為，必須入 Store
- Store 可選擇是否同步至瀏覽器儲存

---

### Ephemeral Data

- Ephemeral Data 是重要但短暫的資料
- 不影響 World 未來行為
- 不入 Store
- 可存在於記憶體或瀏覽器暫存

---

## World Reset

- Reset 代表 World 倒帶
- Reset 會清空業務模組
- Reset 會保留 Platform 與 PlatformConfig
- Reset 後 World 回到未登入狀態

---

End of World Model Definition
