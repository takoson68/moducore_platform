import { routes } from './routes.js'
import { createEatGoMapFavoriteStore, createEatGoMapMemberStore } from './store.js'

export default {
  name: 'map-home',
  setup: {
    stores: {
      eatGoMapFavoriteStore: createEatGoMapFavoriteStore,
      eatGoMapMemberStore: createEatGoMapMemberStore
    },
    routes
  }
}
