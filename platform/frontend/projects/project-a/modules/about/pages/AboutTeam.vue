<!-- projects/project-a/modules/about/pages/AboutTeam.vue -->
<script setup>
import ProjectModuleLayout from '@project/layout/ModuleContentLayout.vue'

const title = 'About Team'
const body = 'This team builds modular worlds with clear boundaries.'
</script>

<template lang="pug">
ProjectModuleLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
