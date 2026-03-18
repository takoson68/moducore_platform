<script setup>
const props = defineProps({
  activeShapeObject: { type: Object, default: null },
  activeObjectBox: { type: Object, default: null },
  activeObjectTransform: { type: String, default: '' },
  activeObjectHandles: { type: Array, default: () => [] },
  activeObjectRotateHandle: { type: Object, default: null },
  startResize: { type: Function, required: true },
  startRotate: { type: Function, required: true }
})
</script>

<template lang="pug">
template(v-if="props.activeShapeObject && props.activeObjectBox")
  g(:transform="props.activeObjectTransform")
    rect.map-selection-box(:x="props.activeObjectBox.x" :y="props.activeObjectBox.y" :width="props.activeObjectBox.width" :height="props.activeObjectBox.height" rx="10" ry="10")
  circle.map-resize-handle(v-for="handle in props.activeObjectHandles" :key="handle.key" :cx="handle.x" :cy="handle.y" r="6" @pointerdown.stop="props.startResize(handle.key, $event)")
  circle.map-rotate-handle(v-if="props.activeObjectRotateHandle" :cx="props.activeObjectRotateHandle.x" :cy="props.activeObjectRotateHandle.y" r="6" @pointerdown.stop="props.startRotate($event)")
</template>