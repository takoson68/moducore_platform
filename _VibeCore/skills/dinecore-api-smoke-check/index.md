# DineCore API Smoke Skill 索引

## 範圍

本 Skill 用於對 DineCore API 做唯讀健康檢查與故障分流。

## 閱讀順序

1. 先讀 [`../index.md`](../index.md)。
2. 再讀 [`SKILL.md`](./SKILL.md) 的前置條件、檢查路徑及安全限制。
3. 依目前環境確認 API base URL、認證方式與測試帳戶；不可直接照抄歷史 endpoint。

## 權限

Smoke 預設唯讀；登入或測試若會建立／改變資料，先確認其對象與清理方式。Skill 不授權 Production 操作。
