export const canvas = { width: 1440, height: 810 };
export const header = { x: 0, y: 0, width: 1440, height: 82 };
export const board = { x: 20, y: 98, cols: 14, rows: 9, cell: 68 };
export const panel = { x: 1000, y: 98, width: 408, height: 594 };
export const nextWave = { x: 1000, y: 712, width: 306, height: 66 };
export const autoWave = { x: 1306, y: 712, width: 102, height: 66 };
export const pause = { x: 1360, y: 18, width: 48, height: 48 };
export const speed = { x: 1300, y: 18, width: 54, height: 48 };
export const fullscreen = { x: 32, y: 712, width: 180, height: 66 };
export const refresh = { x: 224, y: 712, width: 180, height: 66 };

export function cellAt(point) {
  const col = Math.floor((point.x - board.x) / board.cell);
  const row = Math.floor((point.y - board.y) / board.cell);
  if (col < 0 || col >= board.cols || row < 0 || row >= board.rows) return null;
  return { col, row };
}
