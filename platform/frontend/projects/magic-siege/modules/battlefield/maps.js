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
