<!-- projects/project-a/modules/about/pages/AboutVision.vue -->
<script setup>
import ProjectModuleLayout from '@project/layout/ModuleContentLayout.vue'

const title = 'About Vision'
const body = 'The vision is a stable platform where projects evolve safely.'
</script>

<template lang="pug">
ProjectModuleLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
