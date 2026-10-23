export const battlefieldMaps = {
  1: {
    name: '城門外圍',
    route: [[0, 2], [5, 2], [5, 5], [9, 5], [9, 7], [11, 7], [11, 5], [13, 5]],
    obstacles: [[0, 5], [2, 0], [3, 7], [7, 0], [8, 8]],
  },
  2: {
    name: '雙折回廊',
    route: [[0, 1], [10, 1], [10, 3], [2, 3], [2, 6], [11, 6], [11, 8], [13, 8]],
    obstacles: [[1, 5], [4, 0], [5, 4], [7, 7], [12, 2]],
  },
  3: {
    name: '三叉哨站',
    route: [[0, 7], [4, 7], [4, 2], [9, 2], [9, 6], [13, 6]],
    obstacles: [[1, 1], [2, 4], [6, 7], [8, 4], [11, 1]],
  },
  4: {
    name: '環城外牆',
    route: [[0, 4], [3, 4], [3, 1], [11, 1], [11, 7], [6, 7], [6, 5], [13, 5]],
    obstacles: [[1, 7], [5, 3], [7, 4], [9, 8], [12, 2]],
  },
  5: {
    name: '王城核心',
    route: [[0, 1], [3, 1], [3, 7], [7, 7], [7, 3], [12, 3], [12, 8], [13, 8]],
    obstacles: [[1, 4], [5, 1], [5, 5], [9, 6], [10, 1]],
  },
};

export const levelDifficulty = {
  1: { enemyHp: 1, enemySpeed: 1, breachDamage: 1, goldMultiplier: 1 },
  2: { enemyHp: 1, enemySpeed: 1.05, breachDamage: 1, goldMultiplier: 1 },
  3: { enemyHp: 1.12, enemySpeed: 1.05, breachDamage: 1, goldMultiplier: 1 },
  4: { enemyHp: 1.2, enemySpeed: 1.1, breachDamage: 1, goldMultiplier: 1 },
  5: { enemyHp: 1.3, enemySpeed: 1.12, breachDamage: 1, goldMultiplier: 1 },
};

export function getBattlefieldMap(level = 1) {
  return battlefieldMaps[level] || battlefieldMaps[1];
}

export function mapPathCells(level = 1) {
  const cells = new Set();
  const route = getBattlefieldMap(level).route;
  for (let index = 1; index < route.length; index += 1) {
    const [fromCol, fromRow] = route[index - 1];
    const [toCol, toRow] = route[index];
    const stepCol = Math.sign(toCol - fromCol);
    const stepRow = Math.sign(toRow - fromRow);
    let col = fromCol;
    let row = fromRow;
    cells.add(`${col},${row}`);
    while (col !== toCol || row !== toRow) {
      col += stepCol;
      row += stepRow;
      cells.add(`${col},${row}`);
    }
  }
  return cells;
}
