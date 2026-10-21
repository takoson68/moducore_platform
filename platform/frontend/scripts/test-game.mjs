import test from 'node:test';
import assert from 'node:assert/strict';
import Game from '../src/game.js';
import { container as platformContainer } from '../src/app/container/container.js';

// 驗證共用工廠建立的狀態僅由遊戲容器持有，重開不沿用舊狀態。
test('Game 狀態工廠不註冊至平台容器', async () => {
  const game = new Game();
  const before = platformContainer.list();
  const module = { name: 'session', setup: { stores: {
    session: () => game.createStore({ name: 'test-session', defaultValue: { score: 0 } }),
  } } };
  await game.start({ modules: [module] });
  const old = game.store('session');
  old.set({ score: 10 });
  assert.equal(old.state.score, 10);
  assert.deepEqual(platformContainer.list(), before);
  await game.reset();
  assert.notEqual(game.store('session'), old);
  assert.equal(game.store('session').state.score, 0);
  assert.deepEqual(platformContainer.list(), before);
  await game.dispose();
});

// 驗證反向註冊的延遲解析、遊戲隔離及重開清理。
test('各遊戲獨立解析能力，重開建立新狀態且不影響平台', async () => {
  let created = 0;
  let disposed = 0;
  const module = {
    name: 'player',
    setup: { stores: { player: () => {
      created++;
      return { hp: 20, dispose() { disposed++; } };
    } } },
  };
  const first = new Game();
  const second = new Game();
  const before = platformContainer.list();
  await first.start({ modules: [module] });
  await second.start({ modules: [module] });
  assert.equal(created, 0);
  const old = first.store('player');
  old.hp = 5;
  assert.equal(first.store('player'), old);
  assert.equal(second.store('player').hp, 20);
  await first.reset();
  assert.equal(disposed, 1);
  assert.notEqual(first.store('player'), old);
  assert.equal(first.store('player').hp, 20);
  assert.deepEqual(platformContainer.list(), before);
  await first.dispose();
  await second.dispose();
  assert.equal(disposed, 3);
});

// 驗證繼承、生命週期順序與重複啟動保護。
test('遊戲可繼承 Game，依序啟動並反向清理', async () => {
  class TowerDefenseGame extends Game {}
  const game = new TowerDefenseGame();
  const calls = [];
  const modules = ['a', 'b'].map(name => Object.fromEntries([
    ['name', name],
    ...['init', 'start', 'pause', 'resume', 'stop', 'dispose'].map(hook => [hook, () => calls.push(`${name}:${hook}`)]),
  ]));
  await Promise.all([game.start({ modules }), game.start()]);
  await game.pause();
  assert.equal(game.phase, 'paused');
  await game.resume();
  await game.dispose();
  assert.deepEqual(calls, ['a:init', 'b:init', 'a:start', 'b:start', 'a:pause', 'b:pause', 'a:resume', 'b:resume', 'b:stop', 'a:stop', 'b:dispose', 'a:dispose']);
  assert.equal(game.phase, 'disposed');
});

// 驗證部分初始化失敗仍清理，並允許重新建立。
test('初始化失敗清理已進入的模組與實例', async () => {
  const game = new Game();
  const calls = [];
  await assert.rejects(game.start({ modules: [{
    name: 'broken',
    setup: { services: { engine: () => ({ dispose() { calls.push('instance'); } }) } },
    init({ service }) { service('engine'); throw new Error('init failed'); },
    dispose() { calls.push('module'); },
  }] }), /init failed/);
  assert.equal(game.phase, 'error');
  assert.deepEqual(calls, ['module', 'instance']);
  assert.equal(game.list().instances.length, 0);
  await game.start({ modules: [] });
  assert.equal(game.phase, 'running');
  await game.dispose();
});

// 驗證單一資源清理失敗不阻止其他資源清理。
test('清理失敗仍釋放其他實例', async () => {
  const game = new Game();
  let cleaned = false;
  await game.start({ modules: [{ name: 'resources', setup: { services: {
    bad: () => ({ dispose() { throw new Error('dispose failed'); } }),
    good: () => ({ dispose() { cleaned = true; } }),
  } } }] });
  game.service('bad');
  game.service('good');
  await assert.rejects(game.stop(), AggregateError);
  assert.equal(cleaned, true);
  assert.equal(game.phase, 'error');
  assert.equal(game.list().instances.length, 0);
  await game.dispose();
});
