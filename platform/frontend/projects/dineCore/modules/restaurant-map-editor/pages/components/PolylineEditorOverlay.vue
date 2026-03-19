<script setup>
const props = defineProps({
  activePolyline: { type: Object, default: null },
  activePolylinePath: { type: String, default: '' },
  activePolylineSegments: { type: Array, default: () => [] },
  activePolylineCenter: { type: Object, default: null },
  activePolylinePoints: { type: Array, default: () => [] },
  activeHoveredSegment: { type: Object, default: null },
  selectedNodeIndex: { type: Number, default: null },
  insertPointAtSegment: { type: Function, required: true },
  startPolylineMove: { type: Function, required: true },
  setHoveredSegment: { type: Function, required: true },
  clearHoveredSegment: { type: Function, required: true },
  startCurveControlDrag: { type: Function, required: true },
  selectNode: { type: Function, required: true },
  startNodeDrag: { type: Function, required: true }
})
</script>

<template lang="pug">
template(v-if="props.activePolyline")
  path.map-polyline-overlay(:d="props.activePolylinePath")
  g.map-segment-editor(v-for="segment in props.activePolylineSegments" :key="`segment-${segment.index}`" @pointerenter="props.setHoveredSegment(segment.index)" @pointerleave="props.clearHoveredSegment(segment.index)")
    path.map-segment-hit(:d="segment.path" @click.stop="props.insertPointAtSegment(segment.index, $event)")
    circle.map-curve-control(
      v-if="props.activeHoveredSegment && props.activeHoveredSegment.index === segment.index && props.activeHoveredSegment.handlePoint"
      :cx="props.activeHoveredSegment.handlePoint.x"
      :cy="props.activeHoveredSegment.handlePoint.y"
      r="8"
      @pointerdown.stop="props.startCurveControlDrag(segment.index, $event)"
    )
  g.map-polyline-move-control(v-if="props.activePolylineCenter" @pointerdown.stop="props.startPolylineMove($event)")
    circle.map-polyline-move-control__dot(:cx="props.activePolylineCenter.x" :cy="props.activePolylineCenter.y" r="10")
    text.map-polyline-move-control__label(:x="props.activePolylineCenter.x" :y="props.activePolylineCenter.y" text-anchor="middle" dominant-baseline="middle") +
  circle.map-point.map-point--active(v-for="(point, index) in props.activePolylinePoints" :key="`active-${index}`" :class="{ 'is-selected': props.selectedNodeIndex === index }" :cx="point.x" :cy="point.y" r="6" @click.stop="props.selectNode(index, $event)" @pointerdown.stop="props.startNodeDrag(index, $event)")
</template>
