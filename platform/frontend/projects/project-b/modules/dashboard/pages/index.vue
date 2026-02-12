<script setup>
import { computed, onMounted } from "vue";
import world from '@/world.js'
import { taskService } from "@project/modules/task/services/taskService.js";
import { employeeService } from "@project/modules/employee/services/employeeService.js";
import { voteService } from "@project/modules/vote/services/voteService.js";

const authStore = world.store("auth");
const taskStore = world.store("taskStore");
const employeeStore = world.store("employeeStore");
const voteStore = world.store("voteStore");

const userName = computed(() => {
  const user = authStore.state.user || {};
  return user.name || user.username || "夥伴";
});

const tasks = computed(() => taskStore.state.tasks || []);
const employees = computed(() => employeeStore.state.list || []);
const votes = computed(() => voteStore.state.list || []);

const statusLabels = {
  todo: "待處理",
  doing: "進行中",
  done: "已完成",
};

const priorityLabels = {
  high: "高",
  medium: "中",
  low: "低",
};

const priorityRank = {
  high: 3,
  medium: 2,
  low: 1,
};

function parseDate(value) {
  if (!value) return null;
  const raw = typeof value === "string" ? value.trim() : value;
  const direct = new Date(raw);
  if (!isNaN(direct)) return direct;
  if (typeof raw === "string" && raw.includes(" ")) {
    const fallback = new Date(raw.replace(" ", "T"));
    return isNaN(fallback) ? null : fallback;
  }
  return null;
}

function formatDate(value) {
  const date = parseDate(value);
  if (!date) return "未設定";
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}/${mm}/${dd}`;
}

function formatTimestamp(value) {
  if (!value) return "未記錄";
  const date = parseDate(value);
  if (!date) return String(value);
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const hh = String(date.getHours()).padStart(2, "0");
  const min = String(date.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${min}`;
}

function dueLabel(task) {
  if (!task?.due_date) return "未設定期限";
  const date = parseDate(task.due_date);
  if (!date) return "未設定期限";
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  if (target < today) return `已逾期 ${formatDate(date)}`;
  return `截止 ${formatDate(date)}`;
}

function voteRuleLabel(vote) {
  if (vote.rule?.mode === "all") {
    return `全員投完 (${vote.votesReceived}/${vote.rule.totalVoters || "不限"})`;
  }
  if (vote.rule?.deadline) {
    return `截止 ${formatDate(vote.rule.deadline)}`;
  }
  return "時間到開票";
}

function voteLeader(vote) {
  if (!Array.isArray(vote.options) || vote.options.length === 0) return null;
  return [...vote.options].sort((a, b) => (b.votes || 0) - (a.votes || 0))[0];
}

const taskStats = computed(() => {
  const items = tasks.value;
  const total = items.length;
  const todo = items.filter((t) => t.status === "todo").length;
  const doing = items.filter((t) => t.status === "doing").length;
  const done = items.filter((t) => t.status === "done").length;
  const active = todo + doing;
  return { total, todo, doing, done, active };
});

const dueSoon = computed(() => {
  const now = new Date();
  const base = new Date(now);
  base.setHours(0, 0, 0, 0);
  const within = new Date(base);
  within.setDate(within.getDate() + 7);
  return tasks.value
    .filter((t) => t.status !== "done" && t.due_date)
    .map((t) => ({ task: t, date: parseDate(t.due_date) }))
    .filter((item) => item.date && item.date <= within)
    .sort((a, b) => a.date - b.date)
    .map((item) => item.task)
    .slice(0, 5);
});

