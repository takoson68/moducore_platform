# Gemini 專案入口

本檔是 Gemini 使用的相容入口，不複製 Repository 規則，避免與通用入口失同步。

1. 所有新任務與上下文恢復一律先讀根目錄 [`AGENTS.md`](./AGENTS.md)，依任務路由載入最小必要文件。
2. VibeCore 世界的唯一裁決入口仍是 [`_VibeCore/RootIndex.md`](./_VibeCore/RootIndex.md)；正式規則依其索引導讀。
3. 本檔不新增技術棧、程式風格、權限或部署規則。若本檔與 `AGENTS.md`、RootIndex 或正式 Engineering 文件有任何不同，以正式導讀鏈為準，並修正本轉址文件而非複製另一套規則。

完整 Repository 知識與任務關鍵字路由均由 `AGENTS.md` 維護。
