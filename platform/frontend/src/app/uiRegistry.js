//- src/app/uiRegistry.js
import { ref } from 'vue'

const slotMap = new Map()
export const uiRegistryVersion = ref(0)

export function registerUISlot(slotName, descriptor) {
  if (!slotName || !descriptor) return
  if (!slotMap.has(slotName)) {
    slotMap.set(slotName, [])
  }
  slotMap.get(slotName).push(descriptor)
  uiRegistryVersion.value += 1
}

export function getUISlots(slotName) {
  return slotMap.get(slotName) || []
}
