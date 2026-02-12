import { createStore } from "@/core";

export function createEmployeeStore() {
  return createStore({
    name: "employeeStore",
    storageKey: "employeeStore",
    defaultValue: {
      list: [],
      search: "",
      editorOpen: false,
      editingEmployee: null,
    },
    actions: {
      setSearch(store, text) {
        const state = store.get();
        store.set({ ...state, search: text });
      },
      openCreate(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: true, editingEmployee: null });
      },
      openEdit(store, employee) {
        const state = store.get();
        store.set({
          ...state,
          editorOpen: true,
          editingEmployee: employee ? { ...employee } : null,
        });
      },
      closeEditor(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: false, editingEmployee: null });
      },
      setList(store, list = []) {
        const state = store.get();
        store.set({ ...state, list: normalizeList(list) });
      },
      addEmployee(store, payload) {
        const state = store.get();
        const employee = normalizeEmployee(payload);
        store.set({ ...state, list: [...state.list, employee] });
      },
      updateEmployee(store, id, payload) {
        const current = store.get();
        const list = current.list.map((emp) =>
          emp.id === id ? normalizeEmployee({ ...emp, ...payload }) : emp
        );
        store.set({ ...current, list });
      },
      removeEmployee(store, id) {
        const state = store.get();
        const list = state.list.filter((emp) => emp.id !== id);
        const isEditingTarget = state.editingEmployee?.id === id;
        store.set({
          ...state,
          list,
          editingEmployee: isEditingTarget ? null : state.editingEmployee,
          editorOpen: isEditingTarget ? false : state.editorOpen,
        });
      },
    },
  });
}

function normalizeEmployee(employee, fallback = {}) {
  const merged = {
    status: "active",
    department: "",
    phone: "",
    password: employee?.password || "",
    ...fallback,
    ...employee,
  };
  return merged;
}

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((e) => normalizeEmployee(e));
}
