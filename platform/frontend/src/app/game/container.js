import { Container } from '../container/container.js';

// 建立遊戲私有容器，不沿用平台的共用服務實例。
export function createGameContainer() {
  return new Container({ services: {} });
}

// 將模組宣告的工廠反向註冊至指定容器。
export function registerGameModules(container, modules) {
  const names = new Set();
  for (const module of modules) {
    if (!module?.name || names.has(module.name)) {
      throw new Error('[Game] 模組名稱必須存在且不可重複');
    }
    names.add(module.name);
    for (const kind of ['stores', 'services']) {
      for (const [name, factory] of Object.entries(module.setup?.[kind] || {})) {
        const key = `${kind}:${name}`;
        if (container.moduleFactories.has(key)) {
          throw new Error(`[Game] 能力重複註冊：${key}`);
        }
        container.register(key, factory);
      }
    }
  }
}

// 即使部分實例清理失敗，也繼續釋放其餘實例與註冊。
export function destroyGameContainer(container) {
  const errors = [];
  for (const name of [...container.moduleFactories.keys()]) {
    try {
      container.unregister(name);
    } catch (error) {
      errors.push(error);
    } finally {
      container.instances.delete(name);
    }
  }
  container.destroy();
  if (errors.length) throw new AggregateError(errors, '[Game] 容器清理失敗');
}
