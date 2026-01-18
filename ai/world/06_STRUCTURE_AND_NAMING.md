# Structure and Naming

本文件定義在此世界中，
所有產出在結構與命名上的「合法形式」。

任何產出若未符合本文件規範，
即視為無法被世界接納。

---

## Structural Principles

- 結構必須反映世界層級，而非技術偏好
- 目錄位置即語意，不允許曖昧
- 命名需可被人與 AI 同時理解

禁止：
- 隱性依賴目錄關係
- 多重語意混合於同一層級
- 為方便而破壞層級一致性

---

## Top-Level Structure

世界相關結構必須存在於 `ai/` 底下。
```
/ai
├─ world/ # 世界定義（唯一權威）
├─ projects/ # Project / 國家 / 平行世界
├─ outputs/ # AI 產出結果（可拋棄）
├─ prompts/ # 任務描述（非世界）
└─ tools/ # 輔助工具與腳本
```

禁止：
- 將世界定義與任務混放
- 將輸出結果視為世界來源

---

## World Directory (`ai/world/`)
```
/ai/world
├─ INDEX.md
├─ 00_PURPOSE.md
├─ 01_WORLD_MODEL.md
├─ 02_WORLD_BOUNDARIES.md
├─ 03_WORLD_LIFECYCLE.md
├─ 04_WORLD_RULES.md
├─ 05_OUTPUT_DEFINITION.md
└─ 06_STRUCTURE_AND_NAMING.md
```

規則：
- 檔名前綴數字即閱讀與載入順序
- 不允許新增未編號世界文件
- 世界文件僅能描述世界，不得描述任務

---



## Project Structure (`ai/projects/`)

每一個 Project 視為一個國家或平行世界。
```
/ai/projects/{project-name}/
├─ project.config.js        # 專案宣告（世界藍圖實例）
├─ build.config.js          # build-time 設定
└─ README.md                # （選用）專案說明
```

規則：
- `{project-name}` 必須具備語意
- Project 不得直接修改 world 定義
- Project 不直接宣告模組



### Project Modules Registry（模組世界語法，唯一入口）

所有 Project 所使用的模組，
必須透過以下結構宣告：
```
/ai/projects/modules/
├─ index.js                     # 模組世界掃描入口（唯一）
└─ {project-name}/
   └─ index.js                  # 該 Project 的模組介面定義
```
規則：
- modules/index.js 只負責收集 Project Modules Namespace
- {project-name}/index.js 是該 Project 唯一合法的模組宣告位置
- World 僅透過 index.js 系列檔案感知模組存在
- Project 本身不持有模組集合

---






## Module Structure

### Business Module
```
/modules/{module-name}/
├─ index.js # 模組介接口（唯一對外出口）
├─ pages/ # 頁面（可選）
├─ stores/ # 狀態（可選）
├─ routes/ # 路由宣告（可選）
├─ api/ # API 封裝（可選）
├─ components/ # 模組內元件（可選）
└─ assets/ # 模組資源（可選）
```


規則：
- `index.js` 必須存在
- 模組內自由 import
- 模組外不得直接 import 其內部結構

---

### Component Module
```
/modules/{component-module-name}/
├─ index.js
├─ services/
├─ stores/
└─ components/
```


規則：
- 不輸出頁面
- 仍需透過 Container 提供能力
- 命名需能辨識其「能力性質」

---

## Container Naming

- 容器能力註冊名稱需為語意名稱
- 不得包含技術實作細節
- 不得與模組目錄名稱產生歧義

範例：
- ✅ `auth`
- ✅ `booking`
- ❌ `useAuthStore`
- ❌ `auth_v2_impl`

---

## File Naming Rules

- 使用 `kebab-case` 命名目錄
- 使用 `camelCase` 命名變數與能力
- 檔名需反映其語意責任，而非技術用途

禁止：
- `temp`
- `utils`（無限定語）
- `common`（無世界語意）

---

## Output Placement Rules

AI 所產出的任何檔案，必須：

1. 明確指出所屬 Project 或 Module
2. 放置於合法目錄層級
3. 不得直接寫入 `ai/world/`

世界只能被修改，
不能被「即席產出」。

---

## Naming Invariant

- 名稱一旦成立，即代表世界語意
- 重新命名 = 語意調整
- 語意調整需回到 world 層處理

---

End of Structure and Naming Definition




