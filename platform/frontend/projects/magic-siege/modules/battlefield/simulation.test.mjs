import assert from 'node:assert/strict';
import test from 'node:test';
import { createBattlefieldSimulation, createWaveSequence, waveConfig } from './simulation.js';

function createSession(overrides = {}) {
  const state = {
    selected: { col: 4, row: 4 }, mode: 'ready', previousMode: 'ready', wave: 1,
    lives: 20, gold: 100, towers: [], enemies: [], bullets: [], spawnIndex: 0,
    spawnClock: 0, incomeClock: 0, nextEnemyId: 1, nextBulletId: 1, kills: 0, notice: '', error: '',
    ...overrides,
  };
  return { state, set(values) { Object.assign(state, values); } };
}

test('第一波可由建塔開始並以擊殺或突破結束', () => {
  const session = createSession();
  const simulation = createBattlefieldSimulation(session);
  assert.equal(simulation.build(), true);
  assert.equal(session.state.gold, 90);
  assert.equal(simulation.startWave(), true);
  for (let frame = 0; frame < 2500 && session.state.mode === 'battle'; frame += 1) simulation.tick(0.02);
  assert.equal(session.state.mode, 'ready');
  assert.equal(session.state.wave, 2);
  assert.equal(session.state.kills + (20 - session.state.lives), 5);
  assert.equal(session.state.gold, 98 + session.state.kills * 5);
  assert.ok(session.state.kills > 0);
  assert.equal(session.state.enemies.length, 0);
  assert.equal(session.state.bullets.length, 0);
  assert.equal(session.state.waveSummary.kills, session.state.kills);
  assert.equal(session.state.waveSummary.kills + session.state.waveSummary.breaches, 5);
  assert.equal(session.state.waveSummary.livesLost, 20 - session.state.lives);
  assert.ok(session.state.towers[0].damage > 0);
  assert.ok(session.state.towers[0].kills > 0);
});

test('下一波開始時會重置本波快照，並保留上一波結算', () => {
  const session = createSession();
  const simulation = createBattlefieldSimulation(session);
  simulation.build();
  simulation.startWave();
  for (let frame = 0; frame < 2500 && session.state.mode === 'battle'; frame += 1) simulation.tick(0.02);
  const firstSummary = structuredClone(session.state.waveSummary);
  assert.equal(session.state.mode, 'ready');
  assert.equal(simulation.startWave(), true);
  assert.deepEqual(session.state.waveStats, { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 });
  assert.deepEqual(session.state.waveSummary, firstSummary);
});

test('升級與拆除依累計投資扣款及退款', () => {
  const session = createSession({ gold: 300 });
  const simulation = createBattlefieldSimulation(session);
  assert.equal(simulation.build(), true);
  assert.equal(simulation.upgrade(), true);
  assert.equal(simulation.upgrade(), true);
  assert.equal(simulation.upgrade(), false);
  assert.equal(session.state.towers[0].level, 3);
  assert.equal(session.state.gold, 90);
  assert.equal(simulation.sell(), true);
  assert.equal(session.state.gold, 195);
  assert.equal(session.state.towers.length, 0);
  assert.equal(simulation.build(), true);
});

test('被動收入在最後一隻生成後停止', () => {
  const session = createSession();
  const simulation = createBattlefieldSimulation(session);
  simulation.startWave();
  for (let second = 0; second < 10; second += 1) simulation.tick(1);
  const goldAfterSpawning = session.state.gold;
  simulation.tick(5);
  assert.equal(goldAfterSpawning, 108);
  assert.equal(session.state.gold, goldAfterSpawning);
});

test('暫停期間不推進敵人、出怪、子彈與冷卻', () => {
  const session = createSession();
  const simulation = createBattlefieldSimulation(session);
  simulation.build();
  simulation.startWave();
  simulation.tick(0.5);
  simulation.pause();
  const snapshot = structuredClone(session.state);
  simulation.tick(10);
  assert.deepEqual(session.state, snapshot);
  simulation.resume();
  simulation.tick(0.1);
  assert.notDeepEqual(session.state, snapshot);
});

test('加速只放大戰鬥時間，且可切回正常速度', () => {
  const normal = createSession();
  const fast = createSession();
  const normalSimulation = createBattlefieldSimulation(normal);
  const fastSimulation = createBattlefieldSimulation(fast);
  normalSimulation.startWave();
  fastSimulation.startWave();
  assert.equal(fastSimulation.setSpeed(4), true);
  normalSimulation.tick(1);
  fastSimulation.tick(1);
  assert.equal(fast.state.enemies[0].distance > normal.state.enemies[0].distance, true);
  assert.equal(fastSimulation.setSpeed(1), true);
  assert.equal(fast.state.speed, 1);
  assert.equal(fastSimulation.setSpeed(8), false);
});

test('同一格不能重複建塔或重複扣款', () => {
  const session = createSession();
  const simulation = createBattlefieldSimulation(session);
  assert.equal(simulation.build(), true);
  assert.equal(simulation.build(), false);
  assert.equal(session.state.gold, 90);
  assert.equal(session.state.towers.length, 1);
});

test('十波敵人數量、類型與順序固定可重現', () => {
  for (let wave = 1; wave <= 10; wave += 1) {
    const first = createWaveSequence(wave);
    const second = createWaveSequence(wave);
    assert.deepEqual(first, second);
    assert.equal(first[0], 'small');
    assert.equal(first.filter((type) => type === 'small').length, waveConfig[wave].small);
    assert.equal(first.filter((type) => type === 'large').length, waveConfig[wave].large);
  }
});

test('第十波完成進入勝利，基地歸零時失敗優先', () => {
  const victorySession = createSession({ wave: 10, mode: 'battle', spawnIndex: 35,
    enemies: [{ id: 1, type: 'small', hp: 0, maxHp: 50, distance: 100 }], nextEnemyId: 2 });
  createBattlefieldSimulation(victorySession).tick(0.02);
  assert.equal(victorySession.state.mode, 'victory');

  const defeatSession = createSession({ wave: 10, mode: 'battle', lives: 1, spawnIndex: 35,
    enemies: [{ id: 1, type: 'small', hp: 50, maxHp: 50, distance: 100000 }], nextEnemyId: 2 });
  createBattlefieldSimulation(defeatSession).tick(0.02);
  assert.equal(defeatSession.state.mode, 'defeat');
});

test('固定布防可完整通過十波並進入勝利結局', () => {
  const session = createSession({
    gold: 4000,
    towers: Array.from({ length: 12 }, (_, index) => ({
      col: index % 6, row: index < 6 ? 1 : 6, level: 3, spent: 210,
      cooldown: 0, targetId: null, damage: 0, kills: 0,
    })),
  });
  const simulation = createBattlefieldSimulation(session);
  for (let wave = 1; wave <= 10; wave += 1) {
    assert.equal(session.state.wave, wave);
    assert.equal(simulation.startWave(), true);
    for (let frame = 0; frame < 20000 && session.state.mode === 'battle'; frame += 1) simulation.tick(0.02);
    assert.notEqual(session.state.mode, 'defeat');
    if (wave < 10) assert.equal(session.state.mode, 'ready');
  }
  assert.equal(session.state.mode, 'victory');
  assert.equal(session.state.wave, 10);
  assert.equal(session.state.waveSummary.kills > 0, true);
});
