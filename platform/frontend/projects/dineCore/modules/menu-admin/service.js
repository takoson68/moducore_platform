import world from '@/world.js'
import { mockApiRequest } from '@project/api/mockRequest.js'

function unwrapResult(result) {
  if (result?.ok && result?.data?.ok) {
    return result.data.data
  }

  if (result?.ok) {
    return result?.data
  }

  const code =
    result?.data?.error?.code ||
    result?.data?.data?.error?.code ||
    result?.data?.data?.message ||
    result?.data?.error?.code ||
    result?.data?.message ||
    result?.status ||
    'API_ERROR'

  throw new Error(String(code))
}

export async function loadMenuAdminItems() {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().get('/api/dinecore/staff/menu/items', { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/items')
}

export async function createMenuAdminCategory(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/create-category', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/create-category', payload)
}

export async function updateMenuAdminCategory(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-category', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-category', payload)
}

export async function deleteMenuAdminCategory(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/delete-category', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/delete-category', payload)
}

export async function reorderMenuAdminCategories(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/reorder-categories', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/reorder-categories', payload)
}

export async function createMenuAdminItem(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/create-item', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/create-item', payload)
}

export async function updateMenuAdminItemStatus(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-item-status', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-item-status', payload)
}

export async function updateMenuAdminItemPrice(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-item-price', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-item-price', payload)
}

export async function updateMenuAdminItemContent(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-item-content', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-item-content', payload)
}

export async function updateMenuAdminItemImage(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-item-image', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-item-image', payload)
}

export async function updateMenuAdminItemCategory(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-item-category', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-item-category', payload)
}

export async function addMenuAdminOptionGroup(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/add-option-group', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/add-option-group', payload)
}

export async function addMenuAdminOption(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/add-option', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/add-option', payload)
}

export async function updateMenuAdminOptionGroup(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-option-group', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-option-group', payload)
}

export async function deleteMenuAdminOptionGroup(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/delete-option-group', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/delete-option-group', payload)
}

export async function updateMenuAdminOption(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-option', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-option', payload)
}

export async function deleteMenuAdminOption(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/delete-option', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/delete-option', payload)
}

export async function updateMenuAdminDefaultOptions(payload) {
  if (world.apiMode() === 'real') {
    return unwrapResult(
      await world.http().post('/api/dinecore/staff/menu/update-default-options', payload, { tokenQuery: true })
    )
  }

  return mockApiRequest('menu-admin/update-default-options', payload)
}
