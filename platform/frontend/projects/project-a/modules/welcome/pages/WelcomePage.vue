<!-- projects/project-a/modules/welcome/pages/WelcomePage.vue -->
<script setup>
import WelcomeLayout from '../layout/WelcomeLayout.vue'

const title = 'Welcome'
const subtitle = 'Guest world is online.'
</script>

<template lang="pug">
WelcomeLayout(:title="title" :subtitle="subtitle")
  p The world is ready to host modules.
</template>
