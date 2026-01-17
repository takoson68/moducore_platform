# ModuCore Project Scaffold Specification

## 1. Scaffold 目的

本文件定義一個基於 ModuCore 世界觀的新專案，
在「初始化狀態」下應具備的最低結構與約束。

---

## 2. 專案基本角色

- Platform：專案的核心啟動層
- Modules：所有業務能力的唯一存在形式
- API（可選）：對應模組的後端能力

---

## 3. 建議目錄結構（初始）

frontend/
├─ src/
│  ├─ app/          # Platform 層
│  ├─ modules/      # 所有業務模組
│  └─ api/          # API client 抽象
└─ ai/              # AI 協作文件

---

## 4. 初始化專案規則

- 禁止在 app/ 內實作業務邏輯
- 首個業務功能必須以 module 形式存在
- 模組必須可被獨立移除

---

## 5. 第一個模組的最低要求

- 擁有獨立目錄
- 具有單一入口檔案（index）
- 不依賴其他模組
