<!-- projects/project-a/modules/welcome/pages/WelcomePage.vue -->
<script setup>
import LayoutRoot from '../../../layout/LayoutRoot.vue'

const title = 'Welcome'
const subtitle = 'Guest world is online.'
</script>

<template lang="pug">
LayoutRoot(:title="title" :subtitle="subtitle")
  p The world is ready to host modules.
</template>
