import { createPlaygroundStore } from './store.js';
import { createP5Engine } from '@/gameEngines.js';
import { createPlaygroundSketch } from './sketch.js';

// 宣告遊戲狀態與循環服務，交由 Game 容器延遲建立。
export function createPlaygroundModule({ element, action, createStore }) {
  let session;
  return {
    name: 'playground',
    setup: {
      stores: {
        // 延遲建立模組狀態，不經過 World 或平台容器。
        session: () => createPlaygroundStore(createStore),
      },
      services: {
        // 模組選用 p5，將具體繪圖與互動定義交給適配器。
        engine: () => createP5Engine({ element, width: 1040, height: 840,
          label: '遊戲試玩室。Enter 開始或暫停，空白鍵得分，R 重新開始。',
          ...createPlaygroundSketch(session, action) }),
      },
    },
    // 初始化遊戲狀態參照。
    async init({ store, service }) {
      session = store('session');
      await service('engine').prepare();
    },
    // 進入遊戲時啟動循環。
    start({ service }) { service('engine').start(); },
    // 暫停循環但保留遊戲狀態。
    pause({ service }) {
      session.set({ mode: 'paused' });
      service('engine').stop();
      service('engine').redraw();
    },
    // 恢復原有循環。
    resume({ service }) {
      session.set({ mode: 'running' });
      service('engine').start();
    },
    // 結束時釋放循環。
    stop({ service }) { service('engine').stop(); },
  };
}
