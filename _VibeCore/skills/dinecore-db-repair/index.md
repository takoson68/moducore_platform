# DineCore DB Repair Skill 索引

## 範圍

本 Skill 提供 DineCore 缺表／缺欄位問題的排查線索。

## 閱讀順序

1. 先讀 [`../index.md`](../index.md) 與 [`SKILL.md`](./SKILL.md)。
2. 區分歷史 PHP/MySQL 和現行 Worker/D1；Skill 中的 MySQL 指令及舊 migration 不可直接用於 D1 或遠端環境。
3. 現行 Worker 任務改依 `platform/worker/index.md`、目標 D1 Migration 與測試契約處理。

## 權限

不得僅憑 Skill 指令套用遠端 Migration、修改資料或執行 SQL；需先確認環境、影響、備份／回復策略及使用者授權。
