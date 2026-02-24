# Convention
本文件不宣告有效行為邊界，
僅作為 Boundary 文件的推導依據與假說來源。

Title: Function Comment Requirement (Traditional Chinese)
Status: candidate
Scope: platform

## 目的
- 提升 AI / Codex 產出程式碼的可讀性。
- 降低後續維護時的理解成本。
- 讓函式責任在程式碼附近被明確說明。

## 規則
- AI / Codex 產出的程式碼中，新增或修改的函式，應在函式正上方加上繁體中文用途註解。

## 適用範圍
- `function foo() {}`
- `const foo = () => {}`
- class methods
- object methods
- exported functions

## 最低註解標準
- 說明這個函式在做什麼（主要責任）
- 必要時補充：何時被呼叫／重要限制（若不寫會造成誤解時）

## 格式建議
- 使用繁體中文
- 註解放在函式正上方
- 內容簡短、具體，避免重述程式碼表面動作

範例：
```js
// 讀取使用者資料並轉成畫面可用格式
function buildUserViewModel(user) {
  ...
}
```

## 非目標
- 不要求每一行都加註解
- 不要求撰寫重複程式碼表面的註解（例如「把值指定給變數」）
- 不要求為第三方套件原始碼補註解

## 例外
- 使用者明確要求不要加註解時，可遵照使用者指示。
- 極短且語意完全自明的內聯 callback（例如單行 `map/filter`）可省略，但外層主函式仍需註解。
