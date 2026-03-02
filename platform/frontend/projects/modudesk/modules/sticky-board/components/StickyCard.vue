<script setup>
import { computed, ref } from 'vue'
import { CARD_COLOR_OPTIONS } from '../board/boardEngine.js'

const props = defineProps({
  card: {
    type: Object,
    required: true,
  },
  spaceCenter: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
  dragOffset: {
    type: Object,
    default: () => ({ x: 0, y: 0 }),
  },
})

const emit = defineEmits(['activate', 'dragstart', 'remove', 'resize', 'rotate', 'update:color', 'update:content'])
const isPaletteOpen = ref(false)

const CARD_COLOR_MAP = {
  sun: {
    body: '#fff7d1',
    edge: 'rgba(101, 84, 22, 0.12)',
    ink: '#3f3820',
  },
  peach: {
    body: '#ffe2c7',
    edge: 'rgba(137, 84, 28, 0.14)',
    ink: '#56371a',
  },
  rose: {
    body: '#ffd9df',
    edge: 'rgba(145, 67, 87, 0.14)',
    ink: '#5b2d39',
  },
  mint: {
    body: '#dbf4df',
    edge: 'rgba(52, 112, 74, 0.14)',
    ink: '#24442e',
  },
  sky: {
    body: '#dcedff',
    edge: 'rgba(60, 97, 153, 0.14)',
    ink: '#233b61',
  },
  lavender: {
    body: '#ece2ff',
    edge: 'rgba(107, 82, 160, 0.14)',
    ink: '#43305f',
  },
  slate: {
    body: '#e7ebf2',
    edge: 'rgba(82, 95, 117, 0.14)',
    ink: '#2f3949',
  },
}

function renderCard(card, dragOffset, spaceCenter) {
  const width = Number(card?.width || 220) > 0 ? Number(card.width) : 220
  const height = Number(card?.height || 160) > 0 ? Number(card.height) : 160
  const centerX = Number(spaceCenter?.x || 0)
  const centerY = Number(spaceCenter?.y || 0)
  const offsetX = Number(props.dragOffset?.x || 0)
  const offsetY = Number(props.dragOffset?.y || 0)
  const worldX = Number(card?.x || 0)
  const worldY = Number(card?.y || 0)
  const left = centerX + worldX - width / 2
  const top = centerY + worldY - height / 2

  const style = {
    left: `${left}px`,
    top: `${top}px`,
    width: `${width}px`,
    height: `${height}px`,
    zIndex: String(card?.z || 1),
    transform: `translate(${offsetX}px, ${offsetY}px) rotate(${card?.rotation || 0}deg)`,
    '--card-bg': CARD_COLOR_MAP[card?.color]?.body || CARD_COLOR_MAP.sun.body,
    '--card-border': CARD_COLOR_MAP[card?.color]?.edge || CARD_COLOR_MAP.sun.edge,
    '--card-ink': CARD_COLOR_MAP[card?.color]?.ink || CARD_COLOR_MAP.sun.ink,
  }

  console.log('[StickyBoard] rendered', card?.id)
  return style
}

const cardStyle = computed(() => {
  return renderCard(props.card, props.dragOffset, props.spaceCenter)
})

function handleContentInput(event) {
  emit('update:content', {
    id: props.card.id,
    content: event.target.value,
  })
}

function togglePalette() {
  isPaletteOpen.value = !isPaletteOpen.value
}

function handleColorPick(color) {
  emit('update:color', {
    id: props.card.id,
    color,
  })
  isPaletteOpen.value = false
}
</script>

<template lang="pug">
article.sticky-card.stickyCard(:style="cardStyle" @click="emit('activate', card.id)")
  header.card-grip(@pointerdown.stop="emit('dragstart', { event: $event, cardId: card.id })")
    span.grip-dots
    .card-grip-actions
      span.card-meta {{ card.rotation }}°
      button.card-icon-btn.is-danger(type="button" data-ui="true" aria-label="刪除便利貼" @pointerdown.stop @click.stop="emit('remove', card.id)") X
  textarea.card-body(
    :value="card.content"
    data-ui="true"
    spellcheck="false"
    placeholder="寫下一張卡片..."
    @input="handleContentInput"
  )
  footer.card-footer
    .card-actions
      button.card-icon-btn(type="button" data-ui="true" aria-label="縮小便利貼" @pointerdown.stop @click.stop="emit('resize', { id: card.id, delta: -0.15 })") -
      button.card-icon-btn(type="button" data-ui="true" aria-label="放大便利貼" @pointerdown.stop @click.stop="emit('resize', { id: card.id, delta: 0.15 })") +
      .palette-wrap
        button.card-icon-btn.color-toggle(
          type="button"
          data-ui="true"
          :class="{ 'is-active': isPaletteOpen }"
          aria-label="選擇便利貼顏色"
          @pointerdown.stop
          @click.stop="togglePalette"
        ) 色
        .palette-panel(v-if="isPaletteOpen" data-ui="true" @pointerdown.stop @click.stop)
          button.palette-swatch(
            v-for="color in CARD_COLOR_OPTIONS"
            :key="color"
            type="button"
            :class="{ 'is-active': color === card.color }"
            :data-color="color"
            :aria-label="`切換為 ${color}`"
            @pointerdown.stop
            @click.stop="handleColorPick(color)"
          )
    button.card-action(type="button" data-ui="true" @pointerdown.stop @click.stop="emit('rotate', card.id)") +15°
