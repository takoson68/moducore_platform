<script setup>
import FlowTopbar from '../components/FlowTopbar.vue'
import FlowSidebar from '../components/FlowSidebar.vue'
import FlowRail from '../components/FlowRail.vue'
</script>

<template lang="pug">
.shell
  .shell-window.flow-glass
    FlowSidebar
    .shell-main
      FlowTopbar
      .shell-content
        section.shell-view
          RouterView
        FlowRail
</template>

<style lang="sass">
.shell
  height: 100vh
  display: grid
  padding: 2em
  position: relative
  overflow: hidden

.shell-window
  width: 100%
  height: 100%
  min-height: 0
  border-radius: 22px
  display: grid
  grid-template-columns: 220px minmax(0, 1fr)
  overflow: hidden

.shell-main
  display: grid
  grid-template-rows: auto 1fr
  min-width: 0
  min-height: 0
  height: 100%
  overflow: auto

.shell-content
  display: grid
  grid-template-columns: minmax(0, 1fr) 312px
  gap: 22px
  padding: 12px 22px 22px
  min-width: 0
  min-height: 0

.shell-view
  min-width: 0
  min-height: 0

@media (max-width: 1180px)
  .shell-content
    grid-template-columns: 1fr

@media (max-width: 960px)
  .shell
    padding: 2em

  .shell-window
    grid-template-columns: 1fr

  .shell-content
    padding: 16px
</style>
