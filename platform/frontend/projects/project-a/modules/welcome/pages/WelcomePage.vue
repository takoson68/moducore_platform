<!-- projects/project-a/modules/welcome/pages/WelcomePage.vue -->
<script setup>
import ProjectModuleLayout from '@project/layout/ModuleContentLayout.vue'

const title = 'Welcome'
const subtitle = 'Guest world is online.'
</script>

<template lang="pug">
ProjectModuleLayout(:title="title" :subtitle="subtitle")
  p The world is ready to host modules.
</template>
