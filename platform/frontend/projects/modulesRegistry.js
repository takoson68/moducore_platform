//- projects/modulesRegistry.js
const registries = import.meta.glob('./*/modules/index.js', { eager: true })

export function getProjectModuleRegistry(projectName) {
  const match = Object.entries(registries).find(([path]) =>
    path === `./${projectName}/modules/index.js`
  )

  if (!match) {
    return null
  }

  const [, mod] = match
  return mod
}
