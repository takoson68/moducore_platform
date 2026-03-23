//- src/router/index.js
// 主 Router，登入後動態注入模組 routes

//- Router 沒有注入容器中，因為 createRouter 需要 async 操作
//- 若要在其他地方使用 router 實例，請透過 holder.js 取得

import { createRouter, createWebHistory } from "vue-router";
import { subscribeContainer } from "@/app/container/index.js";
import { buildRoutes } from "./routes.js";
import { setupAuthGuard } from "./guards.js";

export async function createAppRouter() {
  const routes = await buildRoutes();

  const router = createRouter({
    history: createWebHistory(),
    routes,
    // 路由切換後一律回到頁面頂端，避免跨頁共用捲動位置
    scrollBehavior(_to, _from, savedPosition) {
      if (savedPosition) {
        return savedPosition
      }

      return { left: 0, top: 0, behavior: 'auto' }
    },
  });

  setupAuthGuard(router);

  const routeKeys = new Set(
    router.getRoutes().map((route) => createRouteKey(route))
  );

  const unsubscribeRoutesUpdated = subscribeContainer('routes-updated', (payload) => {
    const routesToAdd = Array.isArray(payload?.resolvedRoutes) ? payload.resolvedRoutes : [];

    routesToAdd.forEach((route) => {
      const routeKey = createRouteKey(route);
      if (routeKeys.has(routeKey)) return;

      router.addRoute('root', route);
      routeKeys.add(routeKey);
    });
  });

  const unsubscribeRoutesReset = subscribeContainer('routes-reset', () => {
    router.getRoutes().forEach((route) => {
      const routeName = route?.name;
      if (!routeName || routeName === 'root' || routeName === 'not-found') return;
      if (router.hasRoute(routeName)) {
        router.removeRoute(routeName);
      }
    });

    routeKeys.clear();
    router.getRoutes().forEach((route) => {
      routeKeys.add(createRouteKey(route));
    });
  });

  return {
    router,
    cleanup() {
      unsubscribeRoutesUpdated();
      unsubscribeRoutesReset();
    },
  };
}

function createRouteKey(route = {}) {
  return `${route.name || '(anonymous)'}::${route.path || ''}`;
}
