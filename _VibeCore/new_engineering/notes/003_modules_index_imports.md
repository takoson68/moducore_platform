# Observation

觀察對象：`@project/modules/index.js` 的被引用情況
實際行為描述：moduleDiscovery.js 與 modulesRegistry.js 皆以 `@project/modules/index.js` 匯入專案模組入口
出現位置：platform/frontend/projects/moduleDiscovery.js；platform/frontend/projects/modulesRegistry.js
重複次數：2
目前未觀察到的情況：platform/frontend/projects 內未觀察到其他檔案以 `@project/modules/index.js` 匯入