const activeTasks = computed(() => {
  return tasks.value
    .filter((t) => t.status !== "done")
    .sort((a, b) => {
      const rank = (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
      if (rank !== 0) return rank;
      const ad = parseDate(a.due_date)?.getTime() || Infinity;
      const bd = parseDate(b.due_date)?.getTime() || Infinity;
      return ad - bd;
    })
    .slice(0, 6);
});

const employeeStats = computed(() => {
  const list = employees.value;
  const total = list.length;
  const active = list.filter((e) => (e.status || "active") === "active").length;
  const inactive = total - active;
  return { total, active, inactive };
});

const departmentStats = computed(() => {
  const counter = new Map();
  employees.value.forEach((emp) => {
    const key = emp.department?.trim() || "未分類";
    counter.set(key, (counter.get(key) || 0) + 1);
  });
  return [...counter.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
});

const voteStats = computed(() => {
  const list = votes.value;
  const total = list.length;
  const open = list.filter((v) => v.status !== "closed").length;
  const closed = total - open;
  const votesReceived = list.reduce((sum, v) => sum + Number(v.votesReceived || 0), 0);
  return { total, open, closed, votesReceived };
});

const openVotes = computed(() => {
  return votes.value
    .filter((v) => v.status !== "closed")
    .slice(0, 4)
    .map((v) => {
      const leader = voteLeader(v);
      return {
        ...v,
        leader,
        totalVotes: Array.isArray(v.options)
          ? v.options.reduce((sum, o) => sum + Number(o.votes || 0), 0)
          : 0,
      };
    });
});

const recentActivities = computed(() => {
  const items = [];
  tasks.value.forEach((task) => {
    (task.events || []).forEach((event) => {
      items.push({
        title: task.title || "未命名任務",
        meta: event.text || "更新任務",
        user: event.user || "系統",
        time: formatTimestamp(event.created_at),
        sortTime: parseDate(event.created_at)?.getTime() || 0,
      });
    });
  });
  return items
    .sort((a, b) => b.sortTime - a.sortTime)
    .slice(0, 6);
});

const myTaskCount = computed(() => {
  const user = authStore.state.user || {};
  const userId = user.id;
  const tokens = [user.name, user.username, user.email]
    .filter(Boolean)
    .map((value) => String(value).toLowerCase());
  return tasks.value.filter((task) => {
    if (userId && task.assignee_id) return Number(task.assignee_id) === Number(userId);
    if (tokens.length === 0) return false;
    const label = String(task.assignee || "").toLowerCase();
    return tokens.some((token) => label.includes(token));
  }).length;
});

const kpiCards = computed(() => [
  {
    label: "任務總數",
    value: taskStats.value.total,
    hint: `進行中 ${taskStats.value.active}`,
    tone: "task",
  },
  {
    label: "待處理任務",
    value: taskStats.value.todo,
    hint: `高優先 ${tasks.value.filter((t) => t.priority === "high").length}`,
    tone: "todo",
  },
  {
    label: "完成任務",
    value: taskStats.value.done,
    hint: `本週到期 ${dueSoon.value.length}`,
    tone: "done",
  },
  {
    label: "員工人數",
    value: employeeStats.value.total,
    hint: `啟用 ${employeeStats.value.active}`,
    tone: "team",
  },
  {
    label: "投票總數",
    value: voteStats.value.total,
    hint: `開放中 ${voteStats.value.open}`,
    tone: "vote",
  },
  {
    label: "我的任務",
    value: myTaskCount.value,
    hint: "指派給你",
    tone: "me",
  },
]);

onMounted(async () => {
  const jobs = [
    { name: "task", run: () => taskService.fetchList() },
    { name: "employee", run: () => employeeService.fetchList() },
    { name: "vote", run: () => voteService.fetchList() },
  ];
  const results = await Promise.allSettled(jobs.map((job) => job.run()));
  results.forEach((result, idx) => {
    if (result.status === "rejected") {
      console.error(`[dashboard] ${jobs[idx].name} fetch failed`, result.reason);
    }
  });
});
</script>

<template lang="pug">
.dashboard
  header.hero
    .hero-main
      p.kicker 歡迎回來
      h1.hero-title {{ userName }} 的資訊總覽
      p.subtitle 集中查看任務進度、投票焦點與團隊狀況。
      .hero-meta
        span.meta-pill 進行中任務 {{ taskStats.active }}
        span.meta-pill 開放投票 {{ voteStats.open }}
        span.meta-pill 啟用員工 {{ employeeStats.active }}

    .hero-actions
      RouterLink.primary(to="/task") 任務看板
      RouterLink.ghost(to="/vote") 投票中心
      RouterLink.ghost(to="/employee") 員工管理

  section.kpi-grid
    article.kpi-card(
      v-for="kpi in kpiCards"
      :key="kpi.label"
      :class="`tone-${kpi.tone}`"
    )
      p.kpi-label {{ kpi.label }}
      p.kpi-value {{ kpi.value }}
      p.kpi-hint {{ kpi.hint }}

  section.grid
    article.panel.span
      .panel-head
        h2 任務焦點
        RouterLink.link(to="/task") 查看完整任務
      .panel-body.task-focus
        .stack
          h3 進行中任務
          ul.list
            li.task-row(v-for="task in activeTasks" :key="task.id")
              .row-main
                .row-title {{ task.title }}
                span.tag {{ statusLabels[task.status] || task.status }}
              .row-meta
                span.meta-item 責任人 {{ task.assignee || "未指派" }}
                span.meta-item 重要度 {{ priorityLabels[task.priority] || task.priority }}
                span.meta-item {{ dueLabel(task) }}
          p.empty(v-if="activeTasks.length === 0") 目前沒有進行中的任務
        .stack
          h3 七日到期
          ul.list
            li.task-row(v-for="task in dueSoon" :key="task.id")
              .row-main
                .row-title {{ task.title }}
                span.tag.warn {{ statusLabels[task.status] || task.status }}
              .row-meta
                span.meta-item 責任人 {{ task.assignee || "未指派" }}
                span.meta-item {{ dueLabel(task) }}
          p.empty(v-if="dueSoon.length === 0") 沒有即將到期的任務

    article.panel
      .panel-head
        h2 投票中心
        RouterLink.link(to="/vote") 查看投票
      .panel-body
        ul.list
          li.vote-row(v-for="vote in openVotes" :key="vote.id")
            .row-main
              .row-title {{ vote.title }}
              span.tag.open 投票中
            .row-meta
              span.meta-item {{ voteRuleLabel(vote) }}
              span.meta-item 已投 {{ vote.totalVotes }} 票
            .row-sub(v-if="vote.leader")
              span.leader 目前領先：{{ vote.leader.label }}
              span.count {{ vote.leader.votes }} 票
          li.vote-row.empty(v-if="openVotes.length === 0") 目前沒有開放投票

    article.panel.span
      .panel-head
        h2 團隊概況
        RouterLink.link(to="/employee") 查看員工
      .panel-body
        .stat-row
          .stat-box
            span.label 啟用
            span.value {{ employeeStats.active }}
          .stat-box
            span.label 停用
            span.value {{ employeeStats.inactive }}
        h3 部門分佈
        ul.list
          li.dept-row(v-for="dept in departmentStats" :key="dept.name")
            span.name {{ dept.name }}
            span.count {{ dept.count }} 人
          li.dept-row.empty(v-if="departmentStats.length === 0") 尚未設定部門

    article.panel.span
      .panel-head
        h2 近期動態
        span.panel-note 來自任務更新
      .panel-body
        ul.activity
          li.activity-row(v-for="(item, idx) in recentActivities" :key="idx")
            .row-main
              .row-title {{ item.title }}
              span.time {{ item.time }}
            .row-meta
              span.meta-item {{ item.user }}
              span.meta-item {{ item.meta }}
          li.activity-row.empty(v-if="recentActivities.length === 0") 目前沒有活動記錄
</template>

<style scoped lang="sass">
@use '@project/styles/sass/vars' as *

.dashboard
  padding: 24px
  min-height: 100%
  display: flex
  flex-direction: column
  gap: 20px
  // background: radial-gradient(circle at 20% 20%, color-mix(in srgb, $sys_4 18%, $sys_1), $sys_1 55%)
  font-family: $fontBase
  width: 100%
.hero
  display: flex
  justify-content: space-between
  align-items: flex-start
  gap: 16px
  padding: 18px
  border-radius: 16px
  background: linear-gradient(135deg, color-mix(in srgb, $sys_3 18%, $sys_1), $sys_1)
  border: 1px solid $borderColor
  box-shadow: 0 12px 28px rgba(18, 40, 90, 0.08)

.hero-main
  display: flex
  flex-direction: column
  gap: 6px
  flex: 1
.kicker
  margin: 0
  font-size: 12px
  letter-spacing: 1px
  text-transform: uppercase
  color: $sys_9

.hero-title
  margin: 0
  font-size: 24px
  color: $txtColor

.subtitle
  margin: 0
  color: $sys_9
  font-size: 14px

.hero-meta
  display: flex
  flex-wrap: wrap
  gap: 8px
  margin-top: 8px

.meta-pill
  padding: 6px 10px
  border-radius: 999px
  background: color-mix(in srgb, $sys_6 12%, $sys_1)
  border: 1px solid color-mix(in srgb, $sys_6 32%, $sys_1)
  font-size: 12px
  font-weight: 700
  color: $sys_6

.hero-actions
  display: flex
  gap: 10px
  flex-wrap: wrap
  align-items: center

.primary,
.ghost
  display: inline-flex
  align-items: center
  justify-content: center
  gap: 6px
  padding: 8px 14px
  border-radius: 12px
  text-decoration: none
  font-size: 13px
  font-weight: 700
  white-space: nowrap

.primary
  background: linear-gradient(135deg, $primaryColor, $sys_4)
  color: $sys_1
  border: none

.ghost
  border: 1px solid $borderColor
  color: $txtColor
  background: $sys_1

.kpi-grid
  display: grid
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr))
  gap: 12px

