// modules/vote/api/voteApi.js
import world from '@/world.js'
import { mockVotes } from "./mockVotes.js";

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

let mockDB = clone(mockVotes);

function applyVoteCloseRule(vote) {
  if (!vote?.rule) return vote;
  const next = { ...vote };
  if (next.rule.mode === "all" && next.rule.totalVoters > 0 && next.votesReceived >= next.rule.totalVoters) {
    next.status = "closed";
  }
  if (next.rule.mode === "time" && next.rule.deadline) {
    const deadline = new Date(next.rule.deadline);
    if (!isNaN(deadline) && Date.now() >= deadline.getTime()) {
      next.status = "closed";
    }
  }
  return next;
}

export const voteApi = {
  async list() {
    if (mode === "real") {
      return http.get("/api/vote/list");
    }
    await delay();
    return clone(mockDB);
  },
  async detail(id) {
    if (mode === "real") {
      return http.get(`/api/vote/detail?id=${id}`);
    }
    await delay();
    return clone(mockDB.find((item) => String(item.id) === String(id)) || null);
  },
  async create(payload) {
    if (mode === "real") {
      return http.post("/api/vote/create", payload);
    }
    await delay();
    const nextId = `v-${Date.now()}`;
    const vote = {
      id: payload.id || nextId,
      title: payload.title?.trim() || "Untitled Vote",
      description: payload.description || "",
      publisher: payload.publisher || "Unknown",
      allowMultiple: !!payload.allowMultiple,
      anonymous: !!payload.anonymous,
      status: payload.status || "open",
      rule: payload.rule || { mode: "time", deadline: null, totalVoters: 0 },
      votesReceived: payload.votesReceived ?? 0,
      options: (payload.options || []).map((opt, idx) => ({
        id: opt.id || `${nextId}-o${idx + 1}`,
        label: opt.label || `Option ${idx + 1}`,
        votes: Number(opt.votes) || 0,
        voters: Array.isArray(opt.voters) ? opt.voters : [],
      })),
    };
    mockDB = [vote, ...mockDB];
    return clone(vote);
  },
  async cast(id, selections = [], user = {}) {
    if (mode === "real") {
      return http.post("/api/vote/cast", {
        vote_id: id,
        selections,
        user_id: user?.id ?? null,
        user: user?.name ?? user?.username ?? null,
      });
    }
    await delay();
    mockDB = mockDB.map((vote) => {
      if (vote.id !== id) return vote;
      if (vote.status === "closed") return vote;
      const next = { ...vote };
      const selected = vote.allowMultiple ? selections : selections.slice(0, 1);
      const voterName = user?.name || user?.username || "Anonymous";
      next.options = next.options.map((opt) => {
        if (!selected.includes(opt.id)) return opt;
        return {
          ...opt,
          votes: (Number(opt.votes) || 0) + 1,
          voters: vote.anonymous ? opt.voters : [...(opt.voters || []), voterName],
        };
      });
      next.votesReceived = (Number(next.votesReceived) || 0) + 1;
      return applyVoteCloseRule(next);
    });
    return clone(mockDB.find((vote) => vote.id === id) || null);
  },
  async openResult(id) {
    if (mode === "real") {
      return http.post("/api/vote/open_result", { vote_id: id });
    }
    await delay();
    mockDB = mockDB.map((vote) => (vote.id === id ? { ...vote, status: "closed" } : vote));
    return clone(mockDB.find((vote) => vote.id === id) || null);
  },
  async remove(id) {
    if (mode === "real") {
      return http.post("/api/vote/delete", { id });
    }
    await delay();
    mockDB = mockDB.filter((vote) => vote.id !== id);
    return { success: true };
  },
};

export function resetMockVote() {
  mockDB = clone(mockVotes);
}
