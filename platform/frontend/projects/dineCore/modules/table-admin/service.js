import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadTableAdminTables() {
  return mockApiRequest('table-admin/tables')
}

export async function createTableAdminTable(payload) {
  return mockApiRequest('table-admin/create-table', payload)
}

export async function updateTableAdminTable(payload) {
  return mockApiRequest('table-admin/update-table', payload)
}

export async function deleteTableAdminTable(payload) {
  return mockApiRequest('table-admin/delete-table', payload)
}

export async function reorderTableAdminTables(payload) {
  return mockApiRequest('table-admin/reorder-tables', payload)
}
