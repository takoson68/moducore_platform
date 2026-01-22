// src/router/routes.js

const ROUTE_BUCKET_KEY = '__MODULE_ROUTES__'

const platformPages = [];
const authPages = [];

function getRouteBucket() {
  const bucket = typeof window !== 'undefined' ? window[ROUTE_BUCKET_KEY] : null
  if (!bucket) {
    return { public: [], auth: [], all: [] }
  }

  return {
    public: Array.isArray(bucket.public) ? bucket.public : [],
    auth: Array.isArray(bucket.auth) ? bucket.auth : [],
    all: Array.isArray(bucket.all) ? bucket.all : [],
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
  ];

  return [
    {
      path: "/",
      name: "root",
      component: () => import("@project/layout/LayoutRoot.vue"),
      children,
    },
  ];
}

export function normalizePath(path = "") {
  if (path.startsWith("/")) return path;
  return "/" + path;
}

export async function buildNavRoutes() {
  const routes = await buildRoutes();

  return routes[0].children.map((r) => {
    const path = normalizePath(r.path);
    const nav = r.meta?.nav
      ? {
          ...r.meta.nav,
          parent: r.meta.nav.parent ? normalizePath(r.meta.nav.parent) : null,
        }
      : null;

    return {
      ...r,
      path,
      meta: nav ? { ...r.meta, nav } : r.meta,
    };
  });
}

export { platformPages };
