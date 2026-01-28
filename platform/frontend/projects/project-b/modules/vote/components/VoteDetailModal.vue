<script setup>
import { computed, reactive, watch } from "vue";
import { useRouter } from "vue-router";
import { container } from "@/app/container";
import { voteService } from "../services/voteService.js";

const voteStore = container.resolve("voteStore");
const authStore = container.resolve("auth");
const router = useRouter();

const open = computed(() => voteStore.state.detailOpen);
const vote = computed(() => voteStore.state.activeVote);
const allowMultiple = computed(() => vote.value?.allowMultiple);
const isAnonymous = computed(() => vote.value?.anonymous);
const isClosed = computed(() => vote.value?.status === "closed");
const currentUser = computed(() => authStore.state.user?.name || "你");
const showVoters = computed(() => !isAnonymous.value);

const selection = reactive({
  picks: [],
});

watch(
  () => vote.value,
  (v) => {
    if (!v) {
      selection.picks = [];
      return;
    }
    selection.picks = [...(v.mySelections || [])];
  },
  { immediate: true }
);

function togglePick(optionId) {
  if (allowMultiple.value) {
    if (selection.picks.includes(optionId)) {
      selection.picks = selection.picks.filter((id) => id !== optionId);
    } else {
      selection.picks = [...selection.picks, optionId];
    }
  } else {
    selection.picks = [optionId];
  }
}

async function castVote() {
  if (!vote.value) return;
  if (selection.picks.length === 0) {
    alert("請先選擇選項");
    return;
  }
  try {
    await voteService.cast(vote.value.id, selection.picks);
  } catch (err) {
    console.error("[voteDetail] cast failed", err);
    alert("投票失敗，請稍後再試");
  }
}

function canCloseByAll(v) {
  if (!v || v.rule?.mode !== "all") return false;
  return v.rule.totalVoters > 0 && v.votesReceived >= v.rule.totalVoters;
}

function canCloseByTime(v) {
  if (!v || v.rule?.mode !== "time") return false;
  if (!v.rule.deadline) return false;
  const deadline = new Date(v.rule.deadline);
  return !isNaN(deadline) && Date.now() >= deadline.getTime();
}

function openResult() {
  if (!vote.value) return;
  voteService.openResult(vote.value.id);
}

async function removeVote() {
  if (!vote.value) return;
  const isPublisher = vote.value.publisher && vote.value.publisher === currentUser.value;
  const isAdmin = authStore.state.user?.role === "admin";
  if (!isPublisher && !isAdmin) {
    alert("只有管理者或發佈者可以刪除投票");
    return;
  }
  const ok = confirm("確定刪除這個投票嗎？");
  if (!ok) return;
  await voteService.remove(vote.value.id);
  close();
}

function close() {
  voteStore.closeDetail();
  if (router.currentRoute.value.path !== "/vote") {
    router.replace("/vote");
  }
}
</script>

<template lang="pug">
.detail-wrap(v-if="open" @click.self="close")
  .panel(v-if="vote")
    .panel-header
      .titles
        p.kicker 投票詳情
        h3 {{ vote.title }}
        p.subtitle {{ vote.description || '無描述' }}
      button.close-btn(type="button" @click="close") X

    .body
      .meta-row
        span.chip(:class="vote.status === 'closed' ? 'closed' : 'open'") {{ vote.status === 'closed' ? '已開票' : '投票中' }}
        span.chip {{ allowMultiple ? '多選' : '單選' }} · {{ isAnonymous ? '匿名' : '記名' }}
        span.chip 發佈者：{{ vote.publisher || '未指定' }}
        span.chip(v-if="vote.rule?.mode === 'all'") 全員投完即開票 ({{ vote.votesReceived }}/{{ vote.rule.totalVoters || '不限' }})
        span.chip(v-else) 開票時間：{{ vote.rule?.deadline || '未設定' }}

      .options
        label.option-row(v-for="opt in vote.options" :key="opt.id")
          input(
            v-if="!isClosed"
            :type="allowMultiple ? 'checkbox' : 'radio'"
            :name="vote.id"
            :value="opt.id"
            :checked="selection.picks.includes(opt.id)"
            @change="togglePick(opt.id)"
          )
          .info
            p.label {{ opt.label }}
            p.count 已得 {{ opt.votes }} 票
          .voters(v-if="showVoters")
            span(v-if="!opt.voters?.length" class="hint") 尚無記名投票
            span.voter-tag(v-for="(u, idx) in opt.voters" :key="idx") {{ u }}
          progress(:value="opt.votes" :max="Math.max(1, Math.max(...vote.options.map(o => o.votes)))")

      .actions
        button.primary(type="button" @click="castVote" :disabled="isClosed") 送出投票
        button.ghost(type="button" @click="openResult" :disabled="isClosed") 提早開票
        button.ghost(type="button" @click="openResult" :disabled="isClosed || !(canCloseByAll(vote) || canCloseByTime(vote))") 開票條件達成
        button.danger(type="button" @click="removeVote") 刪除投票

      .note 投票者：{{ currentUser }}
