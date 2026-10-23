export function createBattlefieldStore(createStore) {
  return createStore({
    name: 'magic-siege-battlefield',
    defaultValue: {
      selected: { col: 4, row: 4 }, level: 1,
      mode: 'ready', previousMode: 'ready', wave: 1, lives: 20, gold: 100,
      towers: [], enemies: [], bullets: [], spawnIndex: 0, spawnClock: 0, incomeClock: 0,
      nextEnemyId: 1, nextBulletId: 1, kills: 0, speed: 1,
      waveStats: { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 },
      waveSummary: null,
      notice: '選擇可建造格，建造第一座魔法塔。', error: '',
    },
  });
}
