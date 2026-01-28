// src/modules/member/services/memberService.js
import { container } from "@/app/container";
import { memberApi } from "../api/memberApi.js";

function unwrap(res) {
  if (res && typeof res === "object" && "data" in res) return res.data;
  return res;
}

function normalizeMember(member, fallback = {}) {
  const merged = { permission: "viewer", online: false, avatar: null, ...fallback, ...member };
  if (merged.avatar === undefined || merged.avatar === null || merged.avatar === "") {
    merged.avatar = null;
  }
  return merged;
}

function normalizeList(res) {
  if (Array.isArray(res)) return res.map((m) => normalizeMember(m));
  if (res && Array.isArray(res.data)) return res.data.map((m) => normalizeMember(m));
  return [];
}

function getStore() {
  try {
    return container.resolve("memberStore");
  } catch (err) {
    console.error('[memberService] memberStore 尚未註冊', err);
    throw err;
  }
}

export const memberService = {
  async fetchList() {
    try {
      const res = await memberApi.list();
      const members = normalizeList(unwrap(res));
      getStore().setMembers(members);
      return members;
    } catch (err) {
      console.error("[memberService] fetchList failed", err);
      throw err;
    }
  },

  async create(payload) {
    try {
      const created = unwrap(await memberApi.create(payload));
      if (!created) throw new Error("empty create response");
      const member = normalizeMember(created);
      getStore().addMember(member);
      return member;
    } catch (err) {
      console.error("[memberService] create failed", err);
      throw err;
    }
  },

  async update(id, payload) {
    try {
      const updated = unwrap(await memberApi.update(id, payload));
      if (!updated) throw new Error("empty update response");
      const member = normalizeMember({ ...updated, id: updated.id ?? id });
      getStore().updateMember(id, member);
      return member;
    } catch (err) {
      console.error("[memberService] update failed", err);
      throw err;
    }
  },

  async remove(id) {
    try {
      await memberApi.remove(id);
      getStore().deleteMember(id);
    } catch (err) {
      console.error("[memberService] remove failed", err);
      throw err;
    }
  },
};
