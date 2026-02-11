import world from '@/world.js'
import { voteApi } from "../api/voteApi.js";
import { notificationService } from "@project/modules/notification/services/notificationService.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function getStore() {
  return world.store("voteStore");
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
    try {
      world.store("notificationStore");
      await notificationService.fetchList();
    } catch {
      // notification module not available
    }
    return vote;
  },

  async cast(id, selections) {
    const store = getStore();
    const user = (() => {
      try {
        return world.store("auth")?.state.user || { name: "匿名" };
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
