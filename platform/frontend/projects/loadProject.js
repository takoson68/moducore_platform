//- projects/loadProject.js
// 只負責「載入 project」，不負責任何世界規則
export async function loadProjectConfig() {
  // Vite 依 VITE_PROJECT 將 alias 指向唯一設定，避免每個成品都產生
  // 其他 Project 的 config chunk；保留動態匯入作為啟動邊界。
  const mod = await import('project-config-entry')
  return mod.default ?? mod
}

