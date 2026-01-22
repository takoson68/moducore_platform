# Project B MVP Verification Checklist

本清單用於驗證 Project B 最小可用世界（MVP）是否成立，並作為平台演化的通關條件。

## 一、Boot / World 建立
- 切換至 Project B 時，不讀取 Project A 的 layout、routes、modules
- Reload 後 Project B 狀態一致且可重現
- boot 過程未執行任何 module init 或 side-effect

## 二、Layout 治理
- layout 來源為 `projects/project-b/layout/index.js`
- `src/App.vue` 未直接 import layout component
- RouterView 被 layout 正確包覆

## 三、Modules Registry
- 僅 `projects/project-b/modules/index.js` 宣告的模組可被 discover
- 未宣告模組不可被視為存在
- module existence 僅來自 `container.register`

## 四、Routing
- 模組 routes 正確注入
- 導覽與 RouterView 正確顯示 Project B 頁面
- route meta 不影響 Project A，不可跨世界污染

## 五、Store / 狀態邊界
- 僅存在平台級 store
- module store 未被建立或初始化

## 六、世界切換穩定性
- 從 Project B 切回 Project A：
  - layout、routes、modules 正常
  - 無殘留狀態或錯誤
