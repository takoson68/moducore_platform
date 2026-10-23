import { board } from './layout.js';

const routeCells = [[0, 2], [5, 2], [5, 5], [9, 5], [9, 7], [10, 7], [10, 5], [11, 5]];
const route = routeCells.map(([col, row]) => ({
  x: board.x + col * board.cell + board.cell / 2,
  y: board.y + row * board.cell + board.cell / 2,
}));
const segments = route.slice(1).map((point, index) => ({
  from: route[index], to: point,
  length: Math.hypot(point.x - route[index].x, point.y - route[index].y),
}));
const routeLength = segments.reduce((sum, segment) => sum + segment.length, 0);
export const towerLevels = {
  1: { damage: 10, cooldown: 1, range: 140, cost: 10 },
  2: { damage: 18, cooldown: 0.8, range: 120, cost: 75 },
  3: { damage: 30, cooldown: 0.6, range: 145, cost: 125 },
};
export const waveConfig = [
  null,
  { small: 5, large: 0 }, { small: 8, large: 0 }, { small: 8, large: 1 },
  { small: 10, large: 2 }, { small: 12, large: 3 }, { small: 14, large: 4 },
  { small: 16, large: 5 }, { small: 18, large: 6 }, { small: 20, large: 8 },
  { small: 25, large: 10 },
];
export const enemyTypes = {
  small: { hp: 50, speed: 55, radius: 14, reward: 5, breachDamage: 1 },
  large: { hp: 180, speed: 32, radius: 20, reward: 20, breachDamage: 3 },
};

export function createWaveSequence(wave) {
  const config = waveConfig[wave];
  if (!config) return [];
  const total = config.small + config.large;
  const largePositions = new Set();
  for (let index = 1; index <= config.large; index += 1) {
    largePositions.add(Math.max(1, Math.round(index * total / (config.large + 1))));
  }
  return Array.from({ length: total }, (_, index) => largePositions.has(index) ? 'large' : 'small');
}

export function routePosition(distance) {
  let remaining = Math.max(0, distance);
  for (const segment of segments) {
    if (remaining <= segment.length) {
      const ratio = segment.length ? remaining / segment.length : 0;
      return { x: segment.from.x + (segment.to.x - segment.from.x) * ratio,
        y: segment.from.y + (segment.to.y - segment.from.y) * ratio };
    }
    remaining -= segment.length;
  }
  return { ...route.at(-1) };
}

