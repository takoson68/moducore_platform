# 前端共用元件

本目錄提供各 Project 可使用的前端元件。頁面決定元件位置與所需資料，平台能力仍由 World 提供。

- `LoginButton.vue`、`LoginModal.vue` 提供登入入口與對話框。
- `IndexedDbBackupButton.vue` 提供備份入口，可直接顯示按鈕，或把觸發屬性綁到自訂按鈕或連結。分類及上傳方法由 Project 提供。
- [`iDB_box.vue`](./iDB_box.vue) 提供單一備份入口、上傳與下載選項及版本清單。傳入 `state`（`busy`、`backups`、`status`、`error`），以 `upload`、`list`、`restore`、`close` 事件接上 Project 的備份流程。選取版本時，`restore` 會帶出該筆備份。
- `ThemeToggle.vue` 提供主題切換。
- `UiSlot.vue` 顯示已註冊的 UI 插槽。

使用範例見 [World 使用手冊](../world使用手冊.md)。
