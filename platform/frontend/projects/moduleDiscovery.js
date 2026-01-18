export function discoverModules(projectConfig) {
  const declared = projectConfig.modules ?? []

  if (!Array.isArray(declared)) {
    throw new Error('[World] project.modules must be an array')
  }

  // 世界只做一件事：知道有哪些「被宣告的模組」
  return declared.map(name => ({
    name,
    status: 'declared'
  }))
}
