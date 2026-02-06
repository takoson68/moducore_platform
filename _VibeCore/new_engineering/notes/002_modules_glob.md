# Observation

觀察對象：projects/*/modules/index.js 的模組掃描方式
實際行為描述：project-a、project-b、_proTemp 的 modules/index.js 皆使用 `import.meta.glob('./*/index.js')` 掃描同層模組目錄
出現位置：platform/frontend/projects/project-a/modules/index.js；platform/frontend/projects/project-b/modules/index.js；platform/frontend/projects/_proTemp/modules/index.js
重複次數：3
目前未觀察到的情況：platform/frontend/src/app/container 與 platform/frontend/src/app/stores 未達重複條件
