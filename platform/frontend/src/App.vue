<script setup>
import RootShell from '../projects/project-a/layout/RootShell.vue'

defineProps({
  projectConfig: Object,
  discoveredModules: Array
})
</script>

<template lang="pug">
RootShell(:project-config="projectConfig" :discovered-modules="discoveredModules")
</template>
