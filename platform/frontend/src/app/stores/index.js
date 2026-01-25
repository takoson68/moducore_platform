//- src/app/stores/index.js
import { createAuthStore } from './authStore.js'
import { createLifecycleStore } from './lifecycleStore.js'
import { createModuleStore } from './moduleStore.js'
import { createPlatformConfigStore } from './platformConfigStore.js'
import { createTokenStore } from './tokenStore.js'

export const coreStoreFactories = {
  auth: createAuthStore,
  lifecycle: createLifecycleStore,
  module: createModuleStore,
  platformConfig: createPlatformConfigStore,
  token: createTokenStore
}
