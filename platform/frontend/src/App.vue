<script setup>
defineProps({
  projectConfig: Object,
  discoveredModules: Array
})
</script>

<template lang="pug">
.shell
  h1 Frontend Shell Running

  h2 Project
  pre {{ projectConfig }}

  h2 Discovered Modules
  pre {{ discoveredModules }}
</template>

<style lang="sass">
.shell
  padding: 24px
</style>
