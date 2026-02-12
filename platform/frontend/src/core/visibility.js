/**
 * resolveWorldVisibility
 * Core visibility rule used during world boot.
 */
export function resolveWorldVisibility({ discovered, platformConfig, userContext }) {
  const list = Array.isArray(discovered) ? discovered : []
  const declaredModules = Array.isArray(platformConfig?.modules) ? new Set(platformConfig.modules) : null
  const isAuthenticated = Boolean(userContext?.isAuthenticated)

  return list.filter((mod) => {
    if (!mod?.name) return false
    if (declaredModules && !declaredModules.has(mod.name)) return false

    const access = mod.meta?.access
    if (!access) return true
    if (access.public === true) return true
    if (access.auth === true && isAuthenticated) return true
    return false
  })
}
