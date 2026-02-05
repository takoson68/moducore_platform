// src/app/api/apiMode.js
export function getApiMode() {
  const forced = import.meta.env?.VITE_API_MODE;
  if (forced === "real" || forced === "mock") return forced;
  const host = window.location.hostname;
  if (host === "moducore.test") return "real";
  return "mock";
}
