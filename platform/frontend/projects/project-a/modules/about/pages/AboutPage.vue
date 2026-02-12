<!-- projects/project-a/modules/about/pages/AboutPage.vue -->
<script setup>
import ProjectModuleLayout from '@project/layout/ModuleContentLayout.vue'

const title = 'About'
const body = 'This world generates projects without altering its rules.'
</script>

<template lang="pug">
ProjectModuleLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
