<script setup>
import { ref } from 'vue'
import PolylineEditorOverlay from './PolylineEditorOverlay.vue'
import ShapeEditorOverlay from './ShapeEditorOverlay.vue'
import TableEditorOverlay from './TableEditorOverlay.vue'

const props = defineProps({
  activeMap: { type: Object, default: null },
  viewScale: { type: Number, default: 1 },
  mapPolylines: { type: Array, default: () => [] },
  drawableObjects: { type: Array, default: () => [] },
  mapTables: { type: Array, default: () => [] },
  activeObjectId: { type: String, default: '' },
  activeTableId: { type: String, default: '' },
  activePolyline: { type: Object, default: null },
  activePolylineSegments: { type: Array, default: () => [] },
  activePolylineCenter: { type: Object, default: null },
  activePolylinePoints: { type: Array, default: () => [] },
  selectedNodeIndex: { type: Number, default: null },
  activeShapeObject: { type: Object, default: null },
  activeObjectBox: { type: Object, default: null },
  activeObjectTransform: { type: String, default: '' },
  activeObjectHandles: { type: Array, default: () => [] },
  activeObjectRotateHandle: { type: Object, default: null },
  activeTable: { type: Object, default: null },
  activeTableBox: { type: Object, default: null },
  activeTableTransform: { type: String, default: '' },
  activeTableHandles: { type: Array, default: () => [] },
  activeTableRotateHandle: { type: Object, default: null },
  pendingShape: { type: Object, default: null },
  pendingPolyline: { type: Array, default: () => [] },
  pendingPolylinePointsString: { type: String, default: '' },
  hoverWorldPoint: { type: Object, default: null },
  polylinePointsToString: { type: Function, required: true },
  buildObjectTransform: { type: Function, required: true },
  normalizeBoxFromPoints: { type: Function, required: true },
  handleSvgClick: { type: Function, required: true },
  handleSvgPointerDown: { type: Function, required: true },
  handleSvgMove: { type: Function, required: true },
  handleSvgLeave: { type: Function, required: true },
  handleSvgDoubleClick: { type: Function, required: true },
  handleBackgroundPointerDown: { type: Function, required: true },
  selectPolyline: { type: Function, required: true },
  selectObject: { type: Function, required: true },
  startObjectMove: { type: Function, required: true },
  insertPointAtSegment: { type: Function, required: true },
  startPolylineMove: { type: Function, required: true },
  selectNode: { type: Function, required: true },
  startNodeDrag: { type: Function, required: true },
  startResize: { type: Function, required: true },
  startRotate: { type: Function, required: true },
  selectTable: { type: Function, required: true },
  startTableMove: { type: Function, required: true },
  startTableResize: { type: Function, required: true },
  startTableRotate: { type: Function, required: true }
})

const svgElementRef = ref(null)

function getSvgElement() {
  return svgElementRef.value
}

defineExpose({
  getSvgElement
})
</script>

