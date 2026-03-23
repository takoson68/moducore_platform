import world from '@/world.js'

export function createModuleRuntime(modules, { isModuleEnabled = () => true, beforeInstall = null } = {}) {
  const moduleLoaders = Object.fromEntries(
    Object.entries(modules)
      .filter(([modulePath]) => !modulePath.includes('/_archive/'))
      .map(([modulePath, loader]) => {
        const name = modulePath.split('/')[1]
        return [name, loader]
      })
  )

  const loadedModules = new Map()
  const installedModules = new Set()

  function resolveAllowedNames(allowList = []) {
    const allowSet = Array.isArray(allowList) && allowList.length > 0
      ? new Set(allowList)
      : null

    return Object.keys(moduleLoaders).filter((name) => {
      if (!isModuleEnabled(name)) return false
      if (allowSet && !allowSet.has(name)) return false
      return true
    })
  }

  async function loadModule(name) {
    if (loadedModules.has(name)) {
      return loadedModules.get(name)
    }

    const loader = moduleLoaders[name]
    if (typeof loader !== 'function') {
      return null
    }

    const imported = await loader()
    const moduleDefinition = imported?.default || null
    loadedModules.set(name, moduleDefinition)
    return moduleDefinition
  }

  async function loadModules(allowList = []) {
    const allowedNames = resolveAllowedNames(allowList)
    const modulesMap = new Map()

    for (const name of allowedNames) {
      modulesMap.set(name, await loadModule(name))
    }

    return modulesMap
  }

  function listModules() {
    return Object.keys(moduleLoaders)
      .filter((name) => isModuleEnabled(name))
      .map((name) => ({ name }))
  }

  async function installModules({ register }, { allowList = [] } = {}) {
    if (typeof beforeInstall === 'function') {
      await beforeInstall({ register, allowList })
    }

    const modulesMap = await loadModules(allowList)

    for (const [name, mod] of modulesMap.entries()) {
      if (!mod || installedModules.has(name)) continue

      const setup = mod.setup || {}
      const { stores, routes, ui } = setup

      if (stores && typeof stores === 'object') {
        for (const [storeName, factory] of Object.entries(stores)) {
          if (!storeName || typeof factory !== 'function') continue
          register.store(storeName, factory)
        }
      }

      if (Array.isArray(routes)) {
        register.routes(routes, { moduleName: name })
      }

      if (ui?.slots && typeof ui.slots === 'object') {
        for (const [slotName, descriptor] of Object.entries(ui.slots)) {
          if (Array.isArray(descriptor)) {
            descriptor.forEach((item) => world.registerUISlot(slotName, item))
          } else {
            world.registerUISlot(slotName, descriptor)
          }
        }
      }

      installedModules.add(name)
    }
  }

  return {
    moduleLoaders,
    loadModules,
    listModules,
    installModules
  }
}
