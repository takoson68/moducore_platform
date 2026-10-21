// 建立可重用的畫布幀率資訊元件，不建立額外計時器或循環。
export function createFpsOverlay() {
  let previous = null;
  let elapsed = 0;
  let frames = 0;
  let fps = null;
  return {
    // 從實際繪製時間量測平均幀率，暫停時清除量測視窗。
    draw(p, { enabled = true, running = true, x = 16, y = 12 } = {}) {
      const now = p.millis();
      if (!running) {
        previous = null;
        elapsed = 0;
        frames = 0;
        fps = null;
      } else {
        if (previous !== null) {
          elapsed += now - previous;
          frames++;
          if (elapsed >= 500) {
            fps = Math.round(frames * 1000 / elapsed);
            elapsed = 0;
            frames = 0;
          }
        }
        previous = now;
      }
      if (!enabled) return;
      p.push();
      p.noStroke();
      p.fill('#080f0dde');
      p.rect(x, y, 126, 30, 6);
      p.fill('#c4dca0');
      p.textFont('monospace');
      p.textSize(13);
      p.textAlign(p.LEFT, p.CENTER);
      p.text(!running ? 'FPS — 暫停' : `FPS ${fps ?? '量測中'}`, x + 10, y + 15);
      p.pop();
    },
  };
}
