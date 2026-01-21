import { createRouter, createWebHistory } from 'vue-router'

export function createAppRouter({ routes }) {
  const routeList = Array.isArray(routes) ? [...routes] : []

  if (routeList.length > 0) {
    routeList.unshift({ path: '/', redirect: routeList[0].path })
  } else {
    routeList.push({
      path: '/',
      name: 'empty',
      component: {
        template: '<div class="module-page">No modules available.</div>'
      }
    })
  }

  return createRouter({
    history: createWebHistory(),
    routes: routeList
  })
}
