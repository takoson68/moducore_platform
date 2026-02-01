<!-- projects/_proTemp/layout/LayoutRoot.vue -->
<script setup>
defineProps({
  title: {
    type: String,
    default: ''
  },
  subtitle: {
    type: String,
    default: ''
  }
})
</script>

<template lang="pug">
.layout-root
  header.layout-header(v-if="title || subtitle")
    h1 {{ title }}
    p(v-if="subtitle") {{ subtitle }}
  section.layout-body
    slot
    RouterView
</template>

<style lang="sass">
.layout-root
  padding: 16px
  display: grid
  gap: 8px

.layout-header h1
  margin: 0
  font-size: 24px

.layout-header p
  margin: 6px 0 0
  color: #4b5563

.layout-body
  display: grid
  gap: 8px
</style>
