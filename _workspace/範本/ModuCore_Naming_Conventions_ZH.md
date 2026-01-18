# ModuCore – AI / Agent Naming Conventions（含中文語意）

> 本文件定義 **ModuCore 平台在 AI / Agent / Skills / Tasks 中的命名規則**，
> 並在每一個命名單字後提供**中文語意說明**，用來避免誤解與行為擴散。
>
> ❗ 命名不是美學問題，而是「行為控制問題」。

---

## 一、命名核心原則（重要）

**只看名稱，就必須能預測 AI 的行為範圍。**

如果僅從名稱無法判斷以下任一項，該命名即不合格：
- 會不會建立新檔案
- 會不會修改既有內容
- 是否只讀（read-only）

---

## 二、命名基本結構（強制）

```
<Action><Target><Scope?>
```

- **Action（動作）**：AI 將執行的行為
- **Target（對象）**：行為作用的層級
- **Scope（範圍，可選）**：額外邊界或限制條件

---

## 三、Action（動作動詞表｜附中文語意）

### 🧱 建立 / 生成（會產出新結構）

| 單字 | 中文語意 |
|----|----|
| create | 建立新的實體（檔案 / 結構 / 模組） |
| generate | 依規則產生內容（通常來自描述） |
| scaffold | 建立骨架（空殼結構，不含業務） |
| initialize | 初始化（第一次建立並設定初始狀態） |
| define | 定義規則或結構（偏宣告性） |

❌ 避免使用（語意過度模糊）：
- setup（隱含順便處理其他事）
- build（範圍過大）
- handle / manage（無邊界）

---

### 🔧 套用 / 調整（不建立新結構）

| 單字 | 中文語意 |
|----|----|
| apply | 套用既有規則或設定 |
| assign | 指派（建立關聯，不產生新實體） |
| attach | 附加（掛載既有物件） |
| bind | 綁定關係（雙向或單向） |
| configure | 設定參數（只調整，不建立） |
| map | 對應關係（A → B 映射） |

📌 使用這些動詞時，**AI 不應建立任何新檔案**。

---

### 🔍 分析 / 驗證（只讀）

| 單字 | 中文語意 |
|----|----|
| analyze | 分析結構或狀態 |
| inspect | 檢視細節（人工檢查語意） |
| validate | 驗證是否符合規則 |
| verify | 核對正確性（通常有標準） |
| check | 快速檢查（淺層） |
| audit | 全面稽核（嚴格） |

📌 **禁止任何檔案異動**，輸出只能是報告。

---

### 🧠 決策 / 判斷（回傳結論）

| 單字 | 中文語意 |
|----|----|
| decide | 根據條件做出決定 |
| determine | 判定最終結果 |
| resolve | 解決歧義或衝突 |
| classify | 分類歸屬 |

---

### 💣 清除 / 重置（破壞性）

| 單字 | 中文語意 |
|----|----|
| reset | 重置為初始狀態 |
| clear | 清空資料 |
| remove | 移除指定項目 |
| cleanup | 清理殘留物 |
| dispose | 永久銷毀（不可復原） |

⚠️ 使用此類 Action **必須明確 Scope**。

---

## 四、Target（作用對象｜中文語意）

### 平台層
| 單字 | 中文語意 |
|----|----|
| Platform | 平台核心 |
| Runtime | 執行期環境 |
| Lifecycle | 生命週期 |
| Config | 設定 |
| Environment | 環境變數 |

### 模組層
| 單字 | 中文語意 |
|----|----|
| Module | 功能模組 |
| Route | 路由 |
| Store | 狀態存放 |
| Service | 服務層 |
| Component | UI 元件 |
| Page | 頁面 |

### AI / Agent 層
| 單字 | 中文語意 |
|----|----|
| Agent | AI 代理角色 |
| Skill | 可執行能力 |
| Task | 單一任務 |
| Prompt | 指令內容 |
| Context | 上下文 |

### 專案層
| 單字 | 中文語意 |
|----|----|
| Project | 專案 |
| Repository | 程式碼倉庫 |
| Structure | 結構 |
| Dependencies | 相依套件 |

---

## 五、Scope / Rule（行為限制）

| 單字 | 中文語意 |
|----|----|
| AuthOnly | 僅限登入後 |
| PublicOnly | 僅公開 |
| Readonly | 只讀 |
| Strict | 嚴格模式 |
| Minimal | 最小化 |
| Explicit | 必須明確 |
| Bounded | 有邊界 |
| Scoped | 限定範圍 |
| Safe | 安全模式 |

---

## 六、Output Hint（輸出語意）

| 單字 | 中文語意 |
|----|----|
| Report | 報告 |
| Summary | 摘要 |
| Checklist | 檢查清單 |
| Diff | 差異比對 |
| Plan | 行動計畫 |
| Manifest | 清單描述 |
| Result | 結果 |

---

## 最終原則

**名稱即規則。  
AI 依名稱推論行為。  
命名失控 = 系統失控。**
