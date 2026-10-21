// 建立可選 p5 適配器，由模組註冊，不綁定 Game 或 Container。
export function createP5Engine({ element, width = 720, height = 440, draw, pointer, key, label = '互動遊戲畫布' }) {
  let instance = null;
  let running = false;
  let firstFrame = true;
  let canvas = null;
  let pending = null;

  // 將指標座標轉換為畫布邏輯座標。
  const onPointer = (event) => {
    if (!canvas) return;
    canvas.focus({ preventScroll: true });
    const bounds = canvas.getBoundingClientRect();
    pointer?.({ x: (event.clientX - bounds.left) * width / bounds.width,
      y: (event.clientY - bounds.top) * height / bounds.height });
  };
  // 將畫布鍵盤輸入交給遊戲定義。
  const onKey = (event) => {
    if (event.key === 'Enter' || event.key === ' ') event.preventDefault();
    key?.(event.key);
  };

  return {
    // 延遲載入引擎，等待 setup 完成後才允許遊戲啟動。
    prepare() {
      if (pending) return pending;
      pending = (async () => {
        if (!element?.isConnected) throw new Error('[P5] 缺少已掛載的畫布容器');
        const { default: P5 } = await import('p5');
        await new Promise((resolve, reject) => {
          instance = new P5((p) => {
            // 建立單一畫布及輸入事件，初始保持停止。
            p.setup = () => {
              try {
                canvas = p.createCanvas(width, height).elt;
                canvas.setAttribute('aria-label', label);
                canvas.setAttribute('tabindex', '0');
                canvas.addEventListener('pointerdown', onPointer);
                canvas.addEventListener('keydown', onKey);
                p.noLoop();
                resolve();
              } catch (error) { reject(error); }
            };
            // 保留 p5 原生循環，暫停與首幀不推進遊戲時間。
            p.draw = () => {
              const elapsed = running && !firstFrame ? Math.min(p.deltaTime / 1000, 0.1) : 0;
              firstFrame = false;
              draw?.(p, elapsed);
            };
          }, element);
        });
      })();
      return pending;
    },
    // 啟動或恢復引擎，避免暫停時間造成位置跳動。
    start() {
      if (!instance || !canvas) throw new Error('[P5] 引擎尚未準備完成');
      running = true;
      firstFrame = true;
      instance.loop();
    },
    // 停止畫格循環並保留畫面。
    stop() {
      running = false;
      firstFrame = true;
      instance?.noLoop();
    },
    // 停止循環時仍可更新畫布上的控制介面。
    redraw() { instance?.redraw(); },
    // 移除輸入事件、sketch 及 Canvas。
    dispose() {
      running = false;
      canvas?.removeEventListener('pointerdown', onPointer);
      canvas?.removeEventListener('keydown', onKey);
      instance?.remove();
      instance = null;
      canvas = null;
      pending = null;
    },
  };
}