.kpi-card
  padding: 14px
  border-radius: 14px
  border: 1px solid $borderColor
  background: $sys_1
  box-shadow: 0 10px 22px rgba(18, 40, 90, 0.06)
  display: flex
  flex-direction: column
  gap: 4px

.kpi-label
  margin: 0
  font-size: 12px
  color: $sys_9
  font-weight: 700
  text-transform: uppercase
  letter-spacing: 0.6px

.kpi-value
  margin: 0
  font-size: 24px
  font-weight: 800
  color: $txtColor

.kpi-hint
  margin: 0
  font-size: 12px
  color: $sys_7
  font-weight: 600

.tone-task
  border-color: color-mix(in srgb, $sys_4 35%, $borderColor)

.tone-todo
  border-color: color-mix(in srgb, $sys_7 35%, $borderColor)

.tone-done
  border-color: color-mix(in srgb, $sys_6 35%, $borderColor)

.tone-team
  border-color: color-mix(in srgb, $sys_3 35%, $borderColor)

.tone-vote
  border-color: color-mix(in srgb, $sys_8 35%, $borderColor)

.tone-me
  border-color: color-mix(in srgb, $sys_5 35%, $borderColor)

.grid
  display: grid
  grid-template-columns: repeat(12, 1fr)
  gap: 12px

