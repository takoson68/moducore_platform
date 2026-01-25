//- src/app/layout/discoverLayout.js
import { markRaw } from 'vue'

const layoutDefinitions = import.meta.glob('../../../projects/*/layout/index.js')

function getLayoutLoader(projectName) {
  const key = `../../../projects/${projectName}/layout/index.js`
  return layoutDefinitions[key]
}

export async function discoverLayout(projectConfig) {
  const projectName = projectConfig?.name
  if (!projectName) {
    throw new Error('[Layout] Missing project name')
  }

  const loader = getLayoutLoader(projectName)
  if (!loader) {
    throw new Error(`[Layout] Missing layout definition for project "${projectName}"`)
  }

  const mod = await loader()
  const defineLayout = mod?.defineLayout ?? mod?.default
  if (typeof defineLayout !== 'function') {
    throw new Error(`[Layout] defineLayout not found for project "${projectName}"`)
  }

  const layout = await defineLayout()
  if (!layout || !layout.component) {
    throw new Error(`[Layout] Invalid layout definition for project "${projectName}"`)
  }

  return {
    ...layout,
    component: markRaw(layout.component)
  }
}
