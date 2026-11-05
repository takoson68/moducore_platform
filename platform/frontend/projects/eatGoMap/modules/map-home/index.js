import { routes } from './routes.js'
import { createEatGoMapFavoriteStore } from './store.js'

export default {
  name: 'map-home',
  setup: {
    stores: {
      eatGoMapFavoriteStore: createEatGoMapFavoriteStore
    },
    routes
  }
}