<template lang="pug">
.workspace-grid(:style="{ '--map-width': `${props.activeMap.width * props.viewScale}px`, '--map-height': `${props.activeMap.height * props.viewScale}px` }")
  svg.workspace-svg(
    ref="svgElementRef"
    :viewBox="`0 0 ${props.activeMap.width} ${props.activeMap.height}`"
    role="img"
    aria-label="地圖編輯區"
    @click="props.handleSvgClick"
    @pointerdown="props.handleSvgPointerDown"
    @mousemove="props.handleSvgMove"
    @mouseleave="props.handleSvgLeave"
    @dblclick="props.handleSvgDoubleClick"
  )
    defs
      pattern#map-grid-pattern(width="40" height="40" patternUnits="userSpaceOnUse")
        path(d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(90, 106, 123, 0.18)" stroke-width="1")
    rect(x="0" y="0" :width="props.activeMap.width" :height="props.activeMap.height" fill="#fffdf7")
    rect(x="0" y="0" :width="props.activeMap.width" :height="props.activeMap.height" fill="url(#map-grid-pattern)" @pointerdown="props.handleBackgroundPointerDown")
    g.map-layer
      template(v-for="item in props.mapPolylines" :key="item.id")
        polyline.map-polyline-hit(:points="props.polylinePointsToString(item.data.points || [])" @click.stop="props.selectPolyline(item.id)")
        polyline.map-polyline(:class="{ 'is-active': item.id === props.activeObjectId }" :points="props.polylinePointsToString(item.data.points || [])" @click.stop="props.selectPolyline(item.id)")
      template(v-for="item in props.drawableObjects" :key="item.id")
        template(v-if="item.type === 'rect'")
          g(:transform="props.buildObjectTransform(item)")
            rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            rect.map-shape(:class="{ 'is-active': item.id === props.activeObjectId }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
        template(v-else-if="item.type === 'circle'")
          g(:transform="props.buildObjectTransform(item)")
            ellipse.map-shape-hit(:cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            ellipse.map-shape.map-shape--circle(:class="{ 'is-active': item.id === props.activeObjectId }" :cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
        template(v-else-if="item.type === 'text'")
          g(:transform="props.buildObjectTransform(item)")
            rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            rect.map-text-box(:class="{ 'is-active': item.id === props.activeObjectId }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            text.map-text(:class="{ 'is-active': item.id === props.activeObjectId }" :x="item.data.x + item.data.width / 2" :y="item.data.y + item.data.height / 2" text-anchor="middle" dominant-baseline="middle" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)") {{ item.data.content }}
      PolylineEditorOverlay(
        :active-polyline="props.activePolyline"
        :active-polyline-segments="props.activePolylineSegments"
        :active-polyline-center="props.activePolylineCenter"
        :active-polyline-points="props.activePolylinePoints"
        :selected-node-index="props.selectedNodeIndex"
        :insert-point-at-segment="props.insertPointAtSegment"
        :start-polyline-move="props.startPolylineMove"
        :select-node="props.selectNode"
        :start-node-drag="props.startNodeDrag"
      )
      ShapeEditorOverlay(
        :active-shape-object="props.activeShapeObject"
        :active-object-box="props.activeObjectBox"
        :active-object-transform="props.activeObjectTransform"
        :active-object-handles="props.activeObjectHandles"
        :active-object-rotate-handle="props.activeObjectRotateHandle"
        :start-resize="props.startResize"
        :start-rotate="props.startRotate"
      )
      template(v-if="props.pendingShape")
        rect.map-shape.map-shape--draft(v-if="props.pendingShape.type === 'rect'" :x="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).x" :y="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).y" :width="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width" :height="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height" rx="10" ry="10")
        ellipse.map-shape.map-shape--draft(v-else-if="props.pendingShape.type === 'circle'" :cx="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).x + props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width / 2" :cy="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).y + props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height / 2" :rx="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width / 2" :ry="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height / 2")
      polyline.map-polyline.map-polyline--draft(v-if="props.pendingPolyline.length > 0" :points="props.pendingPolylinePointsString")
      circle.map-point(v-for="(point, index) in props.pendingPolyline" :key="`pending-${index}`" :cx="point.x" :cy="point.y" r="5")
      circle.map-point.map-point--hover(v-if="props.hoverWorldPoint && props.pendingPolyline.length > 0" :cx="props.hoverWorldPoint.x" :cy="props.hoverWorldPoint.y" r="4")
    g.table-layer
      template(v-for="table in props.mapTables" :key="table.id")
        g(:transform="props.activeTableId === table.id ? props.activeTableTransform : ''")
          rect.map-table-hit(:x="table.x" :y="table.y" :width="table.width" :height="table.height" rx="14" ry="14" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)")
          rect.map-table(:class="{ 'is-active': table.id === props.activeTableId }" :x="table.x" :y="table.y" :width="table.width" :height="table.height" rx="14" ry="14" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)")
          text.map-table-label(:x="table.x + table.width / 2" :y="table.y + table.height / 2" text-anchor="middle" dominant-baseline="middle" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)") {{ table.label }}
      TableEditorOverlay(
        :active-table="props.activeTable"
        :active-table-box="props.activeTableBox"
        :active-table-transform="props.activeTableTransform"
        :active-table-handles="props.activeTableHandles"
        :active-table-rotate-handle="props.activeTableRotateHandle"
        :start-table-resize="props.startTableResize"
        :start-table-rotate="props.startTableRotate"
      )
</template>