</template>

<style scoped lang="sass">
@use '@project/styles/sass/vars' as *

*
  box-sizing: border-box

.detail-wrap
  position: fixed
  inset: 0
  background: color-mix(in srgb, var(--text) 18%, transparent)
  backdrop-filter: blur(2px)
  display: flex
  justify-content: center
  align-items: center
  z-index: 30
  padding: 12px

.panel
  width: min(720px, 96vw)
  max-height: 90vh
  background: linear-gradient(175deg, var(--sys-1), color-mix(in srgb, var(--primary) 8%, var(--sys-1)))
  border-radius: 16px
  box-shadow: 0 18px 36px rgba(16, 40, 89, 0.28)
  border: 1px solid $borderColor
  overflow: hidden
  display: flex
  flex-direction: column
  animation: fade-in .22s ease

@keyframes fade-in
  from
    transform: translateY(6px)
    opacity: 0
  to
    transform: translateY(0)
    opacity: 1

.panel-header
  padding: 18px 20px
  border-bottom: 1px solid $borderColor
  display: flex
  justify-content: space-between
  gap: 12px

.titles h3
  margin: 6px 0 6px
  font-size: 22px

.titles .kicker
  margin: 0
  letter-spacing: 0.08em
  text-transform: uppercase
  color: $primaryColor
  font-size: 12px
  font-weight: 700

.subtitle
  margin: 0
  color: $sys_9

.close-btn
  border: none
  background: color-mix(in srgb, var(--primary) 12%, transparent)
  color: $txtColor
  width: 32px
  height: 32px
  border-radius: 10px
  cursor: pointer

.body
  padding: 18px 20px
  display: flex
  flex-direction: column
  gap: 14px
  overflow-y: auto

.meta-row
  display: flex
  gap: 8px
  flex-wrap: wrap

.chip
  padding: 8px 12px
  border-radius: 10px
  font-weight: 700
  background: color-mix(in srgb, var(--sys-1) 92%, var(--primary) 8%)
  border: 1px solid $borderColor

.chip.open
  color: $sys_6
  border-color: $sys_6
  background: color-mix(in srgb, var(--sys-6) 14%, var(--sys-1))

.chip.closed
  color: $sys_8
  border-color: $sys_8
  background: color-mix(in srgb, var(--sys-8) 14%, var(--sys-1))

.options
  display: flex
  flex-direction: column
  gap: 12px

.option-row
  display: grid
  grid-template-columns: auto 1fr
  gap: 10px
  align-items: center
  padding: 12px
  border: 1px solid $borderColor
  border-radius: 12px
  background: $sys_1

.info
  display: flex
  justify-content: space-between
  gap: 8px
  flex-wrap: wrap

.label
  margin: 0
  font-weight: 700

.count
  margin: 0
  color: $sys_9

progress
  grid-column: 1 / -1
  width: 100%
  height: 8px

.voters
  grid-column: 2 / span 1
  display: flex
  gap: 6px
  flex-wrap: wrap

.voter-tag
  padding: 4px 8px
  border-radius: 10px
  background: color-mix(in srgb, var(--primary) 10%, var(--sys-1))
  border: 1px solid $borderColor
  font-size: 12px
  color: $txtColor

.actions
  display: flex
  gap: 10px
  flex-wrap: wrap

.primary, .ghost, .danger
  padding: 10px 14px
  border-radius: 12px
  cursor: pointer
  border: 1px solid transparent
  font-weight: 700

.primary
  background: linear-gradient(135deg, $primaryColor, color-mix(in srgb, var(--primary) 70%, var(--sys-4)))
  color: $sys_1
  border: none

.ghost
  background: transparent
  color: $txtColor
  border: 1px solid $borderColor

.danger
  background: color-mix(in srgb, var(--sys-7) 12%, var(--sys-1))
  color: color-mix(in srgb, var(--sys-7) 70%, var(--sys-2))
  border: 1px solid color-mix(in srgb, var(--sys-7) 45%, var(--sys-1))

.primary:disabled, .ghost:disabled, .danger:disabled
  opacity: 0.5
  cursor: not-allowed

.note
  color: $sys_9
  margin: 0
</style>
