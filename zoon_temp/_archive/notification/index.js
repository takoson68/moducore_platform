// src/modules/notification/index.js
import { registerModule } from '@/modules/index.js'
import { container } from '@/container/container.js'
import { createNotificationStore } from './store/createNotificationStore.js'
import { collect } from './notificationCollector.js'
import eventBus from '@/eventBus/eventBus.js'

import NotificationLayout from './NotificationLayout.vue'
import NotificationPage from './pages/NotificationPage.vue'

export const notificationModule = {
  name: 'notification',
  layout: NotificationLayout,

  install() {
    if (!container.has('notificationStore')) {
      container.register('notificationStore', createNotificationStore)
    }
    if (!container.has('eventBus')) {
      container.register('eventBus', () => eventBus)
    }
    const bus = container.resolve('eventBus')
    bus.on('*', (eventName, payload) => collect(eventName, payload))
  },

  routes: [
    {
      path: '/notifications',
      meta: { module: 'notification' },
      component: NotificationPage
    },
    {
      path: '/notification',
      redirect: '/notifications',
      meta: { module: 'notification' }
    }
  ]
}

notificationModule.install()
registerModule(notificationModule)
