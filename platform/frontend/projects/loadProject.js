// 只負責「載入 project」，不負責任何世界規則
export async function loadProjectConfig() {
  const name = import.meta.env.VITE_PROJECT || 'project-a'

  // Vite 的動態 import 必須能在 build 時被解析到候選集合
  // 用明確的 map 最穩（也最符合你「世界可裁決」的精神）
  const loaders = {
    'project-a': () => import('./project-a/project.config.js'),
    'project-b': () => import('./project-b/project.config.js'),
  }

  const loader = loaders[name]
  if (!loader) {
    throw new Error(`[ProjectLoader] Unknown project: "${name}"`)
  }

  const mod = await loader()
  return mod.default ?? mod
}

