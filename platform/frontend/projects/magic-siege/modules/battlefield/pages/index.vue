<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Game from '@/game.js';
import { createBattlefieldModule } from '../runtime.js';

const game = new Game();
const canvasHost = ref(null);
const errorMessage = ref('');
const fullscreenFallback = ref(false);
let busy = false;
let pausedForVisibility = false;

async function action(command) {
  if (busy) return;
  busy = true;
  try {
    if (command === 'reset') await game.reset();
    else if (command === 'reload') {
      if (window.confirm('確定要重新整理頁面嗎？目前關卡進度將會重置。')) window.location.reload();
    }
    else if (command === 'pause') await game.pause();
    else if (command === 'resume') await game.resume();
    else if (command === 'fullscreen') {
      if (document.fullscreenElement) {
        await document.exitFullscreen?.();
        return;
      }
      const target = canvasHost.value;
      if (target?.requestFullscreen) {
        try {
          await target.requestFullscreen();
          return;
        } catch (error) {
          console.info('[Magic Siege] 原生全螢幕不可用，改用滿版模式', error);
        }
      }
      fullscreenFallback.value = !fullscreenFallback.value;
    }
  } catch (error) {
    console.error('[Magic Siege] 操作失敗', error);
    errorMessage.value = error.message;
  } finally { busy = false; }
}

// 分頁離開時只暫停正在進行的戰鬥，回到頁面後恢復原本的戰鬥狀態。
async function handleVisibilityChange() {
  if (document.hidden) {
    if (game.phase === 'running') {
      pausedForVisibility = true;
      await action('pause');
    }
    return;
  }
  if (pausedForVisibility && game.phase === 'paused') {
    pausedForVisibility = false;
    await action('resume');
  }
}

onMounted(async () => {
  document.addEventListener('visibilitychange', handleVisibilityChange);
  try {
    await game.start({ modules: [createBattlefieldModule({
      element: canvasHost.value,
      action,
      createStore: (options) => game.createStore(options),
    })] });
  } catch (error) {
    console.error('[Magic Siege] 無法載入幾何畫面', error);
    errorMessage.value = '畫面載入失敗，請重新整理後再試。';
  }
});

onBeforeUnmount(() => {
  document.removeEventListener('visibilitychange', handleVisibilityChange);
  game.dispose().catch(console.error);
});
</script>

<template lang="pug">
.magic-siege-stage(:class="{ 'fullscreen-fallback': fullscreenFallback }")
  .magic-siege-canvas(ref="canvasHost")
  p.magic-siege-error(v-if="errorMessage" role="alert") {{ errorMessage }}
</template>

<style lang="sass">
.magic-siege-stage
  position: relative
  width: 100vw
  height: 100dvh
  overflow: hidden
  background: #07101e
  &.fullscreen-fallback
    position: fixed
    inset: 0
    z-index: 9999
    width: 100vw
    height: 100dvh
.magic-siege-canvas
  width: 100vw
  height: 100dvh
  display: flex
  align-items: center
  justify-content: center
  overflow: hidden
  canvas
    display: block
    width: min(100vw, calc(100dvh * 1440 / 810)) !important
    height: min(100dvh, calc(100vw * 810 / 1440)) !important
    touch-action: manipulation
    &:focus-visible
      outline: 2px solid #4cecff
      outline-offset: -2px
.magic-siege-error
  position: absolute
  inset: 50% auto auto 50%
  transform: translate(-50%, -50%)
  color: #ffd6df
</style>
