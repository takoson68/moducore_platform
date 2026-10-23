import { board } from './layout.js';
import { getBattlefieldMap, levelDifficulty } from './maps.js';

function routeSegments(level = 1) {
  const route = getBattlefieldMap(level).route.map(([col, row]) => ({
    x: board.x + col * board.cell + board.cell / 2,
    y: board.y + row * board.cell + board.cell / 2,
  }));
  const segments = route.slice(1).map((point, index) => ({ from: route[index], to: point,
    length: Math.hypot(point.x - route[index].x, point.y - route[index].y) }));
  return { route, segments, length: segments.reduce((sum, segment) => sum + segment.length, 0) };
}
export const towerLevels = {
  1: { damage: 10, cooldown: 1, range: 140, cost: 10 },
  2: { damage: 18, cooldown: 0.8, range: 120, cost: 75 },
  3: { damage: 30, cooldown: 0.6, range: 145, cost: 125 },
};
export const towerTypes = { single: { name: '單體塔', splashRadius: 0 }, aoe: { name: '群攻塔', splashRadius: 72 } };
export const waveConfig = [
  null,
  { small: 5, large: 0 }, { small: 8, large: 0 }, { small: 8, large: 1 },
  { small: 10, large: 2 }, { small: 12, large: 3 }, { small: 14, large: 4 },
  { small: 16, large: 5 }, { small: 18, large: 6 }, { small: 20, large: 8 },
  { small: 25, large: 10, boss: 1 },
];
export function maxWaves(level = 1) { return 10 + Math.max(0, (level || 1) - 1) * 3; }
export const enemyTypes = {
  small: { hp: 50, speed: 55, radius: 14, reward: 5, breachDamage: 1 },
  large: { hp: 180, speed: 32, radius: 20, reward: 20, breachDamage: 3 },
  boss: { hp: 900, speed: 18, radius: 30, reward: 120, breachDamage: 8 },
};
function enemyStats(type, level = 1) {
  const base = enemyTypes[type];
  const difficulty = levelDifficulty[level] || levelDifficulty[1];
  return { ...base, hp: base.hp * difficulty.enemyHp, speed: base.speed * difficulty.enemySpeed };
}

export function createWaveSequence(wave) {
  const config = waveConfig[wave] || { small: 25 + (wave - 10) * 3, large: 10 + Math.floor((wave - 10) / 2), boss: 0 };
  if (!config) return [];
  const total = config.small + config.large;
  const largePositions = new Set();
  for (let index = 1; index <= config.large; index += 1) {
    largePositions.add(Math.max(1, Math.round(index * total / (config.large + 1))));
  }
  const sequence = Array.from({ length: total }, (_, index) => largePositions.has(index) ? 'large' : 'small');
  if (config.boss) sequence.push('boss');
  return sequence;
}

