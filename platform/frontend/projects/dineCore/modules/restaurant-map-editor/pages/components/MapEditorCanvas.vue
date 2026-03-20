<script setup>
import { ref } from 'vue'
import PolylineEditorOverlay from './PolylineEditorOverlay.vue'
import ShapeEditorOverlay from './ShapeEditorOverlay.vue'
import TableEditorOverlay from './TableEditorOverlay.vue'
import GroupSelectionOverlay from './GroupSelectionOverlay.vue'

const props = defineProps({
  activeMap: { type: Object, default: null },
  viewScale: { type: Number, default: 1 },
  mapPolylines: { type: Array, default: () => [] },
  drawableObjects: { type: Array, default: () => [] },
  mapTables: { type: Array, default: () => [] },
  activeObjectId: { type: String, default: '' },
  activeTableId: { type: String, default: '' },
  selectedObjectIds: { type: Array, default: () => [] },
  selectedTableIds: { type: Array, default: () => [] },
  activePolyline: { type: Object, default: null },
  activePolylinePath: { type: String, default: '' },
  activePolylineSegments: { type: Array, default: () => [] },
  activePolylineCenter: { type: Object, default: null },
  activePolylinePoints: { type: Array, default: () => [] },
  activeHoveredSegment: { type: Object, default: null },
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
  tableSnapGuides: { type: Object, default: () => ({ vertical: null, horizontal: null }) },
  groupSelectionBox: { type: Object, default: null },
  groupSelectionHandles: { type: Array, default: () => [] },
  pendingShape: { type: Object, default: null },
  pendingPolyline: { type: Array, default: () => [] },
  pendingPolylinePointsString: { type: String, default: '' },
  hoverWorldPoint: { type: Object, default: null },
  polylinePointsToString: { type: Function, required: true },
  buildPolylinePath: { type: Function, required: true },
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
  setHoveredSegment: { type: Function, required: true },
  clearHoveredSegment: { type: Function, required: true },
  startCurveControlDrag: { type: Function, required: true },
  startGroupResize: { type: Function, required: true },
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

function getTableDisplayLabel(table = {}) {
  const label = String(table?.label || '').trim()
  const tableCode = String(table?.tableCode || '').trim().toUpperCase()
  const mapCode = String(props.activeMap?.mapCode || '').trim().toUpperCase()
  const note = String(table?.note || '').trim()
  const displayCode = /^[A-Z]{2}-\d{3}$/.test(tableCode) ? tableCode.replace(/-/g, '') : (mapCode && label ? mapCode + label : label)
  return note ? displayCode + ' - ' + note : displayCode
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
    aria-label="餐廳地圖編輯畫布"
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
        path.map-polyline-hit(:d="props.buildPolylinePath(item.data.points || [], item.data.segments || [])" @click.stop="props.selectPolyline(item.id)")
        path.map-polyline(:class="{ 'is-active': item.id === props.activeObjectId, 'is-selected': props.selectedObjectIds.includes(item.id) }" :d="props.buildPolylinePath(item.data.points || [], item.data.segments || [])" @click.stop="props.selectPolyline(item.id)")
      template(v-for="item in props.drawableObjects" :key="item.id")
        template(v-if="item.type === 'rect'")
          g(:transform="props.buildObjectTransform(item)")
            rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            rect.map-shape(:class="{ 'is-active': item.id === props.activeObjectId, 'is-selected': props.selectedObjectIds.includes(item.id) }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
        template(v-else-if="item.type === 'circle'")
          g(:transform="props.buildObjectTransform(item)")
            ellipse.map-shape-hit(:cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            ellipse.map-shape.map-shape--circle(:class="{ 'is-active': item.id === props.activeObjectId, 'is-selected': props.selectedObjectIds.includes(item.id) }" :cx="item.data.x + item.data.width / 2" :cy="item.data.y + item.data.height / 2" :rx="item.data.width / 2" :ry="item.data.height / 2" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
        template(v-else-if="item.type === 'text'")
          g(:transform="props.buildObjectTransform(item)")
            rect.map-shape-hit(:x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            rect.map-text-box(:class="{ 'is-active': item.id === props.activeObjectId, 'is-selected': props.selectedObjectIds.includes(item.id) }" :x="item.data.x" :y="item.data.y" :width="item.data.width" :height="item.data.height" rx="10" ry="10" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)")
            text.map-text(:class="{ 'is-active': item.id === props.activeObjectId, 'is-selected': props.selectedObjectIds.includes(item.id) }" :x="item.data.x + item.data.width / 2" :y="item.data.y + item.data.height / 2" text-anchor="middle" dominant-baseline="middle" @click.stop="props.selectObject(item.id)" @pointerdown.stop="props.startObjectMove(item, $event)") {{ item.data.content }}
      PolylineEditorOverlay(
        :active-polyline="props.activePolyline"
        :active-polyline-path="props.activePolylinePath"
        :active-polyline-segments="props.activePolylineSegments"
        :active-polyline-center="props.activePolylineCenter"
        :active-polyline-points="props.activePolylinePoints"
        :active-hovered-segment="props.activeHoveredSegment"
        :selected-node-index="props.selectedNodeIndex"
        :insert-point-at-segment="props.insertPointAtSegment"
        :start-polyline-move="props.startPolylineMove"
        :set-hovered-segment="props.setHoveredSegment"
        :clear-hovered-segment="props.clearHoveredSegment"
        :start-curve-control-drag="props.startCurveControlDrag"
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
      GroupSelectionOverlay(
        :selection-box="props.groupSelectionBox"
        :selection-handles="props.groupSelectionHandles"
        :start-group-resize="props.startGroupResize"
      )
      template(v-if="props.pendingShape")
        rect.map-shape.map-shape--draft(v-if="props.pendingShape.type === 'rect'" :x="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).x" :y="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).y" :width="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width" :height="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height" rx="10" ry="10")
        ellipse.map-shape.map-shape--draft(v-else-if="props.pendingShape.type === 'circle'" :cx="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).x + props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width / 2" :cy="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).y + props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height / 2" :rx="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).width / 2" :ry="props.normalizeBoxFromPoints(props.pendingShape.start, props.pendingShape.current).height / 2")
      polyline.map-polyline.map-polyline--draft(v-if="props.pendingPolyline.length > 0" :points="props.pendingPolylinePointsString")
      circle.map-point(v-for="(point, index) in props.pendingPolyline" :key="`pending-${index}`" :cx="point.x" :cy="point.y" r="5")
      circle.map-point.map-point--hover(v-if="props.hoverWorldPoint && props.pendingPolyline.length > 0" :cx="props.hoverWorldPoint.x" :cy="props.hoverWorldPoint.y" r="4")
    g.table-layer
      line.map-snap-guide(
        v-if="props.tableSnapGuides?.vertical !== null"
        :x1="props.tableSnapGuides.vertical"
        y1="0"
        :x2="props.tableSnapGuides.vertical"
        :y2="props.activeMap.height"
      )
      line.map-snap-guide(
        v-if="props.tableSnapGuides?.horizontal !== null"
        x1="0"
        :y1="props.tableSnapGuides.horizontal"
        :x2="props.activeMap.width"
        :y2="props.tableSnapGuides.horizontal"
      )
      template(v-for="table in props.mapTables" :key="table.id")
        g(:transform="props.activeTableId === table.id ? props.activeTableTransform : ''")
          rect.map-table-hit(:x="table.x" :y="table.y" :width="table.width" :height="table.height" rx="14" ry="14" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)")
          rect.map-table(:class="{ 'is-active': table.id === props.activeTableId, 'is-selected': props.selectedTableIds.includes(table.id) }" :x="table.x" :y="table.y" :width="table.width" :height="table.height" rx="14" ry="14" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)")
          text.map-table-label(:x="table.x + table.width / 2" :y="table.y + table.height / 2" text-anchor="middle" dominant-baseline="middle" @click.stop="props.selectTable(table.id)" @pointerdown.stop="props.startTableMove(table, $event)") {{ getTableDisplayLabel(table) }}
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


