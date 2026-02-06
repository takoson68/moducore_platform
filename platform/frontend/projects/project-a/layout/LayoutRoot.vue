<!-- projects/project-a/layout/LayoutRoot.vue -->
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
  padding: 14px
  display: grid
  gap: 12px

.layout-header h1
  margin: 0
  font-size: 24px
  color: var(--text-main)
  letter-spacing: 0.01em

.layout-header p
  margin: 6px 0 0
  color: var(--text-sub)
  font-size: 13px

.layout-body
  display: grid
  gap: var(--space-1)

.layout-body > p
  margin: 0
  padding: 12px
  border: 1px solid var(--border)
  border-radius: 10px
  background: var(--surface-muted)
  color: var(--text-sub)
  line-height: 1.6
</style>
