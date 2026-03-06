import world from '@/world.js'
import {
  addMenuAdminOption,
  addMenuAdminOptionGroup,
  createMenuAdminCategory,
  createMenuAdminItem,
  deleteMenuAdminCategory,
  deleteMenuAdminOption,
  deleteMenuAdminOptionGroup,
  loadMenuAdminItems,
  reorderMenuAdminCategories,
  updateMenuAdminCategory,
  updateMenuAdminDefaultOptions,
  updateMenuAdminItemCategory,
  updateMenuAdminItemContent,
  updateMenuAdminItemImage,
  updateMenuAdminItemPrice,
  updateMenuAdminItemStatus,
  updateMenuAdminOption,
  updateMenuAdminOptionGroup
} from './service.js'

export function createMenuAdminStore() {
  return world.createStore({
    name: 'dineCoreMenuAdminStore',
    defaultValue: {
      categories: [],
      items: []
    },
    actions: {
      async load(store) {
        const payload = await loadMenuAdminItems()
        store.set({
          ...store.get(),
          categories: payload.categories || [],
          items: payload.items || []
        })
      },
      async createCategory(store, payload = {}) {
        const nextState = await createMenuAdminCategory(payload)
        store.set({
          ...store.get(),
          categories: nextState.categories || [],
          items: nextState.items || []
        })
      },
      async updateCategory(store, payload = {}) {
        const nextState = await updateMenuAdminCategory(payload)
        store.set({
          ...store.get(),
          categories: nextState.categories || [],
          items: nextState.items || []
        })
      },
      async deleteCategory(store, payload = {}) {
        const nextState = await deleteMenuAdminCategory(payload)
        store.set({
          ...store.get(),
          categories: nextState.categories || [],
          items: nextState.items || []
        })
      },
      async reorderCategories(store, payload = {}) {
        const nextState = await reorderMenuAdminCategories(payload)
        store.set({
          ...store.get(),
          categories: nextState.categories || [],
          items: nextState.items || []
        })
      },
      async createItem(store, payload = {}) {
        const nextState = await createMenuAdminItem(payload)
        store.set({
          ...store.get(),
          categories: nextState.categories || [],
          items: nextState.items || []
        })
      },
      async updateItemStatus(store, payload = {}) {
        const updated = await updateMenuAdminItemStatus(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateItemPrice(store, payload = {}) {
        const updated = await updateMenuAdminItemPrice(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateItemImage(store, payload = {}) {
        const updated = await updateMenuAdminItemImage(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateItemContent(store, payload = {}) {
        const updated = await updateMenuAdminItemContent(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateItemCategory(store, payload = {}) {
        const updated = await updateMenuAdminItemCategory(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async addOptionGroup(store, payload = {}) {
        const updated = await addMenuAdminOptionGroup(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async addOption(store, payload = {}) {
        const updated = await addMenuAdminOption(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateOptionGroup(store, payload = {}) {
        const updated = await updateMenuAdminOptionGroup(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async deleteOptionGroup(store, payload = {}) {
        const updated = await deleteMenuAdminOptionGroup(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateOption(store, payload = {}) {
        const updated = await updateMenuAdminOption(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async deleteOption(store, payload = {}) {
        const updated = await deleteMenuAdminOption(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      },
      async updateDefaultOptions(store, payload = {}) {
        const updated = await updateMenuAdminDefaultOptions(payload)
        const state = store.get()

        store.set({
          ...state,
          items: state.items.map(item => (item.id === updated.item.id ? updated.item : item))
        })
      }
    }
  })
}
