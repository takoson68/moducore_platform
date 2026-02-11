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
</template>

<style lang="sass" scoped>
.layout-root
  display: grid
  width: 100%
  gap: 16px

.layout-header h1
  margin: 0
  font-size: 24px
  color: #0f172a

.layout-header p
  margin: 6px 0 0
  color: #475569
  font-size: 14px

.layout-body
  display: grid
  width: 100%
</style>
