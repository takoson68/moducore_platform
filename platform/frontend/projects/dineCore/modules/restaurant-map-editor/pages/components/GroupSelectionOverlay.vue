<script setup>
const props = defineProps({
  selectionBox: { type: Object, default: null },
  selectionHandles: { type: Array, default: () => [] },
  startGroupResize: { type: Function, required: true }
})
</script>

<template lang="pug">
template(v-if="props.selectionBox")
  rect.map-selection-box(
    :x="props.selectionBox.x"
    :y="props.selectionBox.y"
    :width="props.selectionBox.width"
    :height="props.selectionBox.height"
    rx="10"
    ry="10"
  )
  circle.map-resize-handle(
    v-for="handle in props.selectionHandles"
    :key="handle.key"
    :cx="handle.x"
    :cy="handle.y"
    r="6"
    @pointerdown.stop="props.startGroupResize(handle.key, $event)"
  )
</template>
