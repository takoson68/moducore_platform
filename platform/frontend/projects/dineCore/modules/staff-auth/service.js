import { mockApiRequest } from '@project/api/mockRequest.js'

export async function loadStaffSession() {
  return mockApiRequest('staff-auth/session')
}

export async function loginStaff(payload) {
  return mockApiRequest('staff-auth/login', payload)
}

export async function logoutStaff() {
  return mockApiRequest('staff-auth/logout')
}
