import { createStore } from "@/app/stores/_storeFactory.js";

export function createTaskStore() {
  return createStore({
    name: "taskStore",
    storageKey: "taskStore",
    defaultValue: {
      tasks: [],
      activeTaskId: null,
      assignees: [],
    },
    actions: {
      setAssignees(store, assignees = []) {
        const state = store.get();
        store.set({
          ...state,
          assignees: Array.isArray(assignees) ? assignees : [],
        });
      },
      setTasks(store, tasks = []) {
        const state = store.get();
        const safeList = Array.isArray(tasks) ? tasks : [];
        const hasActive = safeList.some((t) => t.id === state.activeTaskId);
        const activeId = hasActive ? state.activeTaskId : safeList[0]?.id ?? null;
        store.set({ ...state, tasks: safeList, activeTaskId: activeId });
      },
      selectTask(store, id) {
        const state = store.get();
        store.set({ ...state, activeTaskId: id });
      },
      addEvent(store, { taskId, user, text, type = "note", created_at }) {
        if (!text?.trim()) return;
        const state = store.get();
        const now = new Date();
        const stamp =
          created_at ||
          `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
            now.getDate()
          ).padStart(2, "0")} ${String(now.getHours()).padStart(2, "0")}:${String(
            now.getMinutes()
          ).padStart(2, "0")}`;
        const tasks = state.tasks.map((t) => {
          if (t.id !== taskId) return t;
          return {
            ...t,
            events: [
              ...(t.events || []),
              { user: user || "蝟餌絞", text: text.trim(), type, created_at: stamp },
            ],
          };
        });
        store.set({ ...state, tasks });
      },
      updateTask(store, id, payload) {
        const state = store.get();
        const tasks = state.tasks.map((t) => (t.id === id ? { ...t, ...payload } : t));
        store.set({ ...state, tasks });
      },
      removeTask(store, id) {
        const state = store.get();
        const tasks = state.tasks.filter((t) => t.id !== id);
        const activeTaskId = state.activeTaskId === id ? tasks[0]?.id ?? null : state.activeTaskId;
        store.set({ ...state, tasks, activeTaskId });
      },
      addTask(store, payload) {
        const state = store.get();
        const task = {
          id: payload.id,
          title: payload.title?.trim() || "Untitled task",
          desc: payload.desc?.trim() || "",
          status: payload.status || "todo",
          publisher: payload.publisher || "Unknown",
          publisher_id: payload.publisher_id ?? null,
          assignee: payload.assignee || "",
          assignee_id: payload.assignee_id ?? null,
          priority: payload.priority || "medium",
          due_date: payload.due_date || "",
          members: payload.members || [],
          events: payload.events || [],
        };
        store.set({ ...state, tasks: [task, ...state.tasks], activeTaskId: task.id });
      },
    },
  });
}
