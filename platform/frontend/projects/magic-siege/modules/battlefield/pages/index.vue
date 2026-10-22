<script setup>
import { onBeforeUnmount, onMounted, ref } from 'vue';
import Game from '@/game.js';
import { createBattlefieldModule } from '../runtime.js';

const game = new Game();
const canvasHost = ref(null);
const errorMessage = ref('');
let busy = false;

async function action(command) {
  if (busy) return;
  busy = true;
  try {
    if (command === 'reset') await game.reset();
    else if (command === 'pause') await game.pause();
    else if (command === 'resume') await game.resume();
  } catch (error) {
    console.error('[Magic Siege] 操作失敗', error);
    errorMessage.value = error.message;
  } finally { busy = false; }
}

onMounted(async () => {
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

onBeforeUnmount(() => { game.dispose().catch(console.error); });
</script>

<template lang="pug">
.magic-siege-stage
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
