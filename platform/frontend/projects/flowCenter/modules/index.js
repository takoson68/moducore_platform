import { createModuleRuntime } from '../../moduleRuntime.js'
import { listRoutes } from '@/app/container/index.js'

const modules = import.meta.glob('./*/index.js')
const runtime = createModuleRuntime(modules)

export const { moduleLoaders, listModules, installModules } = runtime

export function loadModules(allowList = []) {
  return runtime.loadModules(allowList)
}

export function buildModuleRoutes() {
  return {
    routes: [...listRoutes()]
  }
}
