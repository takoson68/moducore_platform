//- src/router/routes.js
import { listRoutes } from '@/app/container/index.js'

const loadProjectLayout = () => import('project-layout-root-entry')

const platformPages = []
const authPages = []

function getRouteBucket() {
  const all = listRoutes()

  return {
    public: all.filter((route) => route?.meta?.access?.public === true || route?.meta?.public === true),
    auth: all.filter((route) => route?.meta?.access?.auth === true || route?.meta?.auth === true),
    all,
  }
}

export async function buildRoutes() {
  const { public: publicRoutes, auth: authRoutes } = getRouteBucket()

  const children = [
    ...platformPages,
    ...publicRoutes,
    ...authPages,
    ...authRoutes,
    {
      path: '404',
      name: 'not-found',
      component: () => import('@/router/NotFound.vue'),
    },
    {
      path: ':pathMatch(.*)*',
      redirect: '/404',
    },
  ]

  return [
    {
      path: '/',
      name: 'root',
      component: loadProjectLayout,
      children,
    },
  ]
}

export function normalizePath(path = '') {
  if (path.startsWith('/')) return path
  return `/${path}`
}

export async function buildNavRoutes() {
  const routes = await buildRoutes()

  return routes[0].children.map((route) => {
    const path = normalizePath(route.path)
    const nav = route.meta?.nav
      ? {
          ...route.meta.nav,
          parent: route.meta.nav.parent ? normalizePath(route.meta.nav.parent) : null,
        }
      : null

    return {
      ...route,
      path,
      meta: nav ? { ...route.meta, nav } : route.meta,
    }
  })
}

export { platformPages }
