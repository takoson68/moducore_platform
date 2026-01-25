<!-- projects/project-b/layout/LayoutRoot.vue -->
<script setup>
</script>

<template lang="pug">
.layout-root
  .glass-panel
    slot
    RouterView
</template>

<style lang="sass">
.layout-root
  padding: 16px

.glass-panel
  min-height: calc(100vh - 140px)
  padding: 24px
  border-radius: 20px
  border: 1px solid rgba(14, 116, 144, 0.18)
  background: rgba(255, 255, 255, 0.72)
  box-shadow: 0 20px 60px rgba(15, 23, 42, 0.08)
  backdrop-filter: blur(10px)
</style>
