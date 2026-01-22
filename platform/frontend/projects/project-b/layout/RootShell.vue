<script setup>
defineProps({
  projectConfig: Object,
  discoveredModules: Array
})
</script>

<template lang="pug">
.shell
  .bg-grid
  header.topbar
    .brand
      .brand-title {{ projectConfig?.title ?? 'Project' }}
      .brand-sub Guest World Establishment
    .pill Project B
  .main
    RouterView
</template>

<style lang="sass">
.shell
  min-height: 100vh
  display: grid
  grid-template-rows: auto 1fr
  background: radial-gradient(1200px 600px at 10% 10%, rgba(34, 211, 238, 0.12), transparent 60%), linear-gradient(180deg, #f7fbff 0%, #eef5fb 100%)
  color: #0f172a
  position: relative
  overflow: hidden

.bg-grid
  position: absolute
  inset: 0
  background-image: linear-gradient(rgba(15, 23, 42, 0.05) 1px, transparent 1px), linear-gradient(90deg, rgba(15, 23, 42, 0.05) 1px, transparent 1px)
  background-size: 28px 28px
  mask-image: radial-gradient(circle at 15% 20%, rgba(0, 0, 0, 0.5), transparent 70%)
  pointer-events: none

.topbar
  display: flex
  align-items: center
  justify-content: space-between
  padding: 18px 28px
  border-bottom: 1px solid rgba(15, 23, 42, 0.08)
  background: rgba(255, 255, 255, 0.75)
  backdrop-filter: blur(6px)
  position: relative

.brand-title
  font-size: 22px
  font-weight: 700
  letter-spacing: 0.3px

.brand-sub
  font-size: 12px
  color: #0f172a
  opacity: 0.6

.pill
  padding: 6px 12px
  border-radius: 999px
  border: 1px solid rgba(14, 116, 144, 0.2)
  background: rgba(14, 116, 144, 0.12)
  color: #0e7490
  font-size: 12px
  font-weight: 600

.main
  padding: 28px
  position: relative
</style>
