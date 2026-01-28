import { container } from "@/app/container";
import { notificationApi } from "../api/notificationApi.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function getStore() {
  return container.resolve("notificationStore");
}

export const notificationService = {
  async fetchList() {
    const res = unwrap(await notificationApi.list());
    const list = Array.isArray(res?.data) ? res.data : res;
    getStore().setList(Array.isArray(list) ? list : []);
    return list;
  },

  async create(payload) {
    const created = unwrap(await notificationApi.create(payload));
    if (created?.id) {
      getStore().addNotification({ ...payload, id: created.id, read: false });
    }
    return created;
  },

  async markRead(id) {
    await notificationApi.markRead(id);
    getStore().markAsRead(id);
  },

  async clear() {
    await notificationApi.clear();
    getStore().clear();
  },
};
