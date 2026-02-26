//- projects/modudesk/modules/tasks/routes.js
export const routes = [
  {
    path: '/',
    name: 'modudesk-home',
    component: () => import('./pages/GuestHome.vue'),
    meta: {
      access: {
        public: true,
        auth: true
      }
    }
  },
  {
    path: '/tasks',
    name: 'modudesk-tasks-home',
    component: () => import('./pages/TasksHome.vue'),
    meta: {
      access: {
        public: true,
        auth: true
      }
    }
  }
]
