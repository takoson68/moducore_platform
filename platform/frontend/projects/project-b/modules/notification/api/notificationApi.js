// src/modules/notification/api/notificationApi.js
import world from '@/world.js'
import { mockNotifications } from "./mockNotifications.js";


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
    return world.http().get("/api/notifications");
  },
  create(payload) {
    return world.http().post("/api/notifications", payload);
  },
  markRead(id) {
    return world.http().post("/api/notifications/read", { id });
  },
  clear() {
    return world.http().post("/api/notifications/clear");
  },
};

const mode = world.apiMode();

export const notificationApi = mode === "mock" ? mockApi : realApi;

export function resetMockNotification() {
  mockDB = clone(mockNotifications);
}
