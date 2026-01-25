//- src/app/layout/layoutStore.js
import { shallowRef } from 'vue'

export const layoutRef = shallowRef(null)

export const layoutStore = {
  get() {
    return layoutRef.value
  },
  set(layout) {
    layoutRef.value = layout
  }
}
