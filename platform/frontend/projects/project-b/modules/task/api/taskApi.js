// modules/task/api/taskApi.js
import world from '@/world.js'
import { mockTasks } from "./mockTasks.js";
import { mockEmployees } from "../../employee/api/mockEmployees.js";

function clone(data) {
  try {
    return structuredClone(data);
  } catch (err) {
    return JSON.parse(JSON.stringify(data));
  }
}

function delay(ms = 300) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

const http = world.http();
const mode = world.apiMode();

let mockDB = clone(mockTasks);

function buildMockEmployees(tasks = [], base = []) {
  const normalizedBase = Array.isArray(base) ? base : [];
  const maxId = normalizedBase.reduce(
    (max, emp) => Math.max(max, Number(emp?.id) || 0),
    0
  );
  const names = new Set();
  tasks.forEach((task) => {
    if (task?.publisher) names.add(task.publisher);
    if (task?.assignee) names.add(task.assignee);
  });

  let nextId = maxId + 1;
  const derived = [];
  names.forEach((name) => {
    if (!name) return;
    const exists = normalizedBase.some((emp) => {
      const label = `${emp.name || ""} ${emp.username || ""} ${emp.email || ""}`.trim();
      return label.toLowerCase().includes(String(name).toLowerCase());
    });
    if (!exists) {
      derived.push({ id: nextId++, name: String(name) });
    }
  });

  return normalizedBase.concat(derived);
}

export const taskApi = {
  async list() {
    if (mode === "real") {
      return http.get("/api/tasks/list");
    }
    await delay();
    const employees = buildMockEmployees(mockDB, mockEmployees);
    const summaries = mockDB.map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      publisher: task.publisher,
      assignee: task.assignee,
      due_date: task.due_date,
      publisher_id: task.publisher_id ?? null,
      assignee_id: task.assignee_id ?? null,
    }));
    return {
      tasks: clone(summaries),
      employees: clone(employees),
    };
  },
  async detail(id) {
    if (mode === "real") {
      return http.get(`/api/tasks/detail?id=${id}`);
    }
    await delay();
    const task = mockDB.find((item) => item.id === Number(id));
    if (!task) return null;
    return clone(task);
  },
  async create(payload) {
    if (mode === "real") {
      return http.post("/api/tasks/create", payload);
    }
    await delay();
    const nextId = mockDB.reduce((max, t) => Math.max(max, t.id), 0) + 1;
    const task = {
      id: nextId,
      title: payload.title?.trim() || "未命名任務",
      desc: payload.desc || "",
      status: payload.status || "todo",
      publisher: payload.publisher || "未指定",
      assignee: payload.assignee || "",
      priority: payload.priority || "medium",
      due_date: payload.due_date || "",
      members: payload.members || [],
      events: payload.events || [],
    };
    mockDB = [task, ...mockDB];
    return clone(task);
  },
  async update(id, payload) {
    if (mode === "real") {
      return http.post("/api/tasks/update", { id, ...payload });
    }
    await delay();
    mockDB = mockDB.map((t) => (t.id === id ? { ...t, ...payload } : t));
    return clone(mockDB.find((t) => t.id === id));
  },
  async addEvent(id, event) {
    if (mode === "real") {
      return http.post("/api/tasks/messages_create", { task_id: id, ...event });
    }
    await delay();
    mockDB = mockDB.map((t) => {
      if (t.id !== id) return t;
      return { ...t, events: [...(t.events || []), event] };
    });
    return clone(mockDB.find((t) => t.id === id));
  },
  async remove(id, userId) {
    if (mode === "real") {
      return http.post("/api/tasks/delete", { id, user_id: userId });
    }
    await delay();
    mockDB = mockDB.filter((t) => t.id !== id);
    return { success: true };
  },
};

export function resetMockTask() {
  mockDB = clone(mockTasks);
}