.panel
  grid-column: span 6
  padding: 16px
  border-radius: 16px
  border: 1px solid $borderColor
  background: $sys_1
  box-shadow: 0 10px 22px rgba(18, 40, 90, 0.06)
  display: flex
  flex-direction: column
  gap: 12px

.panel.span-2
  grid-column: span 8

.panel-head
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.panel-head h2
  margin: 0
  font-size: 16px
  color: $txtColor

.panel-note
  font-size: 12px
  color: $sys_9

.link
  font-size: 12px
  color: $primaryColor
  text-decoration: none
  font-weight: 700

.panel-body
  display: flex
  flex-direction: column
  gap: 12px

.task-focus
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 14px

.stack h3
  margin: 0
  font-size: 14px
  color: $txtColor

.list
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

.task-row,
.vote-row,
.dept-row,
.activity-row
  padding: 10px
  border-radius: 12px
  border: 1px solid color-mix(in srgb, $borderColor 70%, $sys_1)
  background: color-mix(in srgb, $sys_10 70%, $sys_1)
  display: flex
  flex-direction: column
  gap: 6px

.row-main
  display: flex
  align-items: center
  justify-content: space-between
  gap: 10px

.row-title
  font-weight: 700
  font-size: 14px
  color: $txtColor

.tag
  padding: 4px 8px
  border-radius: 999px
  font-size: 11px
  font-weight: 700
  background: color-mix(in srgb, $sys_4 14%, $sys_1)
  color: $sys_4

.tag.warn
  background: color-mix(in srgb, $sys_7 14%, $sys_1)
  color: $sys_7

.tag.open
  background: color-mix(in srgb, $sys_6 14%, $sys_1)
  color: $sys_6

.row-meta
  display: flex
  flex-wrap: wrap
  gap: 10px

.meta-item
  font-size: 12px
  color: $sys_9

.row-sub
  display: flex
  justify-content: space-between
  font-size: 12px
  color: $sys_6
  font-weight: 600

.leader
  color: $sys_3

.count
  color: $sys_7

.stat-row
  display: grid
  grid-template-columns: 1fr 1fr
  gap: 10px

.stat-box
  padding: 10px
  border-radius: 12px
  border: 1px dashed $borderColor
  background: $sys_10
  display: flex
  justify-content: space-between
  align-items: center

.stat-box .label
  font-size: 12px
  color: $sys_9
  font-weight: 700

.stat-box .value
  font-size: 18px
  font-weight: 800
  color: $txtColor

.dept-row
  flex-direction: row
  justify-content: space-between
  align-items: center

.dept-row .name
  font-weight: 600
  color: $txtColor

.dept-row .count
  font-size: 12px
  color: $sys_9

.activity
  list-style: none
  padding: 0
  margin: 0
  display: grid
  gap: 10px

.activity-row .time
  font-size: 12px
  color: $sys_9

.activity-row .row-meta
  gap: 6px

.empty
  border: 1px dashed $borderColor
  background: $sys_1
  text-align: center
  color: $sys_9
  font-size: 12px

@media (max-width: 1100px)
  .panel
    grid-column: span 12

  .panel.span-2
    grid-column: span 12

  .task-focus
    grid-template-columns: 1fr

@media (max-width: 720px)
  .hero
    flex-direction: column
    align-items: flex-start

  .hero-actions
    width: 100%

  .primary,
  .ghost
    flex: 1
</style>
