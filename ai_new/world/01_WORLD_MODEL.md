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

World 本身不關心模組是否存在，
World 只負責依照其藍圖被實體化並運行。

---

### Platform

- Platform 是 World 的核心基礎結構
- Platform 在任何模組載入之前即已存在
- Platform 永遠存在於 World 中

Platform 提供世界運行所需的基礎能力，包括：
- container
- base services
- platform-level stores
- platform-level UI components
- platform-level API utilities

Platform 不承擔任何業務語意，
僅作為 World 的穩定基底。

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
- 判定世界狀態

---

### Project

- Project 是 World 的一種具體實例來源
- 每一個 Project 對應一個 World 實例
- 任一時間只允許載入一個 Project
- Project 對應唯一的 tenant_id（世界身份）

Project 決定：
- 使用哪一組模組
- 使用哪一份 PlatformConfig
- 世界所屬的 tenant 身份

Project 與 Project 之間：
- 資料必須隔離
- 設定不可共享
- 世界狀態不可互相干涉

刪除一個 Project：
- 等同於該 World 實例被終止
- 不影響 Platform 本身的存在

---

### PlatformConfig

- PlatformConfig 是 World 誕生前的靜態藍圖
- PlatformConfig 決定 World 的基礎樣貌
- 不同 PlatformConfig 可生成不同配置的 World

PlatformConfig 影響：
- 初始顯示狀態
- 可載入模組的條件
- 主題（CSS root）
- 基礎世界設定

PlatformConfig 本身不參與世界運行中的裁決。

---

## Modules

### Business Module

- Business Module 是構成世界功能與畫面的主要來源
- Business Module 以資料夾為單位存在
- 每個 Business Module 必須提供一個 index.js 作為介面入口

Business Module 可以包含：
- pages
- stores
- routes
- api
- components
- assets

Business Module：
- 僅能透過 Container 與世界互動
- 不得直接依賴其他模組
- 可被單獨註冊、卸載與替換

---

### Component Module

- Component Module 是一種不輸出頁面的能力模組
- Component Module 提供可重用的業務能力
- Component Module 不是平台內建元件

Component Module：
- 不附屬於任何特定模組
- 可被多個模組使用
- 必須透過 Container 註冊其能力

---

## Routing System

- Routing System 描述 World 可被導覽的方式
- Routing 由已註冊模組所輸出的結構所組成
- Routing System 包含 route guard，作為世界的最後防線

Routing System：
- 不決定模組是否存在
- 不決定模組是否註冊
- 不作為能力裁決來源
- 僅裁決使用者是否可進入既有世界內容

---

## Identity

### User

- User 是 World 中的使用者或訪客
- User 可能為未登入（guest）或已登入狀態
- User 狀態會影響可進入的世界內容

---

### Tenant Identity (tenant_id)

- tenant_id 是 World 的身份識別
- 每一個 World 僅對應一個 tenant_id
- tenant_id 不可在同一時間並存於多個 World

tenant_id 用於：
- 後端資料隔離
- 世界層級資料邊界的識別

---

## State & Memory

### Store

- Store 用於保存 World 在前端運行時所需的狀態投影
- Store 中的資料通常來自後端或平台初始化結果
- 若某狀態會影響 World 在前端的未來行為，應進入 Store
- Store 可選擇是否同步至瀏覽器儲存

Store 不是事實權威，
其內容必須能被後端資料更新、修正或取代。

---

### Ephemeral Data

- Ephemeral Data 是短暫且即時的資料
- 不影響 World 的未來行為
- 不進入 Store
- 可存在於記憶體或瀏覽器暫存中

---

## World Reset

- Reset 表示 World 實例被重置
- Reset 會清空所有業務模組狀態
- Reset 會保留 Platform 與 PlatformConfig
- Reset 後 World 回到未登入狀態

---

End of World Model Definition
