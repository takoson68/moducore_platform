<script setup>
const props = defineProps({
  activePolyline: { type: Object, default: null },
  activePolylineSegments: { type: Array, default: () => [] },
  activePolylineCenter: { type: Object, default: null },
  activePolylinePoints: { type: Array, default: () => [] },
  selectedNodeIndex: { type: Number, default: null },
  insertPointAtSegment: { type: Function, required: true },
  startPolylineMove: { type: Function, required: true },
  selectNode: { type: Function, required: true },
  startNodeDrag: { type: Function, required: true }
})
</script>

<template lang="pug">
template(v-if="props.activePolyline")
  line.map-segment-hit(v-for="segment in props.activePolylineSegments" :key="`segment-${segment.index}`" :x1="segment.start.x" :y1="segment.start.y" :x2="segment.end.x" :y2="segment.end.y" @click.stop="props.insertPointAtSegment(segment.index, $event)")
  g.map-polyline-move-control(v-if="props.activePolylineCenter" @pointerdown.stop="props.startPolylineMove($event)")
    circle.map-polyline-move-control__dot(:cx="props.activePolylineCenter.x" :cy="props.activePolylineCenter.y" r="10")
    text.map-polyline-move-control__label(:x="props.activePolylineCenter.x" :y="props.activePolylineCenter.y" text-anchor="middle" dominant-baseline="middle") +
  circle.map-point.map-point--active(v-for="(point, index) in props.activePolylinePoints" :key="`active-${index}`" :class="{ 'is-selected': props.selectedNodeIndex === index }" :cx="point.x" :cy="point.y" r="6" @click.stop="props.selectNode(index, $event)" @pointerdown.stop="props.startNodeDrag(index, $event)")
</template>