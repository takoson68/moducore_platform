# Routing & Guards — World Semantic Addendum

本文件補完「路由（Routing）與守衛（Guards）」在**世界層（World Layer）**中的語意定位。  
本文件**不定義路由實作、不描述框架行為、不推導工程技巧**，僅界定世界語意中路由與守衛的責任與邊界。

---

## 1. Routing / Guards 作為最後防線

Routing Guard 在世界語意中扮演**最後防線（Final Boundary）**的角色。

其唯一語意責任為：

- 阻止未授權的進入
- 阻止違反世界語意的路徑存取

並受以下嚴格限制：

- ❌ Routing 不得成為模組是否存在的判準
- ❌ Routing 不得創造、隱含或補充任何世界能力
- ❌ Routing 不得以導向、攔截或 fallback 行為推論世界狀態

Routing 是**防禦層**，而非**定義層**。

---

## 2. 路由與模組可見性的語意關係

模組是否可見、是否可使用，**必須在路由進入之前即完成世界裁決**。

在世界語意中適用以下原則：

- 模組可見性由世界裁決決定
- Routing **僅承接並執行**既有裁決結果
- ❌ Routing 不得反向改寫模組存在性
- ❌ Routing 不得以條件式邏輯創造模組可用假象

換言之：

> **模組先被世界承認，  
> 路由才允許進入。**

---

## 3. 路由行為與世界一致性

任何路由行為必須嚴格服從世界邊界（World Boundary）。

以下行為在語意上被明確禁止：

- 跨 Project 的未授權存取
- 透過路由影響其他世界狀態
- 以工程便利為理由擴張可存取範圍

路由是否合法的唯一依據為：

- **世界裁決是否允許**

而非：

- 框架能力
- 路由技巧
- 使用者請求形式

世界一致性優先於路由設計自由。

---

End of Routing & Guards — World Semantic Addendum  
(Semantics Only, No Routing Implementation Implied)
