# Layout World — 視覺世界治理定義

World Version: v1.0  
Status: Active  
Layer: Project Layer  

---

## 0. 本文件地位

本文件定義：

- Layout 在 ModuCore Platform 中的合法層級
- Layout 與 Module 的責任邊界
- Layout 與 Core 的依賴方向
- Layout 不得侵犯之世界規則

任何違反本文件之依賴方向，  
視為世界退化。

---

## 1. 存在目的

Layout World 的目的：

> 將「UI 外觀治理權」收斂至 Project 層，  
> 並確保 Core 與 Module 保持純粹性。

Layout 是：

- 視覺策略層
- UI 外殼層
- Project 視覺語言定義者

Layout 不是：

- 功能層
- 權限層
- 能力層

---

## 2. 世界層級定位

三層責任分離：

Core World  
Project World（Layout 所在）  
Module World  

合法依賴方向：

Core  
↓  
Project（Layout）  
↓  
Module  
↓  
Page  

禁止任何反向依賴。

---

## 3. 合法目錄結構

```text
/projects/{project-name}/
  layout/
    index.js
    layouts/
      MainLayout.vue
      AuthLayout.vue
      PublicLayout.vue
```

---

## 4. Layout World 合法責任

Layout 只能負責：

### 4.1 提供 UI 外殼（Shell）

- header
- sidebar
- footer
- topbar
- slot container

### 4.2 提供 slot 位置

- default slot
- named slot
- layout wrapper

### 4.3 提供視覺策略

- theme
- dark/light
- spacing
- UI 結構佈局

---

## 5. Layout 絕對禁止事項

### 5.1 禁止載入 Module

```js
// ❌ 非法
import bookingModule from '@/modules/booking'
```

### 5.2 禁止主動解析 Container

```js
// ❌ 非法
container.resolve('bookingStore')
```

Layout 不是能力層。

### 5.3 禁止決定功能權限

- 不得判斷 public/auth
- 不得決定 module enable/disable

這些屬於 Module Metadata + Router。

---

## 6. Module 合法責任

Module：

- 自行選擇使用哪種 Layout
- 在 Page 層包裹 Layout
- 不得修改 Layout 全域策略

合法方式：

```vue
<script setup>
import MainLayout from '@/projects/project-a/layout/layouts/MainLayout.vue'
</script>

<template>
  <MainLayout>
    <section class="page-content">
      ...
    </section>
  </MainLayout>
</template>
```

---

## 7. Layout Registry（進階選用）

為避免硬式 import，可在 Project 層定義 Registry。

```js
// /layout/index.js
export const layoutRegistry = {
  main: () => import('./layouts/MainLayout.vue'),
  public: () => import('./layouts/PublicLayout.vue'),
  auth: () => import('./layouts/AuthLayout.vue')
}
```

Module Page 使用方式：

```vue
<script setup>
import { defineAsyncComponent } from 'vue'
import { layoutRegistry } from '@/projects/project-a/layout'

const Layout = defineAsyncComponent(layoutRegistry.public)
</script>

<template>
  <Layout>
    <section>...</section>
  </Layout>
</template>
```

Registry 僅屬於 Project World。

Core 不得參與。

---

## 8. 非法依賴判定標準

若出現以下任一情況：

- Core import layout
- Layout import module
- Layout resolve store
- Module 修改 layout 全域設定

視為世界退化。

---

## 9. 世界演化保護原則

Layout World 的存在，是為了：

- 保護 Core 純能力
- 保護 Module 純功能
- 允許不同 Project 共存不同 UI 策略
- 支援未來多世界、多主題、微前端

任何企圖將 UI 策略重新集中於 Core 的變更，  
必須經過 World Change Protocol。

---

## 10. 最終定義

Layout 是：

> Project 的視覺治理層

Module 是：

> 功能單元

Core 是：

> 能力運行層

三者不可混合角色。

---

## 11. 合法世界宣告

本文件確認：

Layout Governance 已從 Core 收回 Project。

此定義自 v1.0 起生效。

End of Layout World