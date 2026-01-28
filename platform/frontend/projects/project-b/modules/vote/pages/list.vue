<script setup>
import { computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { container } from "@/app/container";
import { voteService } from "../services/voteService.js";
import VoteCreateModal from "../components/VoteCreateModal.vue";
import VoteDetailModal from "../components/VoteDetailModal.vue";

const voteStore = container.resolve("voteStore");
const route = useRoute();
const router = useRouter();

const votes = computed(() => {
  const keyword = voteStore.state.search.trim().toLowerCase();
  if (!keyword) return voteStore.state.list;
  return voteStore.state.list.filter((v) => {
    return (
      v.title.toLowerCase().includes(keyword) ||
      (v.description || "").toLowerCase().includes(keyword)
    );
  });
});

function setSearch(e) {
  voteStore.setSearch(e.target.value);
}

function openCreate() {
  voteStore.openCreate();
  if (route.path !== "/vote/create") {
    router.replace("/vote/create");
  }
}

function openDetail(vote) {
  voteStore.openDetail(vote);
  if (route.path !== `/vote/${vote.id}`) {
    router.replace(`/vote/${vote.id}`);
  }
}

function statusLabel(vote) {
  return vote.status === "closed" ? "已開票" : "投票中";
}

function ruleSummary(vote) {
  if (vote.rule?.mode === "all") {
    return `全員投完開票 (${vote.votesReceived}/${vote.rule.totalVoters || "不限"})`;
  }
  return `時間到開票${vote.rule?.deadline ? "：" + vote.rule.deadline : ""}`;
}

onMounted(() => {
  voteService.fetchList().catch((err) => {
    console.error("[vote/list] fetch votes failed", err);
  });
});

watch(
  [() => route.path, () => route.params.id, () => voteStore.state.list],
  () => {
    const isCreate = route.path === "/vote/create";
    const id = route.params.id;
    if (isCreate) {
      voteStore.openCreate();
    } else {
      voteStore.closeEditor();
    }
    if (id) {
      const found = voteStore.state.list.find((v) => String(v.id) === String(id));
      voteStore.openDetail(found || null);
    } else {
      voteStore.closeDetail();
    }
  },
  { immediate: true }
);
</script>

<template lang="pug">
.vote-page
  .toolbar
    .toolbar-main
      .search
        span.icon 🔍
        input(type="text" :value="voteStore.state.search" @input="setSearch" placeholder="搜尋投票")
      .pill 投票數 {{ voteStore.state.list.length }}
    .actions
      button.primary(@click="openCreate") 新增投票

  .vote-grid
    .vote-card(v-for="v in votes" :key="v.id")
      .card-head
        span.status(:class="v.status === 'closed' ? 'closed' : 'open'") {{ statusLabel(v) }}
        span.type {{ v.allowMultiple ? '多選' : '單選' }} · {{ v.anonymous ? '匿名' : '記名' }}
      h3 {{ v.title }}
      p.publisher 發佈者：{{ v.publisher || '未指定' }}
      p.desc {{ v.description || '無描述' }}
      .rule {{ ruleSummary(v) }}
      .options
        .option(v-for="o in v.options" :key="o.id")
          span {{ o.label }}
          span.count {{ o.votes }} 票
      .card-actions
        button.primary(type="button" @click="openDetail(v)") {{ v.status === 'closed' ? '查看結果' : '投票 / 詳情' }}

  VoteCreateModal
  VoteDetailModal
</template>

<style scoped lang="sass">
@use '@project/styles/sass/vars' as *

.vote-page
  padding: 18px
  // background: linear-gradient(160deg, $sysBg, color-mix(in srgb, var(--primary) 6%, $sys_1))
  flex: 1
  display: flex
  flex-direction: column
  gap: 14px
  overflow: auto

.toolbar
  display: flex
  align-items: center
  gap: 12px
  flex-wrap: nowrap
  padding-bottom: 4px

.toolbar-main
  display: flex
  align-items: center
  gap: 12px
  flex: 1 1 auto
  min-width: 0

.search
  display: flex
  align-items: center
  gap: 8px
  padding: 10px 12px
  border-radius: 12px
  border: 1px solid $borderColor
  background: $sys_1
  min-width: 220px
  max-width: 320px
  flex: 0 1 260px

.search input
  border: none
  outline: none
  font-size: 14px
  flex: 1

.pill
  padding: 10px 14px
  border-radius: 12px
  background: color-mix(in srgb, var(--sys-6) 12%, var(--sys-1))
  color: $sys_6
  border: 1px solid color-mix(in srgb, var(--sys-6) 40%, var(--sys-1))
  font-weight: 700
  white-space: nowrap

.actions
  display: flex
  align-items: center
  gap: 8px
  margin-left: auto

.primary
  height: 36px
  padding: 0 16px
  border-radius: 12px
  border: none
  background: linear-gradient(135deg, $primaryColor, $sys_4)
  color: $sys_1
  font-weight: 700
  cursor: pointer
  display: inline-flex
  align-items: center
  gap: 6px
  white-space: nowrap
  font-size: 13px
  line-height: 1

.vote-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr))
  gap: 12px

.vote-card
  padding: 14px
  border-radius: 14px
  border: 1px solid $borderColor
  background: $sys_1
  box-shadow: 0 10px 24px rgba(15,30,72,0.08)
  display: flex
  flex-direction: column
  gap: 8px

.card-head
  display: flex
  gap: 8px
  align-items: center

.status
  padding: 6px 10px
  border-radius: 10px
  font-weight: 700
  background: color-mix(in srgb, var(--sys-6) 14%, var(--sys-1))
  color: $sys_6

.status.closed
  background: color-mix(in srgb, var(--sys-8) 14%, var(--sys-1))
  color: $sys_8

.type
  padding: 6px 10px
  border-radius: 10px
  background: $sysBg
  color: $txtColor
  font-weight: 700

h3
  margin: 0
  font-size: 18px
  color: $txtColor

.desc
  margin: 0
  color: $sys_9
  font-size: 14px

.publisher
  margin: 0
  color: $sys_9
  font-size: 13px

.rule
  font-size: 13px
  color: $sys_9

.options
  display: flex
  flex-direction: column
  gap: 6px

.option
  display: flex
  justify-content: space-between
  background: $sysBg
  padding: 8px 10px
  border-radius: 10px
  color: $txtColor

.count
  color: $primaryColor
  font-weight: 700

.card-actions
  display: flex
  justify-content: flex-end
</style>
