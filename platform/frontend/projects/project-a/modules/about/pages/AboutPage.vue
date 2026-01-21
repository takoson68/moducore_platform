<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'About'
const body = 'This world generates projects without altering its rules.'
</script>

<template lang="pug">
LayoutRoot(:title="title" subtitle="Project A")
  p {{ body }}
</template>
