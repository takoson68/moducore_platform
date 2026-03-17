import { routes } from './routes.js'
import { createRestaurantMapEditorStore } from './store.js'

export default {
  name: 'restaurant-map-editor',
  setup: {
    stores: {
      dineCoreRestaurantMapEditorStore: createRestaurantMapEditorStore
    },
    routes
  }
}
