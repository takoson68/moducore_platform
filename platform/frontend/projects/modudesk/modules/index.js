import { createModuleRuntime } from '../../moduleRuntime.js'
import { listRoutes } from '@/app/container/index.js'
import projectConfig from '../project.config.js'

const modules = import.meta.glob('./*/index.js')

function isModuleEnabled(name) {
  if (name !== 'tasks') return true
  return projectConfig?.features?.tasks !== false
}

function createTaskDisabledRoutes() {
  if (isModuleEnabled('tasks')) return []

  return [
    {
      path: '/tasks',
      name: 'tasks-disabled',
      redirect: '/calendar',
      meta: {
        access: { public: true, auth: false },
      },
    },
  ]
}

const runtime = createModuleRuntime(modules, {
  isModuleEnabled,
  beforeInstall({ register }) {
    register.routes(createTaskDisabledRoutes(), { moduleName: 'tasks-disabled' })
  },
})

export const { moduleLoaders, listModules, installModules } = runtime

export function loadModules(allowList = []) {
  return runtime.loadModules(allowList)
}

export function buildModuleRoutes() {
  return {
    routes: [...listRoutes()]
  }
}

