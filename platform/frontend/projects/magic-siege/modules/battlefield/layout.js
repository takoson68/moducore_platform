export const canvas = { width: 1440, height: 810 };
export const header = { x: 0, y: 0, width: 1440, height: 82 };
export const board = { x: 32, y: 98, cols: 12, rows: 9, cell: 68 };
export const panel = { x: 872, y: 98, width: 536, height: 594 };
export const nextWave = { x: 1084, y: 712, width: 324, height: 66 };
export const pause = { x: 1360, y: 18, width: 48, height: 48 };
export const speed = { x: 1300, y: 18, width: 54, height: 48 };

export function cellAt(point) {
  const col = Math.floor((point.x - board.x) / board.cell);
  const row = Math.floor((point.y - board.y) / board.cell);
  if (col < 0 || col >= board.cols || row < 0 || row >= board.rows) return null;
  return { col, row };
}
