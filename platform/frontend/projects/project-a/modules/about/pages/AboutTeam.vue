<!-- projects/project-a/modules/about/pages/AboutTeam.vue -->
<script setup>
import AboutLayout from '../layout/AboutLayout.vue'

const title = 'About Team'
const body = 'This team builds modular worlds with clear boundaries.'
</script>

<template lang="pug">
AboutLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
