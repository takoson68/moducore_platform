//- projects/moduleDiscovery.js
import * as registry from '@project/modules/index.js'

function normalizeDeclared(declared) {
  if (!Array.isArray(declared)) {
    return null
  }

  return declared.map(entry => {
    if (typeof entry === 'string') {
      return { name: entry }
    }
    return entry
  })
}

export function discoverModules(projectConfig) {
  const registryList = typeof registry?.listModules === 'function'
    ? registry.listModules()
    : null
  const declared = normalizeDeclared(registryList ?? projectConfig?.modules ?? [])

  if (!declared) {
    throw new Error('[World] project modules registry must be an array')
  }

  // 世界只做一件事：知道有哪些「被宣告的模組」
  return declared.map(entry => ({
    name: entry.name,
    status: 'declared'
  }))
}
