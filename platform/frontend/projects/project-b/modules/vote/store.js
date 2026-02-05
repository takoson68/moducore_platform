import { createStore } from "@/app/stores/_storeFactory.js";
import { mockVotes } from "./api/mockVotes.js";

function normalizeVote(vote, fallback = {}) {
  const merged = {
    status: "open", // open | closed
    allowMultiple: false,
    anonymous: false,
    rule: { mode: "time", deadline: null, totalVoters: 0 },
    publisher: "未指定",
    publisher_id: null,
    publisher_user_id: null,
    options: [],
    votesReceived: 0,
    voted: false,
    mySelections: [],
    ...fallback,
    ...vote,
  };

  merged.options = (merged.options || []).map((o, idx) => ({
    id: o.id || `opt-${idx + 1}-${merged.id || ""}`,
    label: o.label || `選項 ${idx + 1}`,
    votes: Number(o.votes) || 0,
    voters: Array.isArray(o.voters) ? o.voters : [],
  }));

  if (!merged.rule) merged.rule = { mode: "time", deadline: null, totalVoters: 0 };
  merged.rule = {
    mode: merged.rule.mode || "time",
    deadline: merged.rule.deadline || null,
    totalVoters: Number(merged.rule.totalVoters) || 0,
  };

  return merged;
}

function normalizeList(list = []) {
  if (!Array.isArray(list)) return [];
  return list.map((v, idx) => normalizeVote(v, { id: v.id || `vote-${idx + 1}` }));
}

export function createVoteStore() {
  return createStore({
    name: "voteStore",
    storageKey: "voteStore",
    defaultValue: {
      list: normalizeList(mockVotes),
      search: "",
      editorOpen: false,
      detailOpen: false,
      activeVote: null,
      currentUser: null,
    },
    actions: {
      setSearch(store, text) {
        const state = store.get();
        store.set({ ...state, search: text });
      },
      openCreate(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: true, activeVote: null });
      },
      openDetail(store, vote) {
        const state = store.get();
        store.set({ ...state, detailOpen: true, activeVote: vote ? normalizeVote(vote) : null });
      },
      closeEditor(store) {
        const state = store.get();
        store.set({ ...state, editorOpen: false });
      },
      closeDetail(store) {
        const state = store.get();
        store.set({ ...state, detailOpen: false, activeVote: null });
      },
      setList(store, list = []) {
        const state = store.get();
        store.set({ ...state, list: normalizeList(list) });
      },
      addVote(store, payload) {
        const state = store.get();
        const nextId =
          state.list.reduce(
            (max, v) => Math.max(max, parseInt(String(v.id ?? "").replace(/\D/g, "") || "0", 10)),
            0
          ) + 1;
        const vote = normalizeVote({
          id: payload.id || `v-${nextId}`,
          ...payload,
        });
        store.set({ ...state, list: [vote, ...state.list], editorOpen: false });
      },
      updateVote(store, id, payload) {
        const state = store.get();
        const list = state.list.map((v) => (v.id === id ? normalizeVote({ ...v, ...payload }) : v));
        const activeVote =
          state.activeVote?.id === id ? normalizeVote({ ...state.activeVote, ...payload }) : state.activeVote;
        store.set({ ...state, list, activeVote });
      },
      removeVote(store, id) {
        const state = store.get();
        const list = state.list.filter((v) => v.id !== id);
        const isActive = state.activeVote?.id === id;
        store.set({
          ...state,
          list,
          activeVote: isActive ? null : state.activeVote,
          detailOpen: isActive ? false : state.detailOpen,
        });
      },
      castVote(store, { voteId, selections = [] }) {
        const state = store.get();
        const now = new Date();
        const list = state.list.map((v) => {
          if (v.id !== voteId) return v;
          const vote = normalizeVote(v);
          if (vote.status === "closed") return vote;

          const selectedIds = selections;
          const voter = state.currentUser || "匿名"; // filled at service layer
          vote.options = vote.options.map((o) =>
            selectedIds.includes(o.id)
              ? {
                  ...o,
                  votes: o.votes + 1,
                  voters: vote.anonymous ? undefined : [...(o.voters || []), voter],
                }
              : o
          );
          const votesReceived = vote.votesReceived + 1;
          vote.votesReceived = votesReceived;
          vote.voted = true;
          vote.mySelections = selectedIds;

          if (vote.rule?.mode === "all" && vote.rule.totalVoters > 0 && votesReceived >= vote.rule.totalVoters) {
            vote.status = "closed";
          }
          if (vote.rule?.mode === "time" && vote.rule.deadline) {
            const deadline = new Date(vote.rule.deadline);
            if (!isNaN(deadline) && now >= deadline) {
              vote.status = "closed";
            }
          }
          return vote;
        });
        const activeVote = list.find((v) => v.id === state.activeVote?.id) || null;
        store.set({ ...state, list, activeVote });
      },
      openResult(store, id) {
        const state = store.get();
        const list = state.list.map((v) => (v.id === id ? { ...v, status: "closed" } : v));
        const activeVote =
          state.activeVote?.id === id ? { ...state.activeVote, status: "closed" } : state.activeVote;
        store.set({ ...state, list, activeVote });
      },
    },
  });
}
