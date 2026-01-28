import { container } from "@/app/container";
import { voteApi } from "../api/voteApi.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function getStore() {
  return container.resolve("voteStore");
}

export const voteService = {
  async fetchList() {
    const res = unwrap(await voteApi.list());
    const list = Array.isArray(res?.votes) ? res.votes : res;
    getStore().setList(list);
    return list;
  },

  async create(payload) {
    const created = unwrap(await voteApi.create(payload));
    const vote = created?.vote ?? created;
    getStore().addVote(vote);
    return vote;
  },

  async cast(id, selections) {
    const store = getStore();
    const user = (() => {
      try {
        return container.resolve("auth")?.state.user || { name: "匿名" };
      } catch {
        return { name: "匿名" };
      }
    })();
    const state = store.get();
    store.set({ ...state, currentUser: user?.name || "匿名" });
    const updated = unwrap(await voteApi.cast(id, selections, user));
    const vote = updated?.vote ?? updated;
    if (vote && vote.id) {
      store.updateVote(vote.id, vote);
      return vote;
    }
    store.castVote({ voteId: id, selections });
    return null;
  },

  async openResult(id) {
    const updated = unwrap(await voteApi.openResult(id));
    const vote = updated?.vote ?? updated;
    if (vote && vote.id) {
      getStore().updateVote(vote.id, vote);
      return vote;
    }
    getStore().openResult(id);
    return null;
  },

  async remove(id) {
    await voteApi.remove(id);
    getStore().removeVote(id);
  },
};
