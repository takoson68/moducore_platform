<script setup>
import { computed, defineAsyncComponent } from "vue";
import { getUISlots, uiRegistryVersion } from "@/app/_uiRegistry";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const descriptors = computed(() => {
  uiRegistryVersion.value;
  return getUISlots(props.name)
    .slice()
    .sort((a, b) => (a.order || 0) - (b.order || 0))
    .map((item) => ({
      ...item,
      resolved:
        typeof item.component === "function"
          ? defineAsyncComponent(item.component)
          : item.component,
    }));
});
</script>

<template lang="pug">
template(v-if="descriptors.length")
  component(
    v-for="(item, idx) in descriptors"
    :key="idx"
    :is="item.resolved"
  )
</template>
