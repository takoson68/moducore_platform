// src/modules/notification/api/notificationApi.js
import { http } from "@/app/api/http.js";
import { useMock } from "@/app/api/mockSwitch.js";
import { mockNotifications } from "./mockNotifications.js";

const USE_MOCK_NOTIFICATION = useMock("VITE_USE_MOCK_NOTIFICATION");

function clone(data) {
  try {
    return structuredClone(data);
  } catch (err) {
    return JSON.parse(JSON.stringify(data));
  }
}

function delay(ms = 200) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

let mockDB = clone(mockNotifications);

const mockApi = {
  async list() {
    await delay();
    return clone(mockDB);
  },
  async create(payload) {
    await delay();
    const now = Date.now();
    const notification = {
      id: payload.id || `ntf-${now}`,
      type: payload.type || "system",
      title: payload.title || "通知",
      content: payload.content || "",
      created_at: payload.created_at || now,
      read: Boolean(payload.read),
    };
    mockDB = [notification, ...mockDB];
    return clone(notification);
  },
  async markRead(id) {
    await delay();
    mockDB = mockDB.map((n) => (n.id === id ? { ...n, read: true } : n));
    return { success: true };
  },
  async clear() {
    await delay();
    mockDB = [];
    return { success: true };
  },
};

const realApi = {
  list() {
    return http.get("/notifications");
  },
  create(payload) {
    return http.post("/notifications", payload);
  },
  markRead(id) {
    return http.post(`/notifications/${id}/read`);
  },
  clear() {
    return http.post("/notifications/clear");
  },
};

export const notificationApi = USE_MOCK_NOTIFICATION ? mockApi : realApi;

export function resetMockNotification() {
  mockDB = clone(mockNotifications);
}
