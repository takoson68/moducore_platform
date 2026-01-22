export const routes = [
  {
    path: '/about',
    meta: {
      access: {
        public: true,
        auth: true
      },
      nav: [
        { area: 'sidebar', label: '關於我的內容', order: 2 },
        { area: 'topbar', label: '關於我的內容', order: 2 }
      ],
      child: [
        {
          path: '/about/team',
          component: () => import('./pages/AboutTeam.vue'),
          meta: {
            access: {
              public: true,
              auth: true
            },
            nav: [
              { area: 'sidebar', label: 'About · Team', order: 3 },
              // { area: 'topbar', label: 'About · Team', order: 3 }
            ]
          }
        },
        {
          path: '/about/vision',
          component: () => import('./pages/AboutVision.vue'),
          meta: {
            access: {
              public: true,
              auth: true
            },
            nav: [
              { area: 'sidebar', label: 'About · Vision', order: 4 },
              // { area: 'topbar', label: 'About · Vision', order: 4 }
            ]
          }
        }
      ]
    }
  }
]
