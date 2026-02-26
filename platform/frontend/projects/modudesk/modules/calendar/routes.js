//- projects/modudesk/modules/calendar/routes.js
export const routes = [
  {
    path: '/calendar',
    name: 'modudesk-calendar-home',
    component: () => import('./pages/CalendarHome.vue'),
    meta: {
      access: {
        public: true,
        auth: true,
      },
    },
  },
]
