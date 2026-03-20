<script setup>
const props = defineProps({
  state: { type: Object, required: true },
  activeMap: { type: Object, default: null },
  toolOptions: { type: Array, default: () => [] },
  workingModeOptions: { type: Array, default: () => [] },
  scalePercent: { type: String, default: '100%' },
  mapMetaForm: { type: Object, required: true },
  activeObject: { type: Object, default: null },
  activeTable: { type: Object, default: null },
  activeShapeObject: { type: Object, default: null },
  mapObjectsLength: { type: Number, default: 0 },
  objectLayerOrder: { type: String, default: '' },
  textEditValue: { type: String, default: '' },
  tableNoteValue: { type: String, default: '' },
  tableMaxActiveOrdersValue: { type: [String, Number], default: '1' },
  setActiveMap: { type: Function, required: true },
  openCreateMapForm: { type: Function, required: true },
  zoomOut: { type: Function, required: true },
  resetZoom: { type: Function, required: true },
  zoomIn: { type: Function, required: true },
  submitMapMeta: { type: Function, required: true },
  saveDraft: { type: Function, required: true },
  saveFinal: { type: Function, required: true },
  deleteActiveMap: { type: Function, required: true },
  deleteActiveObject: { type: Function, required: true },
  deleteActiveTable: { type: Function, required: true },
  duplicateActiveTable: { type: Function, required: true },
  selectAllInCurrentMode: { type: Function, required: true },
  selectEntireScene: { type: Function, required: true },
  selectedObjectCount: { type: Number, default: 0 },
  selectedTableCount: { type: Number, default: 0 },
  setWorkingMode: { type: Function, required: true },
  setTool: { type: Function, required: true },
  setObjectLayerOrder: { type: Function, required: true },
  applyActiveObjectLayerOrder: { type: Function, required: true },
  setTextEditValue: { type: Function, required: true },
  setTableNoteValue: { type: Function, required: true },
  setTableMaxActiveOrdersValue: { type: Function, required: true },
  handleActiveTextInput: { type: Function, required: true },
  handleActiveTableNoteInput: { type: Function, required: true },
  handleActiveTableMaxActiveOrdersInput: { type: Function, required: true }
})
</script>

<template lang="pug">
.workspace-card__topbar
  p.eyebrow 地圖工作區
  .workspace-map-top-actions
    .workspace-map-selector
      select.workspace-map-select(:value="props.state.activeMapId || ''" @change="props.setActiveMap($event.target.value)")
        option(v-for="map in props.state.maps" :key="map.id" :value="map.id") {{ `${map.name}${props.state.dirtyMapIds.includes(map.id) ? ' *' : ''}` }}
    button.primary-button.primary-button--add-map(type="button" @click="props.openCreateMapForm") 新增地圖

.workspace-card__head
  .workspace-corner-controls
    .workspace-view-controls
      button.ghost-button(type="button" @click="props.zoomOut") -
      button.workspace-view-scale(type="button" @click="props.resetZoom") {{ props.scalePercent }}
      button.ghost-button(type="button" @click="props.zoomIn") +
  .workspace-map-summary
    input.workspace-map-name-input(type="text" v-model="props.mapMetaForm.name" placeholder="地圖名稱")
    .workspace-map-size-form
      input.workspace-map-size-input(type="number" min="1" step="1" v-model="props.mapMetaForm.width")
      span.workspace-map-size-separator x
      input.workspace-map-size-input(type="number" min="1" step="1" v-model="props.mapMetaForm.height")
      button.ghost-button(type="button" @click="props.submitMapMeta") 更新
      span.workspace-inline-divider(aria-hidden="true")
      button.ghost-button(type="button" @click="props.saveDraft" :disabled="!props.activeMap") 儲存草稿
      button.primary-button(type="button" @click="props.saveFinal" :disabled="!props.activeMap") 正式儲存
      button.danger-button(type="button" @click="props.deleteActiveMap" :disabled="!props.activeMap") 刪除地圖
  .workspace-head-toolbar
    .toolbar-group
      .tool-chips
        button.tool-chip(
          v-for="mode in props.workingModeOptions"
          :key="mode.id"
          type="button"
          :class="{ 'is-active': props.state.workingMode === mode.id }"
          :disabled="props.state.mode !== 'edit' || !props.activeMap || props.state.toolbarLocked"
          @click="props.setWorkingMode(mode.id)"
        ) {{ mode.label }}
      .tool-chips
        button.tool-chip(
          v-for="tool in props.toolOptions"
          :key="tool.id"
          type="button"
          :class="{ 'is-active': props.state.activeTool === tool.id }"
          :disabled="props.state.mode !== 'edit' || !props.activeMap || props.state.toolbarLocked"
          @click="props.setTool(tool.id)"
        ) {{ tool.label }}
      button.ghost-button(
        type="button"
        :disabled="props.state.mode !== 'edit' || !props.activeMap || props.state.toolbarLocked"
        @click="props.selectAllInCurrentMode"
      ) {{ props.state.workingMode === 'table' ? `全選桌位${props.selectedTableCount ? ` (${props.selectedTableCount})` : ''}` : `全選物件${props.selectedObjectCount ? ` (${props.selectedObjectCount})` : ''}` }}
      button.ghost-button(
        type="button"
        :disabled="props.state.mode !== 'edit' || !props.activeMap || props.state.toolbarLocked"
        @click="props.selectEntireScene"
      ) 全選場景
    .toolbar-group.workspace-object-actions(v-if="props.activeObject && props.state.workingMode === 'map'")
      .workspace-layer-control
        input.workspace-layer-input(
          type="number"
          min="1"
          :max="props.mapObjectsLength"
          :value="props.objectLayerOrder"
          @input="props.setObjectLayerOrder($event.target.value)"
          @change="props.applyActiveObjectLayerOrder"
          placeholder="層級"
        )
        button.workspace-layer-apply(type="button" @click="props.applyActiveObjectLayerOrder") 更新層級
      button.danger-button(type="button" @click="props.deleteActiveObject") 刪除物件
      input.workspace-text-edit-input(
        v-if="props.activeShapeObject && props.activeShapeObject.type === 'text'"
        type="text"
        :value="props.textEditValue"
        @input="props.setTextEditValue($event.target.value); props.handleActiveTextInput()"
        placeholder="文字內容"
      )
    .toolbar-group.workspace-object-actions(v-else-if="props.activeTable && props.state.workingMode === 'table'")
      button.ghost-button(type="button" @click="props.duplicateActiveTable") 複製桌位
      input.workspace-text-edit-input(
        type="text"
        :value="props.tableNoteValue"
        @input="props.setTableNoteValue($event.target.value); props.handleActiveTableNoteInput()"
        placeholder="桌位備註"
      )
      input.workspace-layer-input(
        type="number"
        min="1"
        :value="props.tableMaxActiveOrdersValue"
        @input="props.setTableMaxActiveOrdersValue($event.target.value); props.handleActiveTableMaxActiveOrdersInput()"
        placeholder="最大訂單數"
      )
      button.danger-button(type="button" @click="props.deleteActiveTable") 刪除桌位
</template>
