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
  tableLabelValue: { type: String, default: '' },
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
  setWorkingMode: { type: Function, required: true },
  setTool: { type: Function, required: true },
  setObjectLayerOrder: { type: Function, required: true },
  applyActiveObjectLayerOrder: { type: Function, required: true },
  setTextEditValue: { type: Function, required: true },
  setTableLabelValue: { type: Function, required: true },
  handleActiveTextInput: { type: Function, required: true },
  handleActiveTableLabelInput: { type: Function, required: true }
})
</script>

<template lang="pug">
.workspace-card__topbar
  p.eyebrow 地圖管理
  .workspace-map-top-actions
    .workspace-map-selector
      select.workspace-map-select(:value="props.state.activeMapId || ''" @change="props.setActiveMap($event.target.value)")
        option(v-for="map in props.state.maps" :key="map.id" :value="map.id") {{ `${map.name}${props.state.dirtyMapIds.includes(map.id) ? '（未儲存）' : ''}` }}
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
      button.ghost-button(type="button" @click="props.submitMapMeta") 套用
      span.workspace-inline-divider(aria-hidden="true")
      button.ghost-button(type="button" @click="props.saveDraft" :disabled="!props.activeMap") 草稿存檔
      button.primary-button(type="button" @click="props.saveFinal" :disabled="!props.activeMap") 正式儲存
      button.danger-button(type="button" @click="props.deleteActiveMap" :disabled="!props.activeMap") 刪除
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
        button.workspace-layer-apply(type="button" @click="props.applyActiveObjectLayerOrder") 套用層級
      button.danger-button(type="button" @click="props.deleteActiveObject") 刪除此元件
      input.workspace-text-edit-input(
        v-if="props.activeShapeObject && props.activeShapeObject.type === 'text'"
        type="text"
        :value="props.textEditValue"
        @input="props.setTextEditValue($event.target.value); props.handleActiveTextInput()"
        placeholder="輸入文字內容"
      )
    .toolbar-group.workspace-object-actions(v-else-if="props.activeTable && props.state.workingMode === 'table'")
      input.workspace-text-edit-input(
        type="text"
        :value="props.tableLabelValue"
        @input="props.setTableLabelValue($event.target.value); props.handleActiveTableLabelInput()"
        placeholder="輸入桌位名稱"
      )
      button.danger-button(type="button" @click="props.deleteActiveTable") 刪除此元件
</template>
