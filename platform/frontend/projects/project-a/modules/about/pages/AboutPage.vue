<!-- projects/project-a/modules/about/pages/AboutPage.vue -->
<script setup>
import AboutLayout from '../layout/AboutLayout.vue'

const title = 'About'
const body = 'This world generates projects without altering its rules.'
</script>

<template lang="pug">
AboutLayout(:title="title" subtitle="Project A")
  p {{ body }}
</template>
