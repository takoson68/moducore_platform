<!-- src/App.vue -->
<script setup>
import { computed } from 'vue'
import { layoutRef } from './app/layout/layoutStore.js'

defineProps({
  projectConfig: Object,
  discoveredModules: Array
})

const layout = computed(() => layoutRef.value)
</script>

<template lang="pug">
component(
  :is="layout?.component"
  :project-config="projectConfig"
  :discovered-modules="discoveredModules"
)
  RouterView
</template>
