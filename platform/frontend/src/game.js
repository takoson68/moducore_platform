import { createGameContainer, registerGameModules, destroyGameContainer } from './app/game/container.js';
import { runGameHooks } from './app/game/lifecycle.js';
import { createStore as createCoreStore } from './app/stores/_storeFactory.js';

export class Game {
  // 組合遊戲管理功能，容器僅承擔能力註冊與解析。
  constructor() {
    this.phase = 'idle';
    this._container = createGameContainer();
    this._modules = [];
    this._active = [];
    this._queue = Promise.resolve();
    this._context = Object.freeze({
      store: (name) => this.store(name),
      service: (name) => this.service(name),
    });
  }

  // 將生命週期操作排隊，避免啟動、重置與卸載交錯。
  _enqueue(action) {
    const result = this._queue.then(action);
    this._queue = result.catch(() => {});
    return result;
  }

  // 註冊模組並依序初始化及啟動，重複啟動保持原實例。
  start({ modules } = {}) {
    return this._enqueue(async () => {
      if (this.phase === 'running') return;
      if (this.phase === 'paused') throw new Error('[Game] 暫停後請使用 resume');
      if (modules !== undefined) {
        if (!Array.isArray(modules)) throw new TypeError('[Game] modules 必須為陣列');
        this._modules = [...modules];
      }
      await this._boot();
    });
  }

  // 組合註冊、初始化及啟動流程，失敗時清理已進入的模組。
  async _boot() {
    this.phase = 'starting';
    try {
      registerGameModules(this._container, this._modules);
      for (const module of this._modules) {
        this._active.push(module);
        await module.init?.(this._context);
      }
      await runGameHooks(this._active, 'start', this._context);
      this.phase = 'running';
    } catch (error) {
      try {
        await this._cleanup();
      } catch (cleanupError) {
        this.phase = 'error';
        throw new AggregateError([error, cleanupError], '[Game] 啟動與清理失敗');
      }
      this.phase = 'error';
      throw error;
    }
  }

  // 暫停遊戲，實際引擎行為委派給模組。
  pause() {
    return this._transition('running', 'paused', 'pause');
  }

  // 恢復暫停中的遊戲。
  resume() {
    return this._transition('paused', 'running', 'resume');
  }

  // 檢查狀態後執行轉移，失敗時停止並清理。
  _transition(from, to, hook) {
    return this._enqueue(async () => {
      if (this.phase === to) return;
      if (this.phase !== from) throw new Error(`[Game] ${this.phase} 無法執行 ${hook}`);
      try {
        await runGameHooks(this._active, hook, this._context);
        this.phase = to;
      } catch (error) {
        try {
          await this._cleanup();
        } finally {
          this.phase = 'error';
        }
        throw error;
      }
    });
  }

  // 清理目前執行資源，保留模組宣告供下次啟動。
  stop() {
    return this._enqueue(async () => {
      await this._cleanup();
      this.phase = 'stopped';
    });
  }

  // 重建遊戲實例並重新啟動，保留原有模組宣告。
  reset() {
    return this._enqueue(async () => {
      await this._cleanup();
      await this._boot();
    });
  }

  // 清除全部遊戲資源及模組宣告，可再次建立新遊戲。
  dispose() {
    return this._enqueue(async () => {
      try {
        await this._cleanup();
        this.phase = 'disposed';
      } finally {
        this._modules = [];
      }
    });
  }

  // 反向釋放模組及容器，個別錯誤不阻止其餘清理。
  async _cleanup() {
    const errors = [];
    for (const hook of ['stop', 'dispose']) {
      try {
        await runGameHooks(this._active, hook, this._context, { reverse: true, cleanup: true });
      } catch (error) {
        errors.push(error);
      }
    }
    this._active = [];
    try {
      destroyGameContainer(this._container);
    } catch (error) {
      errors.push(error);
    }
    this._container = createGameContainer();
    if (errors.length) {
      this.phase = 'error';
      throw new AggregateError(errors, '[Game] 遊戲清理失敗');
    }
  }

  // 提供共用狀態工廠，實例由遊戲模組註冊並歸遊戲容器管理。
  createStore(options) {
    return createCoreStore(options);
  }

  // 取得容器中已註冊的遊戲狀態。
  store(name) {
    return this._container.resolve(`stores:${name}`);
  }

  // 取得容器中已註冊的遊戲服務。
  service(name) {
    return this._container.resolve(`services:${name}`);
  }

  // 提供遊戲能力的註冊與實例觀察資訊。
  list() {
    return this._container.list();
  }
}

export default Game;
