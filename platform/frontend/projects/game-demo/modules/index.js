import { createModuleRuntime } from '../../moduleRuntime.js';

const runtime = createModuleRuntime(import.meta.glob('./*/index.js'));
export const { moduleLoaders, listModules, loadModules, installModules } = runtime;
