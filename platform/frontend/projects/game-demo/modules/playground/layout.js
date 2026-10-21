// 定義畫布內資訊介面、遊戲內容與操作區的明確邊界。
export const layout = {
  information: { x: 0, y: 0, width: 1040, height: 260 },
  game: { x: 160, y: 260, width: 720, height: 440 },
  controls: { x: 160, y: 724, width: 720, height: 64 },
  primary: { x: 160, y: 724, width: 160, height: 48 },
  reset: { x: 334, y: 724, width: 140, height: 48 },
  fps: { x: 766, y: 66, width: 114, height: 34 },
};

// 判斷指標是否落在指定區域，避免 UI 輸入穿透至遊戲。
export function contains(rect, point) {
  return point.x >= rect.x && point.x <= rect.x + rect.width &&
    point.y >= rect.y && point.y <= rect.y + rect.height;
}
