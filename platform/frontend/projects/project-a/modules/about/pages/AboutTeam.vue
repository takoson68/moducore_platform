<!-- projects/project-a/modules/about/pages/AboutTeam.vue -->
<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'About Team'
const body = 'This team builds modular worlds with clear boundaries.'
</script>

<template lang="pug">
LayoutRoot(:title="title" subtitle="Project A")
  p {{ body }}
</template>
