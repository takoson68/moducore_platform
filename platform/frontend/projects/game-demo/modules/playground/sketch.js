import { createFpsOverlay } from '@/gameEngines.js';
import { layout, contains } from './layout.js';

const points = [[70, 160], [230, 160], [230, 300], [440, 300], [440, 160], [650, 160]];

// 從持續存在的遊戲進度計算目標位置。
function position(progress) {
  const value = progress * (points.length - 1);
  const index = Math.min(Math.floor(value), points.length - 2);
  const fraction = value - index;
  return { x: points[index][0] + (points[index + 1][0] - points[index][0]) * fraction,
    y: points[index][1] + (points[index + 1][1] - points[index][1]) * fraction };
}

// 繪製畫布按鈕，輸入由 UI 區的命中判斷處理。
function button(p, rect, label, primary = false) {
  p.stroke(primary ? '#c4dca0' : '#4a5b46');
  p.strokeWeight(1);
  p.fill(primary ? '#c4dca0' : '#1c2924');
  p.rect(rect.x, rect.y, rect.width, rect.height, 9);
  p.noStroke();
  p.fill(primary ? '#1b2b20' : '#d8e2cf');
  p.textSize(15);
  p.textAlign(p.CENTER, p.CENTER);
  p.text(label, rect.x + rect.width / 2, rect.y + rect.height / 2);
}

// 繪製遊戲區，座標維持區域內的邏輯座標。
function drawGame(p, session) {
  p.push();
  p.translate(layout.game.x, layout.game.y);
  p.noStroke();
  p.fill('#142720');
  p.rect(0, 0, 720, 440);
  p.stroke('#243b36');
  p.strokeWeight(1);
  for (let x = 0; x <= 720; x += 40) p.line(x, 0, x, 440);
  for (let y = 0; y <= 440; y += 40) p.line(0, y, 720, y);
  p.noFill();
  p.stroke('#42594d');
  p.strokeWeight(54);
  p.strokeJoin(p.ROUND);
  p.strokeCap(p.ROUND);
  p.beginShape();
  for (const [x, y] of points) p.vertex(x, y);
  p.endShape();
  p.stroke('#718472');
  p.strokeWeight(2);
  p.beginShape();
  for (const [x, y] of points) p.vertex(x, y);
  p.endShape();
  p.noStroke();
  p.fill('#91d5ad');
  p.circle(70, 160, 28);
  p.rect(630, 140, 40, 40, 10);
  const marker = position(session.state.progress);
  p.stroke('#fbd598');
  p.strokeWeight(5);
  p.fill('#e99753');
  p.circle(marker.x, marker.y, 30);
  if (session.state.mode !== 'running') {
    p.noStroke();
    p.fill('#142720dd');
    p.rect(0, 0, 720, 440);
    p.fill('#c4dca0');
    p.textAlign(p.CENTER, p.CENTER);
    p.textSize(34);
    p.text(session.state.mode === 'paused' ? '遊戲已暫停' : '你的遊戲，由這裡開始', 360, 195);
    p.fill('#a5b3a6');
    p.textSize(15);
    p.text(session.state.mode === 'paused' ? '點擊繼續，接著玩。' : '一條路線，一個目標，無限可能。', 360, 240);
  }
  p.pop();
}

// 繪製 UI 區，資訊與控制元件不混入遊戲內容。
function drawUI(p, state) {
  p.noStroke();
  p.fill('#ecf4dc');
  p.textAlign(p.LEFT, p.CENTER);
  p.textSize(19);
  p.text('MODUCORE GAME', 160, 82);
  p.fill('#b0cb8b');
  p.textSize(11);
  p.text('PLAYGROUND  /  P5.JS', 160, 132);
  p.fill('#edf1e3');
  p.textSize(36);
  p.text('從一個小世界開始。', 160, 178);
  p.fill('#a5b3a6');
  p.textSize(14);
  p.text('點擊橘色目標得分，慢慢打造你的遊戲。', 160, 216);
  p.fill('#c4dca0');
  p.textSize(13);
  p.text(state.mode === 'running' ? '● 遊戲進行中' : state.mode === 'paused' ? '● 已暫停' : '● 準備好了嗎？', 160, 245);
  p.textAlign(p.RIGHT, p.CENTER);
  p.fill('#edf1e3');
  p.text('得分 ' + state.score + '     圈數 ' + state.laps, 880, 245);
  button(p, layout.primary, state.mode === 'running' ? '暫停遊戲' : state.mode === 'paused' ? '繼續遊戲' : '開始遊戲 →', true);
  button(p, layout.reset, '重新開始');
  button(p, layout.fps, state.showFps ? 'FPS：開' : 'FPS：關');
  p.noStroke();
  p.fill('#8e9e90');
  p.textAlign(p.RIGHT, p.CENTER);
  p.textSize(12);
  p.text('Enter 開始／暫停 · Space 得分 · R 重開', 880, 749);
  p.textAlign(p.LEFT, p.CENTER);
  p.text('MODUCORE GAME', 160, 812);
  p.textAlign(p.RIGHT, p.CENTER);
  p.text('簡單起步，慢慢長大。', 880, 812);
  if (state.error) {
    p.fill('#ffc3a1');
    p.textAlign(p.CENTER, p.CENTER);
    p.text(state.error, 520, 795);
  }
}

// 組合畫布資訊區與遊戲區，玩法、輸入及狀態仍屬遊戲模組。
export function createPlaygroundSketch(session, action) {
  const fps = createFpsOverlay();
  // 切換遊戲操作，初始畫面開始時只改變遊戲模式。
  const toggle = () => {
    if (session.state.mode === 'ready') session.set({ mode: 'running' });
    else action(session.state.mode === 'running' ? 'pause' : 'resume');
  };
  // 僅在遊戲運行時累積得分。
  const hit = () => {
    if (session.state.mode === 'running') session.set({ score: session.state.score + 1 });
  };
  return {
    // UI 與遊戲共用單一 p5 循環，但各自繪製與處理責任。
    draw(p, elapsed) {
      if (session.state.mode === 'running') {
        const progress = session.state.progress + elapsed / 9;
        session.set({ progress: progress % 1, laps: session.state.laps + Math.floor(progress) });
      }
      p.background('#111b17');
      p.textFont('PingFang TC, Noto Sans TC, sans-serif');
      drawGame(p, session);
      drawUI(p, session.state);
      fps.draw(p, { enabled: session.state.showFps, running: p.isLooping() });
    },
    // UI 區先消化控制事件，遊戲區再將全域座標轉為局部座標。
    pointer(point) {
      if (contains(layout.fps, point)) {
        session.set({ showFps: !session.state.showFps });
        action('redraw');
        return;
      }
      if (contains(layout.primary, point)) { toggle(); return; }
      if (contains(layout.reset, point)) { action('reset'); return; }
      if (!contains(layout.game, point) || session.state.mode !== 'running') return;
      const marker = position(session.state.progress);
      if (Math.hypot(point.x - layout.game.x - marker.x, point.y - layout.game.y - marker.y) <= 22) hit();
    },
    // 鍵盤快捷鍵與畫布按鈕使用相同操作入口。
    key(value) {
      if (value === 'Enter') toggle();
      else if (value === ' ') hit();
      else if (value.toLowerCase() === 'r') action('reset');
    },
  };
}
