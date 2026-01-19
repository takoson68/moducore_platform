//- loadProject.js 
// 只負責「載入 project」，不負責任何世界規則
export async function loadProjectConfig() {
  const name = import.meta.env.VITE_PROJECT || 'project-a'

  // 由 Vite 掃描 projects/*/project.config.js 作為候選集合
  const modules = import.meta.glob('./*/project.config.js')
  const loaders = Object.fromEntries(
    Object.entries(modules).map(([file, loader]) => {
      const match = file.match(/^\.\/([^/]+)\/project\.config\.js$/)
      return match ? [match[1], loader] : null
    }).filter(Boolean),
  )

  const loader = loaders[name]
  if (!loader) {
    throw new Error(`[ProjectLoader] Unknown project: "${name}"`)
  }

  const mod = await loader()
  return mod.default ?? mod
}

