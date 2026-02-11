import world from '@/world.js'
import { taskApi } from "../api/taskApi.js";
import { notificationService } from "@project/modules/notification/services/notificationService.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function normalizeTask(task, fallback = {}) {
  const merged = {
    id: task?.id,
    title: task?.title || "",
    desc: task?.desc ?? task?.description ?? "",
    status: task?.status || "todo",
    publisher: task?.publisher || "",
    publisher_id: task?.publisher_id ?? null,
    assignee: task?.assignee || "",
    assignee_id: task?.assignee_id ?? null,
    priority: task?.priority || "medium",
    due_date: task?.due_date || "",
    members: Array.isArray(task?.members) ? task.members : [],
    events: Array.isArray(task?.events) ? task.events : [],
    ...fallback,
    ...task,
  };
  return merged;
}

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((t) => normalizeTask(t));
}

function resolveEmployeeId(name, employees = []) {
  if (!name) return null;
  const target = String(name).trim().toLowerCase();
  const match = employees.find((emp) => {
    const label = `${emp.name || ""} ${emp.username || ""} ${emp.email || ""}`.toLowerCase();
    return label.includes(target);
  });
  return match?.id ?? null;
}

function attachEmployeeIds(task, employees = []) {
  const next = { ...task };
  if (!next.publisher_id && next.publisher) {
    next.publisher_id = resolveEmployeeId(next.publisher, employees);
  }
  if (!next.assignee_id && next.assignee) {
    next.assignee_id = resolveEmployeeId(next.assignee, employees);
  }
  return next;
}

function getStore() {
  return world.store("taskStore");
}

export const taskService = {
  async fetchList() {
    const res = await taskApi.list();
    const payload = unwrap(res);
    const employees = Array.isArray(payload?.employees) ? payload.employees : [];
    const tasks = normalizeList(payload?.tasks ?? payload).map((task) =>
      attachEmployeeIds(task, employees)
    );
    const store = getStore();
    store.setTasks(tasks);
    store.setAssignees(employees);
    const activeId = store.state.activeTaskId;
    if (activeId) {
      await this.fetchDetail(activeId);
    }
    return tasks;
  },
  async fetchDetail(id) {
    if (!id) return null;
    const detail = unwrap(await taskApi.detail(id));
    if (!detail) return null;
    const store = getStore();
    const task = normalizeTask(detail);
    store.updateTask(id, task);
    return task;
  },

  async create(payload) {
    const created = normalizeTask(unwrap(await taskApi.create(payload)));
    getStore().addTask(created);
    try {
      world.store("notificationStore");
      await notificationService.fetchList();
    } catch {
      // notification module not available
    }
    return created;
  },

  async update(id, payload) {
    const updated = normalizeTask(unwrap(await taskApi.update(id, payload)));
    getStore().updateTask(id, updated);
    return updated;
  },

  async addEvent(taskId, payload) {
    const res = unwrap(await taskApi.addEvent(taskId, payload));
    if (res && res.id && Array.isArray(res.events)) {
      const task = normalizeTask(res);
      getStore().updateTask(taskId, task);
      return task;
    }
    const event = res?.event ? res.event : res;
    getStore().addEvent({
      taskId,
      user: event?.user,
      text: event?.text || "",
      type: event?.type || "note",
      created_at: event?.created_at,
    });
    return event;
  },

  async remove(id, userId) {
    await taskApi.remove(id, userId);
    getStore().removeTask(id);
  },
};
