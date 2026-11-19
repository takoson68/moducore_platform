<script setup>
import { computed, ref } from 'vue'
import CoinCasting from '../methods/coin/index.vue'
import DetailedConsultation from '../methods/detailed/index.vue'
import MeihuaCasting from '../methods/meihua/index.vue'

const activeMethod = ref('coin')
const activeComponent = computed(() => ({
  coin: CoinCasting,
  detailed: DetailedConsultation,
  meihua: MeihuaCasting,
}[activeMethod.value] || CoinCasting))
</script>

<template lang="pug">
.yi-casting-method-shell
  .yi-casting-method-view
    <keep-alive>
      <component :is="activeComponent" :active-method="activeMethod" @select-method="activeMethod = $event" />
    </keep-alive>
</template>

<style lang="sass">
@use '../../../styles/sass/variables' as *
@use '../styles'

.yi-casting-method-shell
  min-height: 100vh
  background: $bg-paper

.yi-casting-method-view > .yi-casting
  min-height: calc(100vh - #{$method-switch-height})
</style>