export function createBattlefieldSimulation(session) {
  const update = (values) => session.set(values);
  const spawn = () => {
    const state = session.state;
    const sequence = createWaveSequence(state.wave);
    if (state.spawnIndex >= sequence.length) return;
    const type = sequence[state.spawnIndex];
    const stats = enemyTypes[type];
    update({ enemies: [...state.enemies, { id: state.nextEnemyId, type, hp: stats.hp, maxHp: stats.hp, distance: 0 }],
      spawnIndex: state.spawnIndex + 1, nextEnemyId: state.nextEnemyId + 1 });
  };
  const build = () => {
    const state = session.state;
    if (!state.selected) return false;
    const { col, row } = state.selected;
    if (state.gold < 10 || state.towers.some((item) => item.col === col && item.row === row)) return false;
    update({ towers: [...state.towers, { col, row, level: 1, spent: 10, cooldown: 0, targetId: null, damage: 0, kills: 0 }], gold: state.gold - 10,
      notice: 'Lv.1 魔法塔建造完成。' });
    return true;
  };
  const selectedTowerIndex = () => session.state.selected ? session.state.towers.findIndex((tower) =>
    tower.col === session.state.selected.col && tower.row === session.state.selected.row) : -1;
  const upgrade = () => {
    const state = session.state;
    const index = selectedTowerIndex();
    if (index < 0) return false;
    const tower = state.towers[index];
    if (tower.level >= 3) return false;
    const next = towerLevels[tower.level + 1];
    if (state.gold < next.cost) return false;
    const towers = [...state.towers];
    towers[index] = { ...tower, level: tower.level + 1, spent: tower.spent + next.cost };
    update({ towers, gold: state.gold - next.cost, notice: `魔法塔升級為 Lv.${tower.level + 1}。` });
    return true;
  };
  const sell = () => {
    const state = session.state;
    const index = selectedTowerIndex();
    if (index < 0) return false;
    const refund = Math.floor(state.towers[index].spent * 0.5);
    update({ towers: state.towers.filter((_, towerIndex) => towerIndex !== index),
      gold: state.gold + refund, notice: `拆除完成，退還 ${refund} 金幣。` });
    return true;
  };
  const startWave = () => {
    if (session.state.mode !== 'ready' || session.state.wave > 10) return false;
    update({ mode: 'battle', spawnClock: 0, incomeClock: 0,
      waveStats: { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 },
      notice: `第 ${session.state.wave} 波開始！` });
    spawn();
    return true;
  };
  const tick = (elapsed) => {
    const state = session.state;
    if (state.mode !== 'battle' || elapsed <= 0) return;
    elapsed *= [1, 2, 4].includes(state.speed) ? state.speed : 1;
    let spawnClock = state.spawnClock + elapsed;
    let incomeClock = state.incomeClock;
    let passiveIncome = 0;
    const waveSize = createWaveSequence(state.wave).length;
    if (state.spawnIndex < waveSize) {
      incomeClock += elapsed;
      const seconds = Math.floor(incomeClock);
      passiveIncome = seconds * 2;
      incomeClock -= seconds;
    }
    if (state.spawnIndex < waveSize && spawnClock >= 1) {
      spawnClock -= 1;
      spawn();
    }
    let enemies = session.state.enemies.map((enemy) => ({ ...enemy, distance: enemy.distance + enemyTypes[enemy.type].speed * elapsed }));
    let lives = session.state.lives;
    const waveStats = { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0, ...(session.state.waveStats || {}) };
    const escaped = new Set(enemies.filter((enemy) => enemy.distance >= routeLength).map((enemy) => enemy.id));
    const breaches = enemies.filter((enemy) => escaped.has(enemy.id));
    const livesLost = breaches.reduce((sum, enemy) => sum + enemyTypes[enemy.type].breachDamage, 0);
    lives = Math.max(0, lives - livesLost);
    waveStats.breaches += breaches.length;
    waveStats.livesLost += livesLost;
    enemies = enemies.filter((enemy) => !escaped.has(enemy.id));
    const positions = new Map(enemies.map((enemy) => [enemy.id, routePosition(enemy.distance)]));
    let bullets = session.state.bullets.filter((bullet) => positions.has(bullet.targetId));
    let nextBulletId = session.state.nextBulletId;
    const towers = session.state.towers.map((tower) => {
      const stats = towerLevels[tower.level];
      let cooldown = Math.max(0, tower.cooldown - elapsed);
      if (cooldown > 0) return { ...tower, cooldown };
      const origin = { x: board.x + tower.col * board.cell + 34, y: board.y + tower.row * board.cell + 34 };
      const locked = enemies.find((enemy) => enemy.id === tower.targetId);
      const lockedPoint = locked ? positions.get(locked.id) : null;
      const lockedInRange = lockedPoint && Math.hypot(lockedPoint.x - origin.x, lockedPoint.y - origin.y) <= stats.range;
      const target = lockedInRange ? locked : enemies.reduce((nearest, enemy) => {
        const point = positions.get(enemy.id);
        const distance = Math.hypot(point.x - origin.x, point.y - origin.y);
        if (distance > stats.range || (nearest && nearest.distance <= distance)) return nearest;
        return { enemy, distance };
      }, null)?.enemy;
      if (!target) return { ...tower, cooldown: 0, targetId: null };
      bullets.push({ id: nextBulletId, targetId: target.id, sourceTowerIndex: session.state.towers.indexOf(tower), x: origin.x, y: origin.y, damage: stats.damage });
      nextBulletId += 1;
      return { ...tower, cooldown: stats.cooldown, targetId: target.id };
    });
    const damage = new Map();
    const damageByTower = new Map();
    const finalHitByTarget = new Map();
    bullets = bullets.flatMap((bullet) => {
      const target = positions.get(bullet.targetId);
      if (!target) return [];
      const distance = Math.hypot(target.x - bullet.x, target.y - bullet.y);
      if (distance <= enemyTypes[enemies.find((enemy) => enemy.id === bullet.targetId)?.type || 'small'].radius) {
        damage.set(bullet.targetId, (damage.get(bullet.targetId) || 0) + bullet.damage);
        damageByTower.set(bullet.sourceTowerIndex, (damageByTower.get(bullet.sourceTowerIndex) || 0) + bullet.damage);
        finalHitByTarget.set(bullet.targetId, bullet.sourceTowerIndex);
        return [];
      }
      const travel = Math.min(distance, 360 * elapsed);
      return [{ ...bullet, x: bullet.x + (target.x - bullet.x) / distance * travel,
        y: bullet.y + (target.y - bullet.y) / distance * travel }];
    });
    enemies = enemies.map((enemy) => ({ ...enemy, hp: enemy.hp - (damage.get(enemy.id) || 0) }));
    const dead = new Set(enemies.filter((enemy) => enemy.hp <= 0).map((enemy) => enemy.id));
    enemies = enemies.filter((enemy) => !dead.has(enemy.id));
    bullets = bullets.filter((bullet) => !dead.has(bullet.targetId));
    const updatedTowers = towers.map((tower, index) => ({ ...tower,
      damage: (tower.damage || 0) + (damageByTower.get(index) || 0),
      kills: (tower.kills || 0) + [...dead].filter((id) => finalHitByTarget.get(id) === index).length,
    }));
    const completed = session.state.spawnIndex >= waveSize && enemies.length === 0;
    const reward = [...dead].reduce((sum, id) => {
      const defeated = session.state.enemies.find((enemy) => enemy.id === id);
      return sum + (defeated ? enemyTypes[defeated.type].reward : 0);
    }, 0);
    waveStats.kills += dead.size;
    waveStats.goldEarned += passiveIncome + reward;
    const victory = completed && state.wave === 10 && lives > 0;
    const nextWave = completed && state.wave < 10 ? state.wave + 1 : state.wave;
    const summary = completed ? { ...waveStats } : session.state.waveSummary;
    update({ enemies, bullets, towers: updatedTowers, lives, nextBulletId, waveStats,
      gold: session.state.gold + passiveIncome + reward, kills: session.state.kills + dead.size,
      waveSummary: summary,
      wave: nextWave, spawnIndex: completed && !victory ? 0 : session.state.spawnIndex,
      spawnClock: completed && !victory ? 0 : spawnClock, incomeClock: completed && !victory ? 0 : incomeClock,
      mode: lives <= 0 ? 'defeat' : victory ? 'victory' : completed ? 'ready' : 'battle',
      notice: lives <= 0 ? '魔法城失守。' : victory ? '十波防守成功！' : completed ? `第 ${state.wave} 波完成，準備第 ${nextWave} 波。` : session.state.notice });
  };
  return {
    build, upgrade, sell, startWave, tick,
    setSpeed(speed) {
      if (![1, 2, 4].includes(speed)) return false;
      update({ speed, notice: speed === 1 ? '已恢復正常速度。' : `已切換為 ${speed} 倍速。` });
      return true;
    },
    pause() { update({ previousMode: session.state.mode, mode: 'paused', notice: '遊戲已暫停。' }); },
    resume() { update({ mode: session.state.previousMode, notice: '遊戲繼續。' }); },
  };
}
