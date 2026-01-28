//- src/app/api/mockSwitch.js
const truthy = new Set(['true', '1', 'yes', 'on'])
const falsy = new Set(['false', '0', 'no', 'off'])

export function useMock(envKey, defaultValue = true) {
  if (!envKey) return defaultValue
  const raw = import.meta.env?.[envKey]
  if (raw == null || raw === '') return defaultValue
  const value = String(raw).trim().toLowerCase()
  if (truthy.has(value)) return true
  if (falsy.has(value)) return false
  return defaultValue
}
