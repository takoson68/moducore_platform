<script setup>
const props = defineProps({
  activeTable: { type: Object, default: null },
  activeTableBox: { type: Object, default: null },
  activeTableTransform: { type: String, default: '' },
  activeTableHandles: { type: Array, default: () => [] },
  activeTableRotateHandle: { type: Object, default: null },
  startTableResize: { type: Function, required: true },
  startTableRotate: { type: Function, required: true }
})
</script>

<template lang="pug">
template(v-if="props.activeTable && props.activeTableBox")
  g(:transform="props.activeTableTransform")
    rect.map-selection-box(:x="props.activeTableBox.x" :y="props.activeTableBox.y" :width="props.activeTableBox.width" :height="props.activeTableBox.height" rx="14" ry="14")
  circle.map-resize-handle(v-for="handle in props.activeTableHandles" :key="handle.key" :cx="handle.x" :cy="handle.y" r="6" @pointerdown.stop="props.startTableResize(handle.key, $event)")
  circle.map-rotate-handle(v-if="props.activeTableRotateHandle" :cx="props.activeTableRotateHandle.x" :cy="props.activeTableRotateHandle.y" r="6" @pointerdown.stop="props.startTableRotate($event)")
</template>
