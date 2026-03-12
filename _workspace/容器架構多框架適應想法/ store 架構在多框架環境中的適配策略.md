# 容器模式跨框架適配結論（Vue / React）

日期：2026-03-11  
主題：容器 / store 架構在多框架環境中的適配策略

---

# 一、核心結論

容器模式（container + store）本身 **完全可以跨框架使用**。

真正需要適配的不是：

- container
- store core
- module system

而是 **UI 框架的更新機制**。

因此正確架構應該是：

```
Store Core
    ↓
Framework Adapter
    ↓
Framework Consumer
```

也就是：

```
container store core
        ↓
vue adapter
react adapter
```

---

# 二、Vue 與 React 差異本質

## Vue 更新模型

Vue 透過 **reactive 系統**自動追蹤資料。

```
state mutation
      ↓
reactive proxy
      ↓
component update
```

因此 Vue store 可以直接：

```
store.set('user.name', 'Tom')
```

component 會自動更新。

---

## React 更新模型

React 不追蹤物件變化。

React 只知道：

```
state change → re-render
```

因此 **外部 store 必須通知 React**。

React 官方推薦方式：

```
subscribe
+
useSyncExternalStore
```

流程：

```
store mutation
     ↓
listeners notify
     ↓
useSyncExternalStore
     ↓
React re-render
```

---

# 三、React 為何多一層

Vue：

```
store → component
```

React：

```
store → hook adapter → component
```

這個 **hook adapter 就是 React bridge**。

因此 React 會多一層：

```
subscribe
+
hook
```

---

# 四、解決方案：工廠模式封裝

既然 React 需要 hook bridge，  
可以使用 **工廠模式統一封裝 adapter**。

概念：

```
store core
    ↓
adapter factory
    ↓
framework-specific store
```

---

# 五、跨框架 Store 架構

建議結構：

```
store
│
├ core
│   └ storeCore.js
│
├ adapters
│   ├ vue
│   │   └ vueStoreAdapter.js
│   │
│   └ react
│       └ createReactStoreHook.js
│
└ _storeFactory.js
```

---

# 六、Store Core Contract

核心 store 必須保持 **框架無關**。

最小 contract：

```
{
  getState,
  setState,
  subscribe,
  reset
}
```

核心只負責：

- state
- mutation
- listeners
- persistence
- migration

**不可依賴**

- Vue API
- React API

---

# 七、Vue Adapter

Vue adapter 負責：

- reactive
- computed
- watch

範例概念：

```
export function createVueAdapter(storeCore, reactive) {

  const state = reactive(storeCore.getState())

  storeCore.subscribe((nextState) => {
    Object.assign(state, nextState)
  })

  return {
    state,
    setState: storeCore.setState
  }
}
```

---

# 八、React Adapter

React adapter 負責：

- subscribe
- snapshot
- hook

範例概念：

```
export function createReactAdapter(storeCore) {

  return function useStore(selector = (s) => s) {

    const snapshot = useSyncExternalStore(
      storeCore.subscribe,
      storeCore.getState
    )

    return selector(snapshot)
  }
}
```

---

# 九、Store Factory

將 core 與 adapter 組裝。

```
export function createStoreFactory(createStoreCore, adapters) {

  return function createStore(options) {

    const core = createStoreCore(options)

    return {
      core,
      vue: adapters.vue?.(core, options),
      react: adapters.react?.(core, options)
    }
  }
}
```

---

# 十、使用方式

## Vue

```
const userStore = createStore()

const { state, setState } = userStore.vue

setState({
  name: 'Alice'
})
```

---

## React

```
const { state, setState } = userStore.react.useStore()

setState({
  name: 'Alice'
})
```

---

# 十一、架構優勢

此設計帶來幾個重要優點：

### 1. Core 不綁框架

```
store core
= pure javascript
```

可在：

- Vue
- React
- Node
- 測試環境

共用。

---

### 2. Adapter 可替換

如果未來需要支援：

- Svelte
- Solid
- Web Components

只需新增 adapter。

```

store core
    ↓
svelte adapter
```

---

### 3. 模組架構更乾淨

模組只需要依賴：

```
store contract
```

而不是依賴框架。

---

### 4. 平台級架構成立

此設計使平台變成：

```
Framework Agnostic Platform
```

UI 框架只是：

```
Rendering Adapter
```

---

# 十二、最終結論

React 與 Vue 在 store 使用上的差異：

```

Vue
store → component

React
store → hook adapter → component

```

React 多出的這一層 **hook adapter**  
可以透過 **工廠模式封裝**。

因此最終架構為：

```

Store Core
    ↓
Adapter Factory
    ↓
Vue Store / React Hook

```

這樣即可保持：

- **同一套 store core**
- **同一套 container 思維**
- **不同框架各自適配**

同時達成：

```

跨框架容器模式
Framework agnostic store
```
