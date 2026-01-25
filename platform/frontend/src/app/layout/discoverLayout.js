//- src/app/layout/discoverLayout.js
import { markRaw } from 'vue'
import * as layoutModule from '@project/layout/index.js'

export async function discoverLayout(projectConfig) {
  if (!projectConfig?.name) {
    throw new Error('[Layout] Missing project name')
  }

  const defineLayout = layoutModule?.defineLayout
  if (typeof defineLayout !== 'function') {
    throw new Error(`[Layout] defineLayout not found for project "${projectConfig.name}"`)
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
