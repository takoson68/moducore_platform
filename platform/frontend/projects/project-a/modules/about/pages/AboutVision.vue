<!-- projects/project-a/modules/about/pages/AboutVision.vue -->
<script setup>
import AboutLayout from '../layout/AboutLayout.vue'

const title = 'About Vision'
const body = 'The vision is a stable platform where projects evolve safely.'
</script>

<template lang="pug">
AboutLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