export function routePosition(distance, level = 1) {
  const { route, segments } = routeSegments(level);
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
    const stats = enemyStats(type, state.level || 1);
    update({ enemies: [...state.enemies, { id: state.nextEnemyId, type, hp: stats.hp, maxHp: stats.hp, distance: 0 }],
      spawnIndex: state.spawnIndex + 1, nextEnemyId: state.nextEnemyId + 1 });
  };
  const build = () => {
    const state = session.state;
    if (!state.selected) return false;
    const { col, row } = state.selected;
    if (state.gold < 10 || state.towers.some((item) => item.col === col && item.row === row)) return false;
    const type = state.buildType || 'single';
    update({ towers: [...state.towers, { col, row, type, level: 1, spent: 10, cooldown: 0, targetId: null, damage: 0, kills: 0 }], gold: state.gold - 10,
      notice: `Lv.1 ${towerTypes[type].name}建造完成。` });
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
    if (session.state.mode !== 'ready' || session.state.wave > maxWaves(session.state.level)) return false;
    update({ mode: 'battle', spawnClock: 0, incomeClock: 0,
      waveStats: { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 },
      notice: `第 ${session.state.wave} 波開始！` });
    spawn();
    return true;
  };
  const tick = (elapsed) => {
    const state = session.state;
    if (state.mode === 'ready' && state.autoWave) { startWave(); return; }
    if (state.mode !== 'battle' || elapsed <= 0) return;
    elapsed *= [1, 2, 4].includes(state.speed) ? state.speed : 1;
    const levelTime = (state.levelTime || 0) + elapsed;
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
    const routeData = routeSegments(session.state.level || 1);
    let enemies = session.state.enemies.map((enemy) => ({ ...enemy, distance: enemy.distance + enemyStats(enemy.type, session.state.level || 1).speed * elapsed }));
    let lives = session.state.lives;
    const waveStats = { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0, ...(session.state.waveStats || {}) };
    const escaped = new Set(enemies.filter((enemy) => enemy.distance >= routeData.length).map((enemy) => enemy.id));
    const breaches = enemies.filter((enemy) => escaped.has(enemy.id));
    const livesLost = breaches.reduce((sum, enemy) => sum + enemyStats(enemy.type, session.state.level || 1).breachDamage, 0);
    lives = Math.max(0, lives - livesLost);
    waveStats.breaches += breaches.length;
    waveStats.livesLost += livesLost;
    enemies = enemies.filter((enemy) => !escaped.has(enemy.id));
    const positions = new Map(enemies.map((enemy) => [enemy.id, routePosition(enemy.distance, session.state.level || 1)]));
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
      bullets.push({ id: nextBulletId, targetId: target.id, sourceTowerIndex: session.state.towers.indexOf(tower), x: origin.x, y: origin.y, damage: stats.damage, splashRadius: towerTypes[tower.type || 'single'].splashRadius });
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
        if (bullet.splashRadius > 0) {
          const impact = positions.get(bullet.targetId);
          enemies.forEach((enemy) => {
            if (enemy.id !== bullet.targetId && Math.hypot(positions.get(enemy.id).x - impact.x, positions.get(enemy.id).y - impact.y) <= bullet.splashRadius) damage.set(enemy.id, (damage.get(enemy.id) || 0) + bullet.damage * 0.55);
          });
        }
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
    const finalWave = maxWaves(state.level);
    const victory = completed && state.wave === finalWave && lives > 0;
    const score = victory ? Math.max(0, 1000 - (20 - lives) * 50 - Math.floor(levelTime / 10)) : session.state.score;
    const stars = victory ? (score >= 850 ? 3 : score >= 650 ? 2 : 1) : session.state.stars;
    const currentRecord = session.state.records?.[state.level] || {};
    const records = victory ? { ...session.state.records, [state.level]: {
      stars: Math.max(currentRecord.stars || 0, stars),
      score: Math.max(currentRecord.score || 0, score),
      fastestTime: currentRecord.fastestTime === undefined ? levelTime : Math.min(currentRecord.fastestTime, levelTime),
      kills: Math.max(currentRecord.kills || 0, session.state.kills + dead.size),
    } } : session.state.records;
    const nextWave = completed && state.wave < finalWave ? state.wave + 1 : state.wave;
    const summary = completed ? { ...waveStats } : session.state.waveSummary;
    update({ enemies, bullets, towers: updatedTowers, lives, nextBulletId, waveStats, levelTime, score, stars, records,
      gold: session.state.gold + passiveIncome + reward, kills: session.state.kills + dead.size,
      waveSummary: summary,
      wave: nextWave, spawnIndex: completed && !victory ? 0 : session.state.spawnIndex,
      spawnClock: completed && !victory ? 0 : spawnClock, incomeClock: completed && !victory ? 0 : incomeClock,
      mode: lives <= 0 ? 'defeat' : victory ? 'victory' : completed ? 'ready' : 'battle',
      notice: lives <= 0 ? '魔法城失守。' : victory ? '十波防守成功！' : completed ? `第 ${state.wave} 波完成，準備第 ${nextWave} 波。` : session.state.notice });
  };
  return {
    build, upgrade, sell, startWave, tick,
    toggleAutoWave() { update({ autoWave: !session.state.autoWave }); return !session.state.autoWave; },
    setBuildType(type) { if (!towerTypes[type]) return false; update({ buildType: type, notice: `下次建造：${towerTypes[type].name}。` }); return true; },
    toggleBuildType() { const type = session.state.buildType === 'aoe' ? 'single' : 'aoe'; update({ buildType: type, notice: `下次建造：${towerTypes[type].name}。` }); return type; },
    restartLevel() {
      const { level } = session.state;
      update({ level, mode: 'ready', previousMode: 'ready', wave: 1, lives: 20, gold: 100, autoWave: false, levelTime: 0, score: 0, stars: 0, towers: [], enemies: [], bullets: [], spawnIndex: 0, spawnClock: 0, incomeClock: 0, nextEnemyId: 1, nextBulletId: 1, kills: 0, waveStats: { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 }, waveSummary: null, selected: { col: 4, row: 4 }, notice: `第${level}關已重新開始。` });
      return true;
    },
    startLevel(level) {
      if (!Number.isInteger(level) || level < 1 || level > 5 || level !== session.state.level + 1 || session.state.mode !== 'victory') return false;
      update({ level, mode: 'ready', previousMode: 'ready', wave: 1, lives: 20, gold: 100, autoWave: false, levelTime: 0, score: 0, stars: 0, towers: [], enemies: [], bullets: [], spawnIndex: 0, spawnClock: 0, incomeClock: 0, nextEnemyId: 1, nextBulletId: 1, kills: 0, waveStats: { kills: 0, breaches: 0, goldEarned: 0, livesLost: 0 }, waveSummary: null, selected: { col: 4, row: 4 }, notice: `第${level}關準備完成。` });
      return true;
    },
    setSpeed(speed) {
      if (![1, 2, 4].includes(speed)) return false;
      update({ speed, notice: speed === 1 ? '已恢復正常速度。' : `已切換為 ${speed} 倍速。` });
      return true;
    },
    pause() { update({ previousMode: session.state.mode, mode: 'paused', notice: '遊戲已暫停。' }); },
    resume() { update({ mode: session.state.previousMode, notice: '遊戲繼續。' }); },
  };
}
