import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadMenuAdminItems() {
  return mockApiRequest('menu-admin/items')
}

export async function createMenuAdminCategory(payload) {
  return mockApiRequest('menu-admin/create-category', payload)
}

export async function updateMenuAdminCategory(payload) {
  return mockApiRequest('menu-admin/update-category', payload)
}

export async function deleteMenuAdminCategory(payload) {
  return mockApiRequest('menu-admin/delete-category', payload)
}

export async function reorderMenuAdminCategories(payload) {
  return mockApiRequest('menu-admin/reorder-categories', payload)
}

export async function createMenuAdminItem(payload) {
  return mockApiRequest('menu-admin/create-item', payload)
}

export async function updateMenuAdminItemStatus(payload) {
  return mockApiRequest('menu-admin/update-item-status', payload)
}

export async function updateMenuAdminItemPrice(payload) {
  return mockApiRequest('menu-admin/update-item-price', payload)
}

export async function updateMenuAdminItemImage(payload) {
  return mockApiRequest('menu-admin/update-item-image', payload)
}

export async function updateMenuAdminItemCategory(payload) {
  return mockApiRequest('menu-admin/update-item-category', payload)
}

export async function addMenuAdminOptionGroup(payload) {
  return mockApiRequest('menu-admin/add-option-group', payload)
}

export async function addMenuAdminOption(payload) {
  return mockApiRequest('menu-admin/add-option', payload)
}

export async function updateMenuAdminOptionGroup(payload) {
  return mockApiRequest('menu-admin/update-option-group', payload)
}

export async function deleteMenuAdminOptionGroup(payload) {
  return mockApiRequest('menu-admin/delete-option-group', payload)
}

export async function updateMenuAdminOption(payload) {
  return mockApiRequest('menu-admin/update-option', payload)
}

export async function deleteMenuAdminOption(payload) {
  return mockApiRequest('menu-admin/delete-option', payload)
}

export async function updateMenuAdminDefaultOptions(payload) {
  return mockApiRequest('menu-admin/update-default-options', payload)
}
