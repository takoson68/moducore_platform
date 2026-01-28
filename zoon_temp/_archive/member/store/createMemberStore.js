// src/modules/member/store/createMemberStore.js
import { createStore } from "@/app/stores/_storeFactory.js";

export function createMemberStore() {
  const store = createStore({
    name: "memberStore",
    // storageKey: "memberStore",

    defaultValue: {
      members: [],
      search: "",
      page: 1,
      pageSize: 10,
      editorOpen: false,
      editingMember: null,
    },

    actions: {
      setSearch(store, text) {
        const state = store.get();
        store.set({ ...state, search: text, page: 1 });
      },

      setPage(store, page) {
        const state = store.get();
        store.set({ ...state, page });
      },

      startCreate(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: true, editingMember: null });
      },

      startEdit(store, member) {
        const state = store.get();
        store.set({
          ...state,
          editorOpen: true,
          editingMember: member ? { ...member } : null,
        });
      },

      closeEditor(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: false, editingMember: null });
      },

      setMembers(store, members = []) {
        const state = store.get();
        store.set({ ...state, members: normalizeList(members) });
      },

      addMember(store, payload) {
        const state = store.get();
        const member = normalizeMember(payload);
        store.set({ ...state, members: [...state.members, member] });
      },

      updateMember(store, id, payload) {
        const current = store.get();
        const members = current.members.map((m) => (m.id === id ? normalizeMember({ ...m, ...payload }) : m));
        store.set({ ...current, members });
      },

      deleteMember(store, id) {
        const state = store.get();
        const members = state.members.filter((m) => m.id !== id);
        const isEditingTarget = state.editingMember?.id === id;
        store.set({
          ...state,
          members,
          editingMember: isEditingTarget ? null : state.editingMember,
          editorOpen: isEditingTarget ? false : state.editorOpen,
        });
      },
    },
  });

  return store;
}

function normalizeMember(member, fallback = {}) {
  const merged = { permission: "viewer", online: false, avatar: null, ...fallback, ...member };
  if (merged.avatar === undefined || merged.avatar === null || merged.avatar === "") {
    merged.avatar = null;
  }
  return merged;
}

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((m) => normalizeMember(m));
}
