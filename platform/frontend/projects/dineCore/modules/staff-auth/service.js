import {
  getStaffSession,
  loginStaffSession,
  logoutStaffSession
} from './api/staffAuthApi.js'

export async function loadStaffSession() {
  return getStaffSession()
}

export async function loginStaff(payload) {
  return loginStaffSession(payload)
}

export async function logoutStaff() {
  return logoutStaffSession()
}
