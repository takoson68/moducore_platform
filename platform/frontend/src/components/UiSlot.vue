<script setup>
import { computed, defineAsyncComponent } from "vue";
import { container } from "@/app/container";
import { getUISlots, uiRegistryVersion } from "@/app/uiRegistry";

const props = defineProps({
  name: {
    type: String,
    required: true,
  },
});

const authStore = container.resolve("auth");

function resolveAccess(item) {
  const access = item?.access || {};
  const publicFlag = typeof access.public === "boolean" ? access.public : item?.public;
  const authFlag = typeof access.auth === "boolean" ? access.auth : item?.auth;
  return { public: publicFlag, auth: authFlag };
}

const descriptors = computed(() => {
  uiRegistryVersion.value;
  const isLoggedIn = authStore.isLoggedIn();
  return getUISlots(props.name)
    .slice()
    .filter((item) => {
      const access = resolveAccess(item);
      const hasAccess = typeof access.public === "boolean" && typeof access.auth === "boolean";
      if (!hasAccess) return true;
      if (access.public === true) return true;
      if (access.auth === true) return isLoggedIn;
      return false;
    })
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
