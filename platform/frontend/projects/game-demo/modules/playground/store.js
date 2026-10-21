import projectConfig from '../../project.config.js';

// 建立只屬於這次遊戲的進度與分數狀態。
export function createPlaygroundStore(createStore) {
  return createStore({
    name: 'game-demo-session',
    defaultValue: { progress: 0, score: 0, laps: 0, mode: 'ready', error: '',
      showFps: projectConfig.game?.diagnostics?.showFps === true },
  });
}
