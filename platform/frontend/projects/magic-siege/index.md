# magic-siege/index.md
## 攻破魔法城

---

## 0. 本專案的角色

本目錄為 `magic-siege` 的 Project 實例入口。

本目錄只負責：

- 導引本專案的閱讀順序。
- 宣告本專案的結構與文件位置。
- 定義本專案的範圍入口。

本目錄不負責：

- 取代 `PROJECT_CONTEXT.md`。
- 定義上層 World、Engineering 或 Game Runtime 規則。

---

## 1. 專案目的

- 專案問題：完成第一款可從第 1 波玩到第 10 波的 2D 格子塔防遊戲。
- 主要對象：專案作者本人，用於學習塔防玩法與 ModuCore Game Runtime。
- 預期交付：「攻破魔法城」幾何原型 MVP。

---

## 2. 閱讀順序

1. `index.md`
2. `PROJECT_CONTEXT.md`
3. `project.config.js`
4. `docs/index.md`
5. 當前任務對應的 `docs/` 文件
6. `decisions/`
7. `layout/`
8. `modules/`
9. `styles/`

---

## 3. 專案結構

- `PROJECT_CONTEXT.md`：專案背景、範圍、限制與假設。
- `project.config.js`：Project 身分與執行時最低宣告。
- `docs/`：玩法企劃、MVP 數值與專案策略。
- `decisions/`：專案層的已確認取捨。
- `layout/`：專案畫面承載外殼。
- `modules/`：遊戲模組 Registry；尚未開始玩法實作。
- `styles/`：專案樣式入口。

---

## 4. 入口與啟動點

- 啟動入口：`platform/frontend/src/main.js`。
- 專案選擇方式：`VITE_PROJECT=magic-siege`。
- 主要設定來源：`project.config.js`。

---

## 5. 模組與頁面範圍

- 核心模組：待幾何原型實作時建立。
- 非核心模組：目前無。
- 主要頁面：單一遊戲畫面，尚未實作。
- 導航原則：MVP 不建立多場景或通用場景管理器。

---

## 6. 專案限制

- 技術限制：沿用現有 `Game`、遊戲私有 Container、模組生命週期與 p5 適配器。
- 產品限制：先交付幾何原型，正式美術延後。
- 參考限制：學習並復刻 `Infinitode 2` 的核心操作體驗，不複製其程式碼、美術、音效、文字、關卡或精確數值。
- 文件限制：專屬規則只對 `magic-siege` 生效，不反向改寫平台規則。

---

## 7. 文件 Registry

- `PROJECT_CONTEXT.md`
- `project.config.js`
- `docs/index.md`
- `docs/MILESTONE_PLAN.md`
- `docs/PROGRESS.md`
- `docs/塔防遊戲 MVP 企劃書_v1.0.md`
- `docs/ModuCore × 塔防遊戲：容器使用策略 v1.0.md`
- `docs/assets/geometry-prototype-screen-v1.png`
- `decisions/D001_infinitode-2-learning-reference.md`
- `layout/`
- `modules/`
- `styles/`

---

## 8. 裁決聲明

- 本檔為本專案目錄唯一入口。
- 本檔只管理本專案內的閱讀順序與文件註冊。
- 若本檔與 `_VibeCore/projects/index.md` 衝突，以上層為準。
