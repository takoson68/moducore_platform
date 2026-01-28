//- projects/project-b/modules/mtk2mad/routes.js
export const routes = [
  {
    path: '/mtk2mad',
    // component: null,
    meta: {
      access: {
        public: false,
        auth: true
      },
      nav: [
        { area: 'sidebar', label: '攻擊進介紹', order: 55, link: false },
        // { area: 'topbar', label: '攻擊進介紹', order: 55, link: false }
      ]
    },
    children: [
      {
        path: '/mtk2mad/mtk2mad',
        component: () => import('./pages/home.vue'),
        meta: {
          access: {
            public: false,
            auth: true
          },
          nav: [
            { area: 'sidebar', label: '攻擊進程圖', order: 55 }
          ]
        }
      },
      {
        path: '/mtk2mad/mdeditor',
        component: () => import('./pages/mdeditor.vue'),
        meta: {
          access: {
            public: false,
            auth: true
          },
          nav: [
            { area: 'sidebar', label: '攻擊歷程報告', order: 56 }
          ]
        }
      }
    ]
  }
]
