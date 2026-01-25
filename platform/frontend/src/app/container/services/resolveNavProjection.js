//- src/app/container/services/resolveNavProjection.js
function getAccess(meta) {
  const access = meta?.access || {}
  const publicFlag = typeof access.public === 'boolean' ? access.public : meta?.public
  const authFlag = typeof access.auth === 'boolean' ? access.auth : meta?.auth
  return { public: publicFlag, auth: authFlag }
}

function createNavItem(route, navEntry, meta, fallbackLabel) {
  return {
    path: route.path,
    label: navEntry.label || fallbackLabel,
    order: Number.isFinite(navEntry.order) ? navEntry.order : 0,
    parent: navEntry.parent || meta?.navParent || null,
  }
}

export function resolveNavProjection(routes = [], { defaultAreas = ['sidebar'] } = {}) {
  const buckets = { topbar: [], sidebar: [] }

  routes.forEach((route) => {
    if (!route || !route.path) return

    const meta = route.meta || {}
    const hasNavArray = Array.isArray(meta.nav)
    const nav = hasNavArray ? meta.nav : null
    const label = meta.label || route.name || route.path

    if (hasNavArray && nav.length === 0) {
      return
    }

    if (nav && nav.length > 0) {
      nav.forEach((entry) => {
        if (!entry || !entry.area) return
        if (!buckets[entry.area]) buckets[entry.area] = []
        buckets[entry.area].push(createNavItem(route, entry, meta, label))
      })
      return
    }

    const access = getAccess(meta)
    const hasAccess = typeof access.public === 'boolean' && typeof access.auth === 'boolean'
    if (!hasAccess) return

    defaultAreas.forEach((area) => {
      if (!buckets[area]) buckets[area] = []
      buckets[area].push(createNavItem(route, { area }, meta, label))
    })
  })

  Object.keys(buckets).forEach((area) => {
    buckets[area].sort((a, b) => {
      const orderDiff = a.order - b.order
      if (orderDiff !== 0) return orderDiff
      return String(a.label || '').localeCompare(String(b.label || ''))
    })
  })

  return buckets
}
