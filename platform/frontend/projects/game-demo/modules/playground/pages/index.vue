<script setup>
import { onMounted, onBeforeUnmount, ref } from 'vue';
import Game from '@/game.js';
import { createPlaygroundModule } from '../runtime.js';

const game = new Game();
const canvasHost = ref(null);
let busy = false;

// 將畫布操作交給 Game 管理生命週期，避免重複操作。
async function action(command) {
  if (busy) return;
  busy = true;
  try {
    if (command === 'reset') await game.reset();
    else if (command === 'pause') await game.pause();
    else if (command === 'resume') await game.resume();
    else if (command === 'redraw') game.service('engine').redraw();
  } catch (error) {
    console.error('[Game Demo]', error);
    try {
      game.store('session').set({ error: error.message });
      game.service('engine').redraw();
    } catch { /* 遊戲已清理時不再存取失效能力。 */ }
  } finally {
    busy = false;
  }
}

// 掛載後建立完整畫布介面，遊戲先停留在開始畫面。
onMounted(async () => {
  try {
    await game.start({ modules: [createPlaygroundModule({
      element: canvasHost.value, action,
      // 將 Game 的狀態建立能力交給模組，避免模組依賴 World。
      createStore: (options) => game.createStore(options),
    })] });
  } catch (error) {
    console.error('[Game Demo] 無法載入畫布', error);
    const canvas = document.createElement('canvas');
    canvas.width = 1040;
    canvas.height = 840;
    const context = canvas.getContext('2d');
    context.fillStyle = '#edf1e3';
    context.font = '24px sans-serif';
    context.fillText('畫布載入失敗，請重新整理頁面。', 60, 120);
    canvasHost.value?.append(canvas);
  }
});

// 離開頁面時釋放引擎及輸入事件。
onBeforeUnmount(() => { game.dispose().catch(console.error); });
</script>

<template lang="pug">
.game-demo-canvas(ref="canvasHost")
</template>

<style lang="sass">
.game-demo-canvas
  width: 100vw
  height: 100dvh
  display: flex
  align-items: center
  justify-content: center
  overflow: hidden
  background: #111b17
  canvas
    display: block
    width: min(100vw, calc(100dvh * 1040 / 840)) !important
    height: min(100dvh, calc(100vw * 840 / 1040)) !important
    touch-action: manipulation
    &:focus-visible
      outline: 2px solid #c4dca0
      outline-offset: -2px
</style>
