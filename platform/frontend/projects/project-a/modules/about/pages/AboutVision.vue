<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'About Vision'
const body = 'The vision is a stable platform where projects evolve safely.'
</script>

<template lang="pug">
LayoutRoot(:title="title" subtitle="Project A")
  p {{ body }}
</template>
