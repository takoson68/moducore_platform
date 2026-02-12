import { createStore } from "@/core";
import world from '@/world.js'
import { attachNotificationCollector } from "../notificationCollector.js";

const normalize = (item) => {
  const now = Date.now();
  return {
    id: item.id || `ntf-${now}-${Math.random().toString(36).slice(2, 6)}`,
    type: item.type || "system",
    title: item.title || "系統通知",
    content: item.content || "",
    created_at: typeof item.created_at === "number" ? item.created_at : now,
    read: Boolean(item.read),
  };
};

let collectorAttached = false;

export function createNotificationStore() {
  const store = createStore({
    name: "notificationStore",
    storageKey: "notificationStore",
    defaultValue: {
      list: [],
      unread: 0,
    },
    actions: {
      setList(storeRef, list = []) {
        const normalized = Array.isArray(list) ? list.map(normalize) : [];
        const unread = normalized.reduce((count, item) => count + (item.read ? 0 : 1), 0);
        storeRef.set({ list: normalized, unread });
      },
      addNotification(storeRef, item) {
        const state = storeRef.get();
        const notification = normalize(item);
        const nextList = [notification, ...state.list];
        const nextUnread = notification.read ? state.unread : state.unread + 1;
        storeRef.set({ ...state, list: nextList, unread: nextUnread });
      },
      markAsRead(storeRef, id) {
        const state = storeRef.get();
        let delta = 0;
        const list = state.list.map((n) => {
          if (n.id !== id) return n;
          if (!n.read) delta += 1;
          return { ...n, read: true };
        });
        storeRef.set({ ...state, list, unread: Math.max(0, state.unread - delta) });
      },
      markAllAsRead(storeRef) {
        const state = storeRef.get();
        const list = state.list.map((n) => ({ ...n, read: true }));
        storeRef.set({ ...state, list, unread: 0 });
      },
      clear(storeRef) {
        storeRef.set({ list: [], unread: 0 });
      },
    },
  });

  if (!collectorAttached) {
    const eventBus = world.service("eventBus");
    attachNotificationCollector(eventBus, store);
    collectorAttached = true;
  }

  return store;
}
