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

世界相關結構必須存在於「本世界根目錄」之下。

本文件中所描述之結構，
皆以「當前世界目錄」作為唯一權威來源。


```
/{world-root}
├─ world/      # 世界定義（唯一權威）
├─ api/        # API World
├─ modules/    # Module World
├─ engineering/# 工程層
├─ outputs/    # 可拋棄產出
└─ tools/      # 輔助工具
```
說明：
- `{world-root}` 為世界實際所在之根目錄
- 不預設其為固定路徑名稱
- 世界裁決僅與世界目錄結構本身綁定，而非路徑字串

禁止：
- 將世界定義與任務混放
- 將輸出結果視為世界來源

---

## World Directory (`ai_new/world/`)

以下為世界**主鏈文件**之結構定義。

主鏈文件用於定義世界本身，
其內容具備裁決力。

```text
/ai_new/world
├─ INDEX.md
├─ 00_PURPOSE.md
├─ 01_WORLD_MODEL.md
├─ 02_WORLD_BOUNDARIES.md
├─ 03_WORLD_API_RULES.md
├─ 04_WORLD_LIFECYCLE.md
├─ 05_OUTPUT_DEFINITION.md
├─ 06_STRUCTURE_AND_NAMING.md
├─ 07_AUTHORING_STYLE.md
├─ 08_CHANGE_PROTOCOL.md
├─ 09_WORLD_RULES.md

```

規則：
- 檔名前綴數字代表結構層級識別，不必然等同閱讀順序
- 主鏈文件的閱讀順序與理解流程，一律以 INDEX.md 為準
- 主鏈中不允許插入未編號文件
- 主鏈文件僅能描述世界本身，不得描述任務或操作
- 延伸敘事層（如 model/）不屬於主鏈結構
---



## Project Structure (`ai_new/projects/`)

每一個 Project 視為一個國家或平行世界。
```
/ai_new/projects/{project-name}/
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
/projects/{project-name}/modules/
├─ index.js                     # 模組世界掃描入口（唯一）
└─ {module-name}/
   └─ index.js                  # 該模組的對外介面定義

```
規則：

- /projects/{project-name}/modules/index.js
是該 Project 唯一合法的模組宣告與註冊入口
只負責收集並輸出 Project Modules Namespace
不得在此進行模組實作、初始化、組裝或任何具副作用的行為

- {module-name}/index.js
僅負責宣告該 module 的對外介面與中繼資訊
不得在此執行模組載入、世界操作或影響其他模組
未具備 index.js 的 module，對 World 而言視為不存在

- World 不解析 Project 內部結構，
不掃描目錄、不推論模組存在，
僅透過 modules/index.js 與各 module 的 index.js 系列檔案
感知模組是否存在

- Project 可以使用模組，但不持有模組集合
不負責組裝、不裁決模組存在性
模組集合僅存在於 Registry 的輸出結果中

- 任何未經 /modules/index.js 宣告的模組，
無論實體檔案是否存在，
在世界層級上一律視為不存在，亦不得被使用或合理化

---






## Module Structure

### Business Module
```
/projects/{project-name}/modules/{module-name}/
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
- 模組只能被所屬 Project 使用，不得跨 Project 共享或依賴


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
3. 不得直接寫入 `ai_new/world/`

世界只能被修改，
不能被「即席產出」。

---

## Naming Invariant

- 名稱一旦成立，即代表世界語意
- 重新命名 = 語意調整
- 語意調整需回到 world 層處理

---

End of Structure and Naming Definition