</template>

<style lang="sass">
.sticky-card
  position: absolute
  width: 220px
  height: 160px
  display: grid
  grid-template-rows: auto 1fr auto
  border-radius: 1rem
  background: var(--card-bg)
  border: 1px solid var(--card-border)
  box-shadow: 0 12px 30px rgba(67, 58, 30, 0.14)
  overflow: hidden
  touch-action: none

.card-grip
  display: flex
  justify-content: space-between
  align-items: center
  padding: 0.55rem 0.55rem 0.3rem
  cursor: grab
  background: rgba(255, 255, 255, 0.42)

.card-grip:active
  cursor: grabbing

.grip-dots
  width: 2.8rem
  height: 0.45rem
  border-radius: 999px
  background-image: radial-gradient(circle, rgba(88, 78, 30, 0.28) 28%, transparent 30%)
  background-size: 0.55rem 0.45rem
  background-repeat: repeat-x

.card-grip-actions
  display: inline-flex
  align-items: center
  gap: 0.45rem

.card-meta
  font-size: 0.72rem
  color: rgba(73, 63, 24, 0.72)

.card-body
  border: 0
  resize: none
  width: 100%
  height: 100%
  padding: 0.1rem 0.8rem 0.35rem
  background: transparent
  color: var(--card-ink)
  font-size: 0.98rem
  line-height: 1.45
  outline: none

.card-body::placeholder
  color: color-mix(in srgb, var(--card-ink) 42%, transparent)

.card-footer
  display: flex
  justify-content: space-between
  align-items: center
  gap: 0.5rem
  padding: 0 0.55rem 0.55rem

.card-actions
  position: relative
  display: inline-flex
  align-items: center
  gap: 0.45rem
  flex-wrap: wrap

.card-action
  border: 0
  border-radius: 999px
  background: rgba(255, 255, 255, 0.82)
  color: #5d5021
  padding: 0.45rem 0.75rem
  cursor: pointer

.card-icon-btn
  width: 1.95rem
  height: 1.95rem
  border: 0
  border-radius: 999px
  display: inline-grid
  place-items: center
  padding: 0
  background: rgba(255, 255, 255, 0.82)
  color: #5d5021
  cursor: pointer
  font-size: 0.95rem
  line-height: 1

.card-icon-btn.is-danger
  width: auto
  min-width: 1.95rem
  padding: 0 0.6rem
  background: rgba(255, 240, 238, 0.94)
  color: #b42318

.palette-wrap
  position: relative

.palette-panel
  position: absolute
  left: 0
  bottom: calc(100% + 0.35rem)
  display: grid
  grid-template-columns: repeat(4, 1.6rem)
  gap: 0.35rem
  width: max-content
  padding: 0.45rem
  border-radius: 0.8rem
  background: rgba(255, 255, 255, 0.96)
  border: 1px solid rgba(36, 42, 54, 0.08)
  box-shadow: 0 10px 24px rgba(36, 42, 54, 0.14)
  z-index: 3

.palette-swatch
  width: 1.6rem
  height: 1.6rem
  border: 1px solid rgba(36, 42, 54, 0.12)
  border-radius: 0.45rem
  padding: 0
  cursor: pointer

.palette-swatch.is-active
  transform: scale(1.08)
  border-color: rgba(36, 42, 54, 0.4)

.palette-swatch[data-color="sun"]
  background: #fff7d1

.palette-swatch[data-color="peach"]
  background: #ffe2c7

.palette-swatch[data-color="rose"]
  background: #ffd9df

.palette-swatch[data-color="mint"]
  background: #dbf4df

.palette-swatch[data-color="sky"]
  background: #dcedff

.palette-swatch[data-color="lavender"]
  background: #ece2ff

.palette-swatch[data-color="slate"]
  background: #e7ebf2

.color-toggle.is-active
  background: linear-gradient(135deg, #ff9a76, #e87063)
  color: #fff
</style>
